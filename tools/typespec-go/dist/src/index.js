import { createTypeSpecLibrary } from "@typespec/compiler";
import { generateModels, generateAPI } from "./emitter.js";
const emitterOptions = {
    type: "object",
    properties: {
        packageName: { type: "string", nullable: true },
        outputDir: { type: "string", nullable: true },
    },
    additionalProperties: false,
};
export const $lib = createTypeSpecLibrary({
    name: "@common-grants/typespec-go",
    diagnostics: {},
});
export async function $onEmit(context) {
    if (context.program.compilerOptions.noEmit) {
        return;
    }
    const outputDir = context.options.outputDir || context.emitterOutputDir;
    const packageName = context.options.packageName || "api";
    // Ensure output directory exists
    try {
        await context.program.host.mkdirp(outputDir);
    }
    catch (e) {
        console.error("Failed to create output directory:", e);
        return;
    }
    // Generate the files
    const modelsContent = generateModels(context.program, packageName);
    const apiContent = generateAPI(context.program, packageName);
    // Write the generated files
    const files = new Map();
    files.set(`${outputDir}/models.go`, modelsContent);
    files.set(`${outputDir}/api.go`, apiContent);
    for (const [path, content] of files) {
        try {
            await context.program.host.writeFile(path, content);
            console.log("Generated:", path);
        }
        catch (e) {
            console.error("Failed to write file:", path, e);
        }
    }
}
//# sourceMappingURL=index.js.map