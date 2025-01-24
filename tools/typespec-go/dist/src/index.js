import { createTypeSpecLibrary } from "@typespec/compiler";
export const $lib = createTypeSpecLibrary({
  name: "@common-grants/typespec-go",
  diagnostics: {},
});
export async function $onEmit(context) {
  // This is a placeholder implementation
  // We'll add actual Go code generation logic in the next steps
  console.log("Go Emitter initialized with context:", context.emitterOutputDir);
}
//# sourceMappingURL=index.js.map
