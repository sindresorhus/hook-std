/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import process from 'node:process';
import {Buffer} from 'node:buffer';
import {expectType, expectAssignable, expectError} from 'tsd';
import {hookStd, hookStdout, hookStderr, HookPromise, Unhook, Transform, SilentTransform} from './index.js';

expectAssignable<Unhook>(() => null);
expectAssignable<Unhook>(() => undefined);
expectAssignable<Unhook>(() => 0);
expectAssignable<Unhook>(() => '0');

expectAssignable<Transform>((_output: string, _unhook: Unhook) => undefined);
expectAssignable<Transform>((_output: string, _unhook: Unhook) => {}); // eslint-disable-line  @typescript-eslint/no-empty-function
expectAssignable<Transform>((_output: string, _unhook: Unhook) => 'foo');
expectAssignable<Transform>((_output: string, _unhook: Unhook) => Buffer.from('foo'));
expectError<Transform>((_output: string, _unhook: Unhook) => true);

expectAssignable<SilentTransform>((_output: string, _unhook: Unhook) => undefined);
expectAssignable<SilentTransform>((_output: string, _unhook: Unhook) => {}); // eslint-disable-line  @typescript-eslint/no-empty-function
expectAssignable<SilentTransform>((_output: string, _unhook: Unhook) => true);
expectError<SilentTransform>((_output: string, _unhook: Unhook) => 'foo');
expectError<SilentTransform>((_output: string, _unhook: Unhook) => Buffer.from('foo'));

expectType<HookPromise>(hookStd({once: true}, () => true));
expectType<HookPromise>(hookStd(() => true));
expectError(hookStd(() => 'foo'));
expectType<HookPromise>(hookStd({silent: false}, () => 'foo'));
expectType<HookPromise>(hookStd({silent: true}, () => true));
expectError(hookStd({silent: false}, () => true));
expectError(hookStd({silent: true}, () => 'foo'));
expectType<HookPromise>(hookStd({streams: [process.stderr]}, () => true));
expectType<HookPromise>(
	hookStd({silent: false, streams: [process.stderr]}, () => 'foo'),
);
expectType<HookPromise>(
	hookStd({silent: true, streams: [process.stderr]}, () => true),
);
expectError(hookStd({silent: false, streams: [process.stderr]}, () => true));
expectError(hookStd({silent: true, streams: [process.stderr]}, () => 'foo'));

expectType<HookPromise>(hookStdout({once: true}, () => true));
expectType<HookPromise>(hookStdout(() => true));
expectError(hookStdout(() => 'foo'));
expectType<HookPromise>(hookStdout({silent: false}, () => 'foo'));
expectType<HookPromise>(hookStdout({silent: true}, () => true));
expectError(hookStdout({silent: false}, () => true));
expectError(hookStdout({silent: true}, () => 'foo'));
expectError(
	hookStdout({silent: false, streams: [process.stderr]}, () => 'foo'),
);

expectType<HookPromise>(hookStderr({once: true}, () => true));
expectType<HookPromise>(hookStderr(() => true));
expectError(hookStderr(() => 'foo'));
expectType<HookPromise>(hookStderr({silent: false}, () => 'foo'));
expectType<HookPromise>(hookStderr({silent: true}, () => true));
expectError(hookStderr({silent: false}, () => true));
expectError(hookStderr({silent: true}, () => 'foo'));
expectError(
	hookStderr({silent: false, streams: [process.stderr]}, () => 'foo'),
);
