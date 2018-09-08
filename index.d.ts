// Type definitions for hook-std 1.1
// Project: https://github.com/sindresorhus/hook-std
// Definitions by: Alex Miller <https://github.com/codex->

import {Writable} from 'stream';

/**
 * unhook() method which, when called, unhooks from a stream
 * and resolves the Promise.
 */
export type Unhook = () => void;

/**
 * Receives stream output as the first argument and the unhook method as the
 * second argument.
 *
 * Optionally, when in silent mode, you may return a boolean to influence
 * the return value of .write(...).
 * 
 * @param output - string from stream output.
 * @param unhook - method when called unhooks from stream.
 * @returns boolean to influence the return value of .write(...), Buffer or string to modify it, or void.
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
	/**
	 * Writable streams to hook. This can be useful for libraries allowing
	 * users to configure a Writable Stream to write to.
	 *
	 * @default [process.stdout, process.stderr]
	 */
	streams?: Writable[];
}

/**
 * Promise with a unhook() method which, when called, resolves the Promise
 * with an empty result.
 */
export interface PromiseUnhook extends Promise<any> {
	unhook: Unhook;
}

/**
 * Hooks stdout.
 * 
 * @param transform - the transform function.
 * @returns a Promise with a unhook() method which, when called, unhooks
 * the streams and resolves the Promise.
 */
export function stdout(transform: Transform): PromiseUnhook;

/**
 * Hooks stdout or alternatively the streams in options.
 * 
 * @param opts
 * @param transform - the transform function.
 * @returns a Promise with a unhook() method which, when called, unhooks
 * the streams and resolves the Promise.
 */
export function stdout(opts: Options, transform: Transform): PromiseUnhook;

/**
 * Hooks stderr.
 * 
 * @param transform - the transform function.
 * @returns a Promise with a unhook() method which, when called, unhooks
 * the streams and resolves the Promise.
 */
export function stderr(transform: Transform): PromiseUnhook;

/**
 * Hooks stderr or alternatively the streams in options.
 * 
 * @param opts
 * @param transform - the transform function.
 * @returns a Promise with a unhook() method which, when called, unhooks
 * the streams and resolves the Promise.
 */
export function stderr(opts: Options, transform: Transform): PromiseUnhook;
