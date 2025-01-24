import { createGoTestHost } from "./test-host.js";
import { $onEmit } from "../src/emitter.js";

describe("Basic tests", () => {
  it("generates models", async () => {
    const host = await createGoTestHost(`
      model Pet {
        name: string;
        age: number;
      }
    `);

    const files = await $onEmit(host.program, {
      packageName: "test",
      outputDir: "generated",
    });

    expect(files.size).toBe(2);
    expect(files.has("generated/models.go")).toBe(true);
    expect(files.has("generated/api.go")).toBe(true);
  });
}); 