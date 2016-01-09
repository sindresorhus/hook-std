import test from 'ava';
import fn from './';

const stdout = process.stdout;
const stderr = process.stderr;

function restore() {
	// This craziness is required because these properties only have getters by default.
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

	const unhook = fn({silent: true}, str => {
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

	const unhook = fn.stdout({silent: true}, str => {
		t.is(str, 'foo');
		unhook();
		t.end();
	});

	process.stdout.write('foo');
});

test.serial.cb('hook stderr', t => {
	t.plan(1);

	const unhook = fn.stderr({silent: true}, str => {
		t.is(str, 'foo');
		unhook();
		t.end();
	});

	process.stderr.write('foo');
});

function loggingWrite(log, retVal) {
	return function () {
		var items = Array.prototype.slice.call(arguments);
		while (items[items.length - 1] === undefined) {
			items.pop();
		}
		log.push(items);
		return retVal();
	};
}

test.serial('passes through the return value of the underlying write call', t => {
	let returnValue = false;
	const log = [];

	process.stdout = {
		write: loggingWrite(log, () => returnValue)
	};

	fn.stdout(str => str);

	t.false(process.stdout.write('foo'));
	returnValue = true;
	t.true(process.stdout.write('bar'));
	t.same(log, [['foo'], ['bar']]);
});

test.serial('if silent, returns true by default', t => {
	const log = [];
	process.stdout = {
		write: () => t.fail()
	};

	fn.stdout({silent: true}, str => {
		log.push(str);
		return str;
	});

	t.true(process.stdout.write('foo'));
	t.same(log, ['foo']);
});

test.serial('if silent, callback can return a boolean', t => {
	const log = [];
	let returnValue = true;

	process.stdout = {
		write: () => t.fail()
	};

	fn.stdout({silent: true}, str => {
		log.push(str);
		return returnValue;
	});

	t.true(process.stdout.write('foo'));
	returnValue = false;
	t.false(process.stdout.write('bar'));
	t.same(log, ['foo', 'bar']);
});

test.serial('callback can return a buffer', t => {
	const log = [];

	process.stdout = {
		write: loggingWrite(log, () => true)
	};

	fn.stdout(str => new Buffer(str));

	t.true(process.stdout.write('foo'));
	t.true(process.stdout.write('bar'));
	t.same(log, [[new Buffer('foo')], [new Buffer('bar')]]);
});
