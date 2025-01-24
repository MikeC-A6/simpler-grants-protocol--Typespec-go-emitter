import { createTestHost, createTestWrapper, TestHost } from "@typespec/compiler/testing";
import { GoEmitter } from "../src/emitter.js";

export interface TestHostOptions {
  outputDir?: string;
  packageName?: string;
}

export async function createGoTestHost(typespecCode: string, options: TestHostOptions = {}) {
  const host = await createTestHost();
  const mainFile = {
    path: "/main.tsp",
    content: typespecCode,
  };
  host.addTypeSpecFile(mainFile.path, mainFile.content);
  
  const program = await host.compile("/main.tsp");
  const emitter = new GoEmitter(program, {
    outputDir: options.outputDir || "generated",
    packageName: options.packageName || "api",
  });

  const files = await emitter.emit();
  return {
    program,
    files,
    host,
  };
} 