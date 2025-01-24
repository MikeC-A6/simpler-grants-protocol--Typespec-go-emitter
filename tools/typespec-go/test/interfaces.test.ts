import { createTestHost, TestHost } from "@typespec/compiler/testing";
import { GoEmitter } from "../src/emitter.js";
import { join } from "path";

describe("Go Emitter - Interface Tests", () => {
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

  test("generates interface with HTTP operations", async () => {
    const files = await compileAndEmit(`
      using TypeSpec.Http;

      @route("/api")
      interface GrantsAPI {
        @get
        @route("/grants")
        listGrants(): Grant[];

        @get
        @route("/grants/{id}")
        getGrant(@path id: string): Grant;

        @post
        @route("/grants")
        createGrant(@body grant: Grant): Grant;
      }

      model Grant {
        id: string;
        title: string;
        amount: float64;
      }
    `);

    const expectedPath = join("generated", "api.go");
    const content = files.get(expectedPath);
    expect(content).toBeDefined();
    expect(content).toContain("type GrantsAPI interface {");
    expect(content).toContain("ListGrants(ctx context.Context) ([]Grant, error)");
    expect(content).toContain("GetGrant(ctx context.Context, id string) (*Grant, error)");
    expect(content).toContain("CreateGrant(ctx context.Context, grant *Grant) (*Grant, error)");
  });

  test("handles query parameters and documentation", async () => {
    const files = await compileAndEmit(`
      using TypeSpec.Http;

      @route("/api")
      interface SearchAPI {
        @doc("Search for grants by title")
        @get
        @route("/search")
        searchGrants(
          @query title?: string,
          @query minAmount?: float64,
          @query maxAmount?: float64,
        ): Grant[];
      }

      model Grant {
        id: string;
        title: string;
        amount: float64;
      }
    `);

    const expectedPath = join("generated", "api.go");
    const content = files.get(expectedPath);
    expect(content).toBeDefined();
    expect(content).toContain("// SearchGrants searches for grants by title");
    expect(content).toContain("SearchGrants(ctx context.Context, title *string, minAmount *float64, maxAmount *float64) ([]Grant, error)");
  });
}); 