import process from 'node:process';
import {Buffer} from 'node:buffer';
import test from 'ava';
import {hookStd, hookStdout, hookStderr} from './index.js';

const {stdout, stderr} = process;

function restore() {
	// This craziness is required because these properties only have getters by default.
	Object.defineProperties(process, {
		stdout: {
			configurable: true,
			writable: true,
			value: stdout,
		},
		stderr: {
			configurable: true,
			writable: true,
			value: stderr,
		},
	});
}

test.beforeEach(restore);
test.afterEach(restore);

test('hook stdout & stderr', async t => {
	t.plan(2);

	let index = 0;

	const promise = hookStd(string => {
		if (string === 'foo' || string === 'bar') {
			t.pass();
		}

		if (++index === 2) {
			promise.unhook();
		}
	});

	process.stdout.write('foo');
	process.stderr.write('bar');

	await promise;
});

test('hook stdout', async t => {
	t.plan(1);

	const promise = hookStdout(string => {
		t.is(string, 'foo');
		promise.unhook();
	});

	process.stdout.write('foo');
	await promise;
});

test('hook stderr', async t => {
	t.plan(1);

	const promise = hookStderr(string => {
		t.is(string, 'foo');
		promise.unhook();
	});

	process.stderr.write('foo');
	await promise;
});

test('hook custom stream', async t => {
	t.plan(1);
	const streams = [{write() {}}];

	let index = 0;

	const promise = hookStd({streams}, string => {
		if (string === 'foo') {
			t.pass();
		}

		if (++index === 1) {
			promise.unhook();
		}
	});

	streams[0].write('foo');
	await promise;
});

function loggingWrite(log, returnValueValue) {
	return (...items) => {
		while (items.at(-1) === undefined) {
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
		write: loggingWrite(log, () => returnValue),
	};

	hookStdout({silent: false}, string => string);

	t.false(process.stdout.write('foo'));
	returnValue = true;
	t.true(process.stdout.write('bar'));
	t.deepEqual(log, [['foo'], ['bar']]);
});

test('if silent, returns true by default', t => {
	t.plan(2);
	const log = [];

	process.stdout = {
		write: () => t.fail(),
	};

	hookStdout(string => {
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
		write: () => t.fail(),
	};

	hookStdout(string => {
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
		write: loggingWrite(log, () => true),
	};

	hookStdout({silent: false}, string => Buffer.from(string));

	t.true(process.stdout.write('foo'));
	t.true(process.stdout.write('bar'));
	t.deepEqual(log, [[Buffer.from('foo')], [Buffer.from('bar')]]);
});

test('if no options are assigned, behave as silent', t => {
	t.plan(1);
	const log = [];
	let returnValue = false;

	process.stdout = {
		write: loggingWrite(log, () => returnValue),
	};

	hookStdout(string => string);

	process.stdout.write('foo');
	returnValue = true;
	t.deepEqual(log, []);
});

test('if once option is true, only the first write is silent', t => {
	t.plan(1);
	let returnValue;
	const log = [];

	process.stdout = {
		write: loggingWrite(log, () => returnValue),
	};

	hookStdout({once: true}, string => string);

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
		write: loggingWrite(log, () => true),
	};

	hookStdout({silent: false, once: true}, string => {
		hookReturnValue = string;
		return string;
	});

	process.stdout.write('foo');
	t.is(hookReturnValue, 'foo');
	t.deepEqual(log, [['foo']]);

	hookReturnValue = false;

	process.stdout.write('bar');
	t.is(hookReturnValue, false);
	t.deepEqual(log, [['foo'], ['bar']]);
});

test('output is converted to string', t => {
	t.plan(4);
	const log = [];

	hookStdout(string => log.push(string));

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
		write: output => output,
	};

	hookStdout({silent: false}, () => 'tést');

	t.is(process.stdout.write('foo', 'hex'), '74c3a97374');
	t.is(process.stdout.write('bar', 'ascii'), 'tC)st');
});

test('string returned by callback is not converted if encoding is invalid', t => {
	t.plan(4);

	process.stdout = {
		write: output => output,
	};

	hookStdout({silent: false}, () => 'tést');

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
	const promise = hookStdout(string => {
		t.is(string, 'foo');
	});
	process.stdout.write('foo');
	promise.unhook();
	await promise;
});

test('promise resolves when stderr is released via promise unhook method', async t => {
	t.plan(1);
	const promise = hookStderr(string => {
		t.is(string, 'foo');
	});
	process.stderr.write('foo');
	promise.unhook();
	await promise;
});

test('promise resolves when streams are hooked and released via callback', async t => {
	t.plan(1);
	const log = [];
	const streams = [{write() {}}, {write() {}}];

	const promise = hookStd({streams}, (string, unhook) => {
		log.push(string);
		unhook();
	});

	streams[0].write('foo');
	streams[1].write('bar');
	t.deepEqual(log, ['foo', 'bar']);

	await promise;
});

test('collects output when no transform provided to hookStdout', t => {
	t.plan(2);

	const promise = hookStdout();

	process.stdout.write('foo');
	process.stdout.write('bar');

	t.is(promise.output, 'foobar');

	process.stdout.write('baz');
	t.is(promise.output, 'foobarbaz');

	promise.unhook();
});

test('collects output when no transform provided to hookStderr', t => {
	t.plan(2);

	const promise = hookStderr();

	process.stderr.write('error1');
	process.stderr.write('error2');

	t.is(promise.output, 'error1error2');

	process.stderr.write('error3');
	t.is(promise.output, 'error1error2error3');

	promise.unhook();
});

test('collects output when no transform provided to hookStd', t => {
	t.plan(1);

	const promise = hookStd();

	process.stdout.write('out1');
	process.stderr.write('err1');
	process.stdout.write('out2');
	process.stderr.write('err2');

	// The output should be interleaved in the order written
	t.is(promise.output, 'out1err1out2err2');

	promise.unhook();
});

test('output property available even with transform function', t => {
	t.plan(3);
	const log = [];

	const promise = hookStdout(string => {
		log.push(`intercepted: ${string}`);
	});

	process.stdout.write('foo');
	t.is(promise.output, 'foo');
	t.deepEqual(log, ['intercepted: foo']);

	process.stdout.write('bar');
	t.is(promise.output, 'foobar');

	promise.unhook();
});

test('output getter returns real-time output', t => {
	t.plan(3);

	const promise = hookStdout();

	t.is(promise.output, '');

	process.stdout.write('first');
	t.is(promise.output, 'first');

	process.stdout.write(' second');
	t.is(promise.output, 'first second');

	promise.unhook();
});

test('handles numbers and objects in output collection', t => {
	t.plan(1);

	const promise = hookStdout();

	process.stdout.write('text');
	process.stdout.write(123);
	process.stdout.write({foo: 'bar'});

	t.is(promise.output, 'text123[object Object]');

	promise.unhook();
});

test('output collection works with once option', t => {
	t.plan(2);

	const promise = hookStdout({once: true});

	process.stdout.write('first');
	t.is(promise.output, 'first');

	// After once, hook is released but output should still be accessible
	process.stdout.write('second');
	t.is(promise.output, 'first');

	promise.unhook();
});

test('output collection works with silent false', t => {
	t.plan(2);
	const log = [];

	process.stdout = {
		write: loggingWrite(log, () => true),
	};

	const promise = hookStdout({silent: false});

	process.stdout.write('foo');
	process.stdout.write('bar');

	t.is(promise.output, 'foobar');
	t.deepEqual(log, [['foo'], ['bar']]);

	promise.unhook();
});

test('hookStd preserves interleaved order with transform', t => {
	t.plan(2);
	const collected = [];

	const promise = hookStd(string => {
		collected.push(string);
	});

	process.stdout.write('1');
	process.stderr.write('2');
	process.stdout.write('3');
	process.stderr.write('4');

	t.deepEqual(collected, ['1', '2', '3', '4']);
	t.is(promise.output, '1234');

	promise.unhook();
});

test('hookStd with custom streams preserves interleaved output', t => {
	t.plan(1);
	const streams = [
		{write() {}},
		{write() {}},
		{write() {}},
	];

	const promise = hookStd({streams});

	streams[0].write('A');
	streams[1].write('B');
	streams[2].write('C');
	streams[0].write('D');

	t.is(promise.output, 'ABCD');

	promise.unhook();
});

test('hookStd output is empty initially', t => {
	const promise = hookStd();
	t.is(promise.output, '');
	promise.unhook();
});

test('hookStd output updates in real-time across streams', t => {
	const promise = hookStd();

	t.is(promise.output, '');

	process.stdout.write('out');
	t.is(promise.output, 'out');

	process.stderr.write('err');
	t.is(promise.output, 'outerr');

	process.stdout.write('!');
	t.is(promise.output, 'outerr!');

	promise.unhook();
});

test('individual stream hooks still have their own output', t => {
	const hookOut = hookStdout();
	const hookError = hookStderr();

	process.stdout.write('stdout1');
	process.stderr.write('stderr1');
	process.stdout.write('stdout2');

	t.is(hookOut.output, 'stdout1stdout2');
	t.is(hookError.output, 'stderr1');

	hookOut.unhook();
	hookError.unhook();
});
