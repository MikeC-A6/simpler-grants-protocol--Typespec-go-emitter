We are creating a TypeSpec → Go code generator (hereafter “Go Emitter”) for an enterprise-level grants management protocol. The workflow is designed so that specs/lib/ (i.e., the base specification library) remains unchanged during code generation. Instead, an examples/custom-api/ project imports the base library (@common-grants/core), extends and modifies the base routes/models in its own src/models.tsp and src/routes.tsp, and includes those custom definitions in src/main.tsp. Finally, the Go Emitter runs against the path to src/main.tsp to auto-generate the desired Go API interface within examples/custom-api—without altering the original library code in specs/lib/.

Instructions for Creating the TypeSpec → Go Emitter Package
Below is a high-level plan that describes which files and directories need to be created, what methods and functions to write, and how they all interconnect to support the intended workflow.

1. Create a Dedicated “Go Emitter” Package
New Folder

In your main repository, create a folder named, for example, tools/typespec-go/.
This folder will house all files related to the Go Emitter.
Package Setup

Add a package.json (or equivalent manifest) that defines your Go Emitter’s name, version, scripts, and necessary dependencies.
Include a tsconfig.json so you can build, test, and distribute the emitter in a self-contained way.
Rationale

Keeping the emitter in its own directory ensures it’s independent of the specs/lib/ base library.
It also supports easy versioning and reusability.
2. Implement the Emitter’s Entry Point
Entry File

In tools/typespec-go/src/, create a main entry file (for example, index.ts).
This file should export a function named something like $onEmit that TypeSpec will call when compiling.
It can also export utility objects or library symbols if needed.
$onEmit Responsibilities

Receives an EmitContext (from TypeSpec) indicating which TypeSpec program is being compiled.
Locates your custom .tsp definitions under examples/custom-api/src/—specifically the path to src/main.tsp—and processes any relevant models, routes, etc.
Generates Go code in an output folder within examples/custom-api/, such as generated/ or tsp-output-go/, without modifying anything under specs/lib/.
Supporting Files

Create additional files, e.g., emitter.ts or go-types.ts, to handle the transformation logic (mapping TypeSpec scalars to Go types, generating struct definitions, etc.).
Keep the $onEmit function as clean as possible, delegating complexity to these helper files.
3. Add Test Infrastructure
Test Directory

Under tools/typespec-go/, create a folder named test/.
Write test files (e.g., basic-emit.test.ts, nested-emit.test.ts) verifying that the emitter generates correct .go files when given various TypeSpec inputs.
TypeSpec Testing Utilities

Use any official or internal TypeSpec test harness to load ephemeral .tsp code and compare the generated .go results.
Make sure you can handle array fields, records, optional vs. required properties, or other advanced scenarios.
4. Documentation & Usage Guidelines
Local README

In tools/typespec-go/, create a README.md explaining:
How to install or reference the Go Emitter in another project (e.g., “Add to package.json with a file path”).
How to configure tspconfig.yaml in examples/custom-api/ so that it points to your emitter (e.g., emit: ["typespec-go"]).
How to run tsp compile src/main.tsp (within examples/custom-api/) to generate .go files.
Workflow Explanation

Emphasize that specs/lib/ remains untouched: it’s purely the base library.
Show how examples/custom-api/package.json imports @common-grants/core.
Describe how developers add or override models in examples/custom-api/src/models.tsp and routes in examples/custom-api/src/routes.tsp.
Clarify that examples/custom-api/src/main.tsp includes references to these extended definitions, and that the emitter runs only against that file.
5. Continuous Integration (Optional)
CI Configuration

If desired, create a workflow under .github/workflows/ that runs npm install, npm run build, npm test, etc., for your Go Emitter package.
Automated Checks

Optionally add lint/format checks so that all merges to the main branch pass a consistent code style check.
Summary of Required Files & Their Roles
tools/typespec-go/package.json
Describes the emitter package (version, scripts, dependencies).
tools/typespec-go/tsconfig.json
Configures compilation for your TypeScript emitter code.
tools/typespec-go/src/index.ts
Entry point exporting $onEmit (called by TypeSpec) and referencing your supporting logic.
tools/typespec-go/src/*.ts (e.g., emitter.ts, go-types.ts)
Internal helper modules handling Go code generation from TypeSpec definitions.
tools/typespec-go/test/*.ts
Automated tests verifying correct code generation under various scenarios.
tools/typespec-go/README.md
Documentation on how to install and run your emitter.