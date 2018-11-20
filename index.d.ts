import {Writable} from 'stream';

/**
 * `unhook()` method which, when called, unhooks from a stream and resolves the Promise.
 */
export type Unhook = () => void;

/**
 * Receives stream output as the first argument and the unhook method as the second argument.
 *
 * Optionally, when in silent mode, you may return a boolean to influence the return value of `.write(…)`.
 *
 * @param output - String from stream output.
 * @param unhook - Method which, when called, unhooks from stream.
 * @returns A boolean to influence the return value of `.write(…)`, Buffer or string to modify it, or void.
 */
export type Transform = (output: string, unhook: Unhook) => boolean | Buffer | string | void;

export interface Options {
	/**
	 * Suppress stdout/stderr output.
	 *
	 * @default true
	 */
	silent?: boolean;

	/**
	 * Automatically unhooks after the first call.
	 *
	 * @default false
	 */
	once?: boolean;
}

export interface DefaultOptions extends Options {
	/**
	 * Writable streams to hook. This can be useful for libraries allowing users to configure a Writable Stream to write to.
	 *
	 * @default [process.stdout, process.stderr]
	 */
	streams?: Writable[];
}

/**
 * Promise with a `unhook()` method which, when called, resolves the Promise with an empty result.
 */
export interface HookPromise extends Promise<void> {
	unhook: Unhook;
}

/**
 * Hooks stdout.
 *
 * @returns A `Promise` with a `unhook()` method which, when called, unhooks the streams and resolves the `Promise`.
 */
export function stdout(transform: Transform): HookPromise;

/**
 * Hooks stdout.
 *
 * @returns A `Promise` with a `unhook()` method which, when called, unhooks the streams and resolves the `Promise`.
 */
export function stdout(options: Options, transform: Transform): HookPromise;

/**
 * Hooks stderr.
 *
 * @returns A `Promise` with a `unhook()` method which, when called, unhooks the streams and resolves the `Promise`.
 */
export function stderr(transform: Transform): HookPromise;

/**
 * Hooks stderr.
 *
 * @returns A `Promise` with a `unhook()` method which, when called, unhooks the streams and resolves the `Promise`.
 */
export function stderr(options: Options, transform: Transform): HookPromise;

/**
 * Hooks streams in options or stdout & stderr if none are specified.
 *
 * @returns A `Promise` with a `unhook()` method which, when called, unhooks the streams and resolves the `Promise`.
 */
declare function hookStd(transform: Transform): HookPromise;

/**
 * Hooks streams in options or stdout & stderr if none are specified.
 *
 * @returns A `Promise` with a `unhook()` method which, when called, unhooks the streams and resolves the `Promise`.
 */
declare function hookStd(options: DefaultOptions, transform: Transform): HookPromise;

export default hookStd;
