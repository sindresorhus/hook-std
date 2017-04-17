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

const unhook = hookStd.stdout(output => {
	unhook();

	assert.strictEqual(output.trim(), 'unicorn');
});

console.log('unicorn');
```


## API

### hookStd([options], callback)

Hook stdout and stderr.

Returns a function that unhooks stdout and stderr.

### hookStd.stdout([options], callback)

Hook stdout.

Returns a function that unhooks stdout.

### hookStd.stderr([options], callback)

Hook stderr.

Returns a function that unhooks stderr.

#### options

##### silent

Type: `boolean`<br>
Default: `true`

Suppress stdout/stderr output.

##### once

Type: `boolean`<br>
Default: `false`

Automatically unhooks after the first call.

##### callback

Type: `Function`

Receives stdout/stderr as the first argument. Return a string to modify it. Optionally, when in silent mode, you may return a `boolean` to influence the return value of `.write(...)`.


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
