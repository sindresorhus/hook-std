import {expectType} from 'tsd-check';
import {Unhook, Transform, Options, PromiseUnhook, stdout, stderr} from '.';

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
expectType<Options>({streams: [process.stdout, process.stderr]});
expectType<Options>({silent: true, once: true, streams: [process.stdout]});

expectType<PromiseUnhook>(stdout(() => null));
expectType<PromiseUnhook>(stdout({silent: false}, () => null));
expectType<PromiseUnhook>(stdout(() => true));
expectType<PromiseUnhook>(stdout({silent: false}, () => true));
expectType<PromiseUnhook>(stderr(() => null));
expectType<PromiseUnhook>(stderr({silent: false}, () => null));
expectType<PromiseUnhook>(stderr(() => true));
expectType<PromiseUnhook>(stderr({silent: false}, () => true));

expectType<(transform: Transform) => PromiseUnhook>(stdout)
expectType<(opts: Options, transform: Transform) => PromiseUnhook>(stdout)
expectType<(transform: Transform) => PromiseUnhook>(stderr)
expectType<(opts: Options, transform: Transform) => PromiseUnhook>(stderr)
