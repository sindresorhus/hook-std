import {expectType} from 'tsd-check';
import hookStd, {DefaultOptions, HookPromise, Options, stderr, stdout, Unhook, Transform} from '.';

expectType<Unhook>(() => null);
expectType<Unhook>(() => undefined);
expectType<Unhook>(() => 0);
expectType<Unhook>(() => "0");

expectType<Transform>(() => null);
expectType<Transform>(() => undefined);
expectType<Transform>(() => true);
expectType<Transform>((output: string) => null);
expectType<Transform>((output: string) => undefined);
expectType<Transform>((output: string) => true);
expectType<Transform>((output: string, unhook: Unhook) => null);
expectType<Transform>((output: string, unhook: Unhook) => undefined);
expectType<Transform>((output: string, unhook: Unhook) => true);

expectType<Options>({silent: true});
expectType<Options>({once: true});
expectType<Options>({silent: true, once: true});

expectType<DefaultOptions>({silent: true});
expectType<DefaultOptions>({once: true});
expectType<DefaultOptions>({streams: [process.stdout, process.stderr]});
expectType<DefaultOptions>({silent: true, once: true, streams: [process.stdout]});

expectType<HookPromise>(stdout(() => null));
expectType<HookPromise>(stdout(() => true));
expectType<HookPromise>(stderr(() => null));
expectType<HookPromise>(stderr(() => true));

expectType<(transform: Transform) => HookPromise>(stdout)

expectType<(transform: Transform) => HookPromise>(stderr)

expectType<(opts: Options, transform: Transform) => HookPromise>(hookStd)
