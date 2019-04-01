'use strict';

const hook = (stream, options, transform) => {
	if (typeof options !== 'object') {
		transform = options;
		options = {};
	}

	options = Object.assign({
		silent: true,
		once: false
	}, options);

	let unhookFn;

	const promise = new Promise(resolve => {
		const {write} = stream;

		const unhook = () => {
			stream.write = write;
			resolve();
		};

		stream.write = (output, enc, cb) => {
			const cbRet = transform(String(output), unhook);

			if (options.once) {
				unhook();
			}

			if (options.silent) {
				return typeof cbRet === 'boolean' ? cbRet : true;
			}

			let ret;
			if (typeof cbRet === 'string') {
				ret = typeof enc === 'string' ? Buffer.from(cbRet).toString(enc) : cbRet;
			}

			ret = ret || (Buffer.isBuffer(cbRet) ? cbRet : output);

			return write.call(stream, ret, enc, cb);
		};

		unhookFn = unhook;
	});

	promise.unhook = unhookFn;

	return promise;
};

const hookStd = (options, transform) => {
	const streams = options.streams || [process.stdout, process.stderr];
	const streamPromises = streams.map(stream => hook(stream, options, transform));

	const promise = Promise.all(streamPromises);
	promise.unhook = () => {
		for (const streamPromise of streamPromises) {
			streamPromise.unhook();
		}
	};

	return promise;
};

hookStd.stdout = (...args) => hook(process.stdout, ...args);
hookStd.stderr = (...args) => hook(process.stderr, ...args);

module.exports = hookStd;
