'use strict';

function hook(type, opts, cb) {
	if (typeof opts !== 'object') {
		cb = opts;
		opts = {};
	}

	opts = Object.assign({
		silent: true,
		once: false
	}, opts);

	const std = process[type];
	const write = std.write;

	const unhook = () => {
		std.write = write;
	};

	std.write = (str, enc, cb2) => {
		const cbRet = cb(str, enc);

		if (opts.once) {
			unhook();
		}

		if (opts.silent) {
			return typeof cbRet === 'boolean' ? cbRet : true;
		}

		const ret = Buffer.isBuffer(cbRet) || typeof cbRet === 'string' ? cbRet : str;
		return write.call(std, ret, enc, cb2);
	};

	return unhook;
}

module.exports = (opts, cb) => {
	const unhookStdout = hook('stdout', opts, cb);
	const unhookStderr = hook('stderr', opts, cb);

	return () => {
		unhookStdout();
		unhookStderr();
	};
};

module.exports.stdout = hook.bind(null, 'stdout');
module.exports.stderr = hook.bind(null, 'stderr');
