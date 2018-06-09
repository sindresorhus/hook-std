'use strict';

const hook = (type, opts, transform) => {
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
		const std = process[type];
		const {write} = std;

		const unhook = () => {
			std.write = write;
			resolve();
		};

		std.write = (output, enc, cb) => {
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

			return write.call(std, ret, enc, cb);
		};

		unhookFn = unhook;
	});

	promise.unhook = unhookFn;

	return promise;
};

module.exports = (opts, transform) => {
	const stdoutPromise = hook('stdout', opts, transform);
	const stderrPromise = hook('stderr', opts, transform);

	const promise = Promise.all([stdoutPromise, stderrPromise]);
	promise.unhook = () => {
		stdoutPromise.unhook();
		stderrPromise.unhook();
	};

	return promise;
};

module.exports.stdout = hook.bind(null, 'stdout');
module.exports.stderr = hook.bind(null, 'stderr');
