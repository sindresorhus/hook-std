'use strict';

function hook(type, opts, cb) {
	if (typeof opts !== 'object') {
		cb = opts;
		opts = {};
		opts = Object.assign({silent: true}, opts);
	}

	const std = process[type];
	const write = std.write;

	std.write = (str, enc, cb2) => {
		const cbRet = cb(str, enc);

		if (opts.silent) {
			return typeof cbRet === 'boolean' ? cbRet : true;
		}

		const ret = Buffer.isBuffer(cbRet) || typeof cbRet === 'string' ? cbRet : str;
		return write.call(std, ret, enc, cb2);
	};

	return () => {
		std.write = write;
	};
}

const x = module.exports = (opts, cb) => {
	const unhookStdout = hook('stdout', opts, cb);
	const unhookStderr = hook('stderr', opts, cb);

	return () => {
		unhookStdout();
		unhookStderr();
	};
};

x.stdout = hook.bind(null, 'stdout');
x.stderr = hook.bind(null, 'stderr');
