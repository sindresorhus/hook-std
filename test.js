import test from 'ava';
import m from '.';

const stdout = process.stdout;
const stderr = process.stderr;

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

test.serial.cb('hook stdout & stderr', t => {
	t.plan(2);

	let i = 0;

	const unhook = m(str => {
		if (str === 'foo' || str === 'bar') {
			t.pass();
		}

		if (++i === 2) {
			unhook();
			t.end();
		}
	});

	process.stdout.write('foo');
	process.stderr.write('bar');
});

test.serial.cb('hook stdout', t => {
	t.plan(1);

	const unhook = m.stdout(str => {
		t.is(str, 'foo');
		unhook();
		t.end();
	});

	process.stdout.write('foo');
});

test.serial.cb('hook stderr', t => {
	t.plan(1);

	const unhook = m.stderr(str => {
		t.is(str, 'foo');
		unhook();
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

test.serial('passes through the return value of the underlying write call', t => {
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

test.serial('if silent, returns true by default', t => {
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

test.serial('if silent, callback can return a boolean', t => {
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

test.serial('callback can return a buffer', t => {
	const log = [];

	process.stdout = {
		write: loggingWrite(log, () => true)
	};

	m.stdout({silent: false}, str => Buffer.from(str));

	t.true(process.stdout.write('foo'));
	t.true(process.stdout.write('bar'));
	t.deepEqual(log, [[Buffer.from('foo')], [Buffer.from('bar')]]);
});

test.serial('callback receives encoding type', t => {
	const log = [];

	process.stdout = {
		write: () => t.fail()
	};

	m.stdout(loggingWrite(log, () => true));

	t.true(process.stdout.write('a9fe', 'hex'));
	t.true(process.stdout.write('a234', 'hex'));
	t.deepEqual(log, [['a9fe', 'hex'], ['a234', 'hex']]);
});

test.serial('if no options are assigned, behave as silent', t => {
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

test.serial('if once option is true, only the first write is silent', t => {
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

test.serial('if once option is true and silent is false, hook prints the first write and std the next write ', t => {
	let hookReturnValue;
	const log = [];

	process.stdout = {
		write: loggingWrite(log, () => true)
	};

	m.stdout({silence: false, once: true}, str => {
		hookReturnValue = str;
		return str;
	});

	process.stdout.write('foo');
	t.deepEqual(hookReturnValue, 'foo');
	t.deepEqual(log, []);

	hookReturnValue = false;

	process.stdout.write('bar');
	t.deepEqual(hookReturnValue, false);
	t.deepEqual(log, [['bar']]);
});
