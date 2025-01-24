import { createTestHost, TestHost } from "@typespec/compiler/testing";
import { GoEmitter } from "../src/emitter.js";
import { join } from "path";

describe("Go Emitter - Basic Tests", () => {
  let host: TestHost;

  beforeEach(async () => {
    host = await createTestHost();
  });

  async function compileAndEmit(typespecCode: string, options = {}) {
    const mainFile = "/main.tsp";
    await host.addTypeSpecFile(mainFile, typespecCode);
    const program = await host.compile(mainFile);

    const emitter = new GoEmitter(program, {
      packageName: "testapi",
      outputDir: "generated",
      ...options,
    });
    return await emitter.emit();
  }

  test("generates simple model with scalar fields", async () => {
    const files = await compileAndEmit(`
      model User {
        id: string;
        age: int32;
        isActive: boolean;
      }
    `);

    const expectedPath = join("generated", "models.go");
    const content = files.get(expectedPath);
    expect(content).toBeDefined();
    expect(content).toContain("type User struct {");
    expect(content).toContain("id string `json:\"id\"`");
    expect(content).toContain("age int32 `json:\"age\"`");
    expect(content).toContain("isActive bool `json:\"isActive\"`");
  });

  test("handles optional fields", async () => {
    const files = await compileAndEmit(`
      model Profile {
        name: string;
        bio?: string;
        age?: int32;
      }
    `);

    const expectedPath = join("generated", "models.go");
    const content = files.get(expectedPath);
    expect(content).toBeDefined();
    expect(content).toContain("name string `json:\"name\"`");
    expect(content).toContain("bio *string `json:\"bio,omitempty\"`");
    expect(content).toContain("age *int32 `json:\"age,omitempty\"`");
  });

  test("includes time import for datetime fields", async () => {
    const files = await compileAndEmit(`
      model Event {
        name: string;
        startTime: datetime;
      }
    `);

    const expectedPath = join("generated", "models.go");
    const content = files.get(expectedPath);
    expect(content).toBeDefined();
    expect(content).toContain("import (\n\t\"time\"\n)");
    expect(content).toContain("startTime time.Time `json:\"startTime\"`");
  });
}); 