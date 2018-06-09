import {serial as test} from 'ava';
import m from '.';

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

	const promise = m(str => {
		if (str === 'foo' || str === 'bar') {
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

	const promise = m.stdout(str => {
		t.is(str, 'foo');
		promise.unhook();
		t.end();
	});

	process.stdout.write('foo');
});

test.cb('hook stderr', t => {
	t.plan(1);

	const promise = m.stderr(str => {
		t.is(str, 'foo');
		promise.unhook();
		t.end();
	});

	process.stderr.write('foo');
});

function loggingWrite(log, retVal) {
	return (...items) => {
		while (items[items.length - 1] === undefined) {
			items.pop();
		}

		log.push(items);

		return retVal();
	};
}

test('passes through the return value of the underlying write call', t => {
	t.plan(3);

	const log = [];
	let returnValue = false;

	process.stdout = {
		write: loggingWrite(log, () => returnValue)
	};

	m.stdout({silent: false}, str => str);

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

	m.stdout(str => {
		log.push(str);
		return str;
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

	m.stdout(str => {
		log.push(str);
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

	m.stdout({silent: false}, str => Buffer.from(str));

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

	m.stdout(str => str);

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

	m.stdout({once: true}, str => str);

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

	m.stdout({silent: false, once: true}, str => {
		hookReturnValue = str;
		return str;
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

	m.stdout(str => log.push(str));

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

	m.stdout({silent: false}, () => 'tést');

	t.is(process.stdout.write('foo', 'hex'), '74c3a97374');
	t.is(process.stdout.write('bar', 'ascii'), 'tC)st');
});

test('string returned by callback is not converted if encoding is invalid', t => {
	t.plan(4);

	process.stdout = {
		write: output => output
	};

	m.stdout({silent: false}, () => 'tést');

	t.is(process.stdout.write('foo', 123), 'tést');
	t.is(process.stdout.write('bar', null), 'tést');
	t.is(process.stdout.write('ping', {}), 'tést');
	t.is(process.stdout.write('pong', () => {}), 'tést');
});

test('promise resolves when stdout & stderr are hooked and released via promise unhook method', async t => {
	t.plan(1);
	const log = [];

	const promise = m(str => log.push(str));

	process.stdout.write('foo');
	process.stderr.write('bar');
	t.deepEqual(log, ['foo', 'bar']);

	promise.unhook();
	await promise;
});

test('promise resolves when stdout & stderr are hooked and released via callback', async t => {
	t.plan(1);
	const log = [];

	const promise = m((str, unhook) => {
		log.push(str);
		unhook();
	});

	process.stdout.write('foo');
	process.stderr.write('bar');
	t.deepEqual(log, ['foo', 'bar']);

	await promise;
});

test('promise resolves when stdout is released via promise unhook method', async t => {
	t.plan(1);
	const promise = m.stdout(str => {
		t.is(str, 'foo');
	});
	process.stdout.write('foo');
	promise.unhook();
	await promise;
});

test('promise resolves when stderr is released via promise unhook method', async t => {
	t.plan(1);
	const promise = m.stderr(str => {
		t.is(str, 'foo');
	});
	process.stderr.write('foo');
	promise.unhook();
	await promise;
});
