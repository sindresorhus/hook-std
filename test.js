import {serial as test} from 'ava';
import hookStd from '.';

const {stdout, stderr} = process;

function restore() {
	// This craziness is required because these properties only have getters by default
	Object.defineProperties(process, {
		stdout: {
			configurable: true,
			writable: true,
			value: stdout
		},
		stderr: {
			configurable: true,
			writable: true,
			value: stderr
		}
	});
}

test.beforeEach(restore);
test.afterEach(restore);

test.cb('hook stdout & stderr', t => {
	t.plan(2);

	let i = 0;

	const promise = hookStd(string => {
		if (string === 'foo' || string === 'bar') {
			t.pass();
		}

		if (++i === 2) {
			promise.unhook();
			t.end();
		}
	});

	process.stdout.write('foo');
	process.stderr.write('bar');
});

test.cb('hook stdout', t => {
	t.plan(1);

	const promise = hookStd.stdout(string => {
		t.is(string, 'foo');
		promise.unhook();
		t.end();
	});

	process.stdout.write('foo');
});

test.cb('hook stderr', t => {
	t.plan(1);

	const promise = hookStd.stderr(string => {
		t.is(string, 'foo');
		promise.unhook();
		t.end();
	});

	process.stderr.write('foo');
});

test.cb('hook custom stream', t => {
	t.plan(1);
	const streams = [{write: () => {}}];

	let i = 0;

	const promise = hookStd({streams}, string => {
		if (string === 'foo') {
			t.pass();
		}

		if (++i === 1) {
			promise.unhook();
			t.end();
		}
	});

	streams[0].write('foo');
});

function loggingWrite(log, returnValueValue) {
	return (...items) => {
		while (items[items.length - 1] === undefined) {
			items.pop();
		}

		log.push(items);

		return returnValueValue();
	};
}

test('passes through the return value of the underlying write call', t => {
	t.plan(3);

	const log = [];
	let returnValue = false;

	process.stdout = {
		write: loggingWrite(log, () => returnValue)
	};

	hookStd.stdout({silent: false}, string => string);

	t.false(process.stdout.write('foo'));
	returnValue = true;
	t.true(process.stdout.write('bar'));
	t.deepEqual(log, [['foo'], ['bar']]);
});

test('if silent, returns true by default', t => {
	t.plan(2);
	const log = [];

	process.stdout = {
		write: () => t.fail()
	};

	hookStd.stdout(string => {
		log.push(string);
		return string;
	});

	t.true(process.stdout.write('foo'));
	t.deepEqual(log, ['foo']);
});

test('if silent, callback can return a boolean', t => {
	t.plan(3);
	const log = [];
	let returnValue = true;

	process.stdout = {
		write: () => t.fail()
	};

	hookStd.stdout(string => {
		log.push(string);
		return returnValue;
	});

	t.true(process.stdout.write('foo'));
	returnValue = false;
	t.false(process.stdout.write('bar'));
	t.deepEqual(log, ['foo', 'bar']);
});

test('callback can return a buffer', t => {
	t.plan(3);
	const log = [];

	process.stdout = {
		write: loggingWrite(log, () => true)
	};

	hookStd.stdout({silent: false}, string => Buffer.from(string));

	t.true(process.stdout.write('foo'));
	t.true(process.stdout.write('bar'));
	t.deepEqual(log, [[Buffer.from('foo')], [Buffer.from('bar')]]);
});

test('if no options are assigned, behave as silent', t => {
	t.plan(1);
	const log = [];
	let returnValue = false;

	process.stdout = {
		write: loggingWrite(log, () => returnValue)
	};

	hookStd.stdout(string => string);

	process.stdout.write('foo');
	returnValue = true;
	t.deepEqual(log, []);
});

test('if once option is true, only the first write is silent', t => {
	t.plan(1);
	let returnValue;
	const log = [];

	process.stdout = {
		write: loggingWrite(log, () => returnValue)
	};

	hookStd.stdout({once: true}, string => string);

	process.stdout.write('foo');
	process.stdout.write('bar');
	process.stdout.write('unicorn');

	t.deepEqual(log, [['bar'], ['unicorn']]);
});

test('if once option is true and silent is false, hook only prints the first write and std prints all writes', t => {
	t.plan(4);
	let hookReturnValue;
	const log = [];

	process.stdout = {
		write: loggingWrite(log, () => true)
	};

	hookStd.stdout({silent: false, once: true}, string => {
		hookReturnValue = string;
		return string;
	});

	process.stdout.write('foo');
	t.deepEqual(hookReturnValue, 'foo');
	t.deepEqual(log, [['foo']]);

	hookReturnValue = false;

	process.stdout.write('bar');
	t.deepEqual(hookReturnValue, false);
	t.deepEqual(log, [['foo'], ['bar']]);
});

test('output is converted to string', t => {
	t.plan(4);
	const log = [];

	hookStd.stdout(string => log.push(string));

	process.stdout.write('foo');
	t.deepEqual(log, ['foo']);

	process.stdout.write(123);
	t.deepEqual(log, ['foo', '123']);

	process.stdout.write({});
	t.deepEqual(log, ['foo', '123', '[object Object]']);

	process.stdout.write(true);
	t.deepEqual(log, ['foo', '123', '[object Object]', 'true']);
});

test('string returned by callback is converted to correct encoding', t => {
	t.plan(2);

	process.stdout = {
		write: output => output
	};

	hookStd.stdout({silent: false}, () => 'tést');

	t.is(process.stdout.write('foo', 'hex'), '74c3a97374');
	t.is(process.stdout.write('bar', 'ascii'), 'tC)st');
});

test('string returned by callback is not converted if encoding is invalid', t => {
	t.plan(4);

	process.stdout = {
		write: output => output
	};

	hookStd.stdout({silent: false}, () => 'tést');

	t.is(process.stdout.write('foo', 123), 'tést');
	t.is(process.stdout.write('bar', null), 'tést');
	t.is(process.stdout.write('ping', {}), 'tést');
	t.is(process.stdout.write('pong', () => {}), 'tést');
});

test('promise resolves when stdout & stderr are hooked and released via promise unhook method', async t => {
	t.plan(1);
	const log = [];

	const promise = hookStd(string => log.push(string));

	process.stdout.write('foo');
	process.stderr.write('bar');
	t.deepEqual(log, ['foo', 'bar']);

	promise.unhook();
	await promise;
});

test('promise resolves when stdout & stderr are hooked and released via callback', async t => {
	t.plan(1);
	const log = [];

	const promise = hookStd((string, unhook) => {
		log.push(string);
		unhook();
	});

	process.stdout.write('foo');
	process.stderr.write('bar');
	t.deepEqual(log, ['foo', 'bar']);

	await promise;
});

test('promise resolves when stdout is released via promise unhook method', async t => {
	t.plan(1);
	const promise = hookStd.stdout(string => {
		t.is(string, 'foo');
	});
	process.stdout.write('foo');
	promise.unhook();
	await promise;
});

test('promise resolves when stderr is released via promise unhook method', async t => {
	t.plan(1);
	const promise = hookStd.stderr(string => {
		t.is(string, 'foo');
	});
	process.stderr.write('foo');
	promise.unhook();
	await promise;
});

test('promise resolves when streams are hooked and released via callback', async t => {
	t.plan(1);
	const log = [];
	const streams = [{write: () => {}}, {write: () => {}}];

	const promise = hookStd({streams}, (string, unhook) => {
		log.push(string);
		unhook();
	});

	streams[0].write('foo');
	streams[1].write('bar');
	t.deepEqual(log, ['foo', 'bar']);

	await promise;
});
