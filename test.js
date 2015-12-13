import test from 'ava';
import fn from './';

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
