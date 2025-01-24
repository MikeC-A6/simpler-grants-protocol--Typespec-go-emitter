import { EmitContext } from "@typespec/compiler";
import { EmitterOptions } from "./emitter.js";
export declare const $lib: import("@typespec/compiler").TypeSpecLibrary<{
    [code: string]: import("@typespec/compiler").DiagnosticMessages;
}, Record<string, any>, never>;
export declare function $onEmit(context: EmitContext<EmitterOptions>): Promise<void>;
