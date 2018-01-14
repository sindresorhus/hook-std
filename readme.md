# hook-std [![Build Status](https://travis-ci.org/sindresorhus/hook-std.svg?branch=master)](https://travis-ci.org/sindresorhus/hook-std)

> Hook and modify stdout/stderr


## Install

```
$ npm install --save hook-std
```


## Usage

```js
const assert = require('assert');
const hookStd = require('hook-std');

const promise = hookStd.stdout(output => {
	promise.unhook();

	assert.strictEqual(output.trim(), 'unicorn');
});

console.log('unicorn');
await promise;
```

Unhook can also be done via callback:

```js
const promise = hookStd.stdout((output, unhook) => {
	unhook();

	assert.strictEqual(output.trim(), 'unicorn');
});

console.log('unicorn');
await promise;
```


## API

### hookStd([options], transform)

Hook stdout and stderr.

Returns a `Promise` with a `unhook()` method which, when called, unhooks both stdout and stderr and resolves the `Promise` with an empty result.

### hookStd.stdout([options], transform)

Hook stdout.

Returns a `Promise` with a `unhook()` method which, when called, resolves the `Promise` with an empty result.

### hookStd.stderr([options], transform)

Hook stderr.

Returns a `Promise` with a `unhook()` method which, when called, resolves the `Promise` with an empty result.

#### options

##### silent

Type: `boolean`<br>
Default: `true`

Suppress stdout/stderr output.

##### once

Type: `boolean`<br>
Default: `false`

Automatically unhooks after the first call.

##### transform

Type: `Function`

Receives stdout/stderr as the first argument and the unhook method as the second argument. Return a string to modify it. Optionally, when in silent mode, you may return a `boolean` to influence the return value of `.write(...)`.


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
