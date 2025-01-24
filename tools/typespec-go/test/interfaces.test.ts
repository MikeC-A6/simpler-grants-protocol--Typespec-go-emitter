import { createGoTestHost } from "./test-host.js";
import { $onEmit } from "../src/emitter.js";

describe("Interface tests", () => {
  it("generates server interface", async () => {
    const host = await createGoTestHost(`
      @route("/pets")
      interface PetStore {
        @get list(): Pet[];
        @post create(@body pet: Pet): Pet;
      }

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

    const apiContent = files.get("generated/api.go");
    expect(apiContent).toContain("type ServerInterface interface {");
    expect(apiContent).toContain("list(ctx context.Context) ([]Pet, error)");
    expect(apiContent).toContain("create(ctx context.Context, body *Pet) (Pet, error)");
  });
}); 