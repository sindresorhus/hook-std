'use strict';

const hook = (stream, opts, transform) => {
	if (typeof opts !== 'object') {
		transform = opts;
		opts = {};
	}

	opts = Object.assign({
		silent: true,
		once: false
	}, opts);

	let unhookFn;

	const promise = new Promise(resolve => {
		const {write} = stream;

		const unhook = () => {
			stream.write = write;
			resolve();
		};

		stream.write = (output, enc, cb) => {
			const cbRet = transform(String(output), unhook);

			if (opts.once) {
				unhook();
			}

			if (opts.silent) {
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

module.exports = (opts, transform) => {
	const streams = opts.streams || [process.stdout, process.stderr];
	const streamPromises = streams.map(stream => hook(stream, opts, transform));

	const promise = Promise.all(streamPromises);
	promise.unhook = () => {
		for (const streamPromise of streamPromises) {
			streamPromise.unhook();
		}
	};

	return promise;
};

module.exports.stdout = (...args) => hook(process.stdout, ...args);
module.exports.stderr = (...args) => hook(process.stderr, ...args);
