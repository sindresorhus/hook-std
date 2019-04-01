import {expectType, expectError} from 'tsd';
import hookStd = require('.');
import {
	HookPromise,
	Unhook,
	Transform,
	SilentTransform
} from '.';

expectType<Unhook>(() => null);
expectType<Unhook>(() => undefined);
expectType<Unhook>(() => 0);
expectType<Unhook>(() => '0');

expectType<Transform>((output: string, unhook: Unhook) => null);
expectType<Transform>((output: string, unhook: Unhook) => undefined);
expectType<Transform>((output: string, unhook: Unhook) => 'foo');
expectType<Transform>((output: string, unhook: Unhook) => Buffer.from('foo'));
expectError<Transform>((output: string, unhook: Unhook) => true);

expectType<SilentTransform>((output: string, unhook: Unhook) => null);
expectType<SilentTransform>((output: string, unhook: Unhook) => undefined);
expectType<SilentTransform>((output: string, unhook: Unhook) => true);
expectError<SilentTransform>((output: string, unhook: Unhook) => 'foo');
expectError<SilentTransform>((output: string, unhook: Unhook) => Buffer.from('foo'));

expectType<HookPromise>(hookStd(() => true));
expectError(hookStd(() => 'foo'));
expectType<HookPromise>(hookStd({silent: false}, () => 'foo'));
expectType<HookPromise>(hookStd({silent: true}, () => true));
expectError(hookStd({silent: false}, () => true));
expectError(hookStd({silent: true}, () => 'foo'));
expectType<HookPromise>(hookStd({silent: false, streams: [process.stderr]}, () => 'foo'));
expectType<HookPromise>(hookStd({silent: true, streams: [process.stderr]}, () => true));
expectError(hookStd({silent: false, streams: [process.stderr]}, () => true));
expectError(hookStd({silent: true, streams: [process.stderr]}, () => 'foo'));

expectType<HookPromise>(hookStd.stdout(() => true));
expectError(hookStd.stdout(() => 'foo'));
expectType<HookPromise>(hookStd.stdout({silent: false}, () => 'foo'));
expectType<HookPromise>(hookStd.stdout({silent: true}, () => true));
expectError(hookStd.stdout({silent: false}, () => true));
expectError(hookStd.stdout({silent: true}, () => 'foo'));
expectError(hookStd.stdout({silent: false, streams: [process.stderr]}, () => 'foo'));

expectType<HookPromise>(hookStd.stderr(() => true));
expectError(hookStd.stderr(() => 'foo'));
expectType<HookPromise>(hookStd.stderr({silent: false}, () => 'foo'));
expectType<HookPromise>(hookStd.stderr({silent: true}, () => true));
expectError(hookStd.stderr({silent: false}, () => true));
expectError(hookStd.stderr({silent: true}, () => 'foo'));
expectError(hookStd.stderr({silent: false, streams: [process.stderr]}, () => 'foo'));
