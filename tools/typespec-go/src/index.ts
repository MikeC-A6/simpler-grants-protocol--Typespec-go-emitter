import { EmitContext, createTypeSpecLibrary } from "@typespec/compiler";
import { GoEmitter, EmitterOptions } from "./emitter.js";

export interface GoEmitterOptions extends EmitterOptions {
  packageName?: string;
  outputDir?: string;
}

export const $lib = createTypeSpecLibrary({
  name: "@common-grants/typespec-go",
  diagnostics: {},
});

export async function $onEmit(context: EmitContext<GoEmitterOptions>) {
  if (context.program.compilerOptions.noEmit) {
    return;
  }

  const emitter = new GoEmitter(context.program, {
    packageName: context.options.packageName || "api",
    outputDir: context.options.outputDir || context.emitterOutputDir,
  });

  const files = await emitter.emit();

  // Write the generated files
  for (const [path, content] of files) {
    await context.program.host.writeFile(path, content);
  }
}
