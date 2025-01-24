# TypeSpec Go Emitter

This is a custom TypeSpec emitter that generates Go server code for the Common Grants Protocol. 

## Overview

The emitter takes TypeSpec definitions and generates Go code that:
- Defines the API types and interfaces
- Provides server-side boilerplate for handling HTTP requests
- Implements validation and serialization

## Architecture

### TypeSpec to Go Generation
The emitter translates TypeSpec models, interfaces, and operations into Go code. The generation process happens in two main steps:

1. TypeSpec compilation generates an OpenAPI specification
2. Our emitter generates Go code from the TypeSpec models

### Relationship with oapi-codegen

While we use our own TypeSpec emitter for code generation, we leverage the `oapi-codegen/runtime` library for several production-ready utilities:

- UUID handling via `runtime/types`
- HTTP middleware for request validation
- Response serialization/deserialization
- OpenAPI spec embedding

This gives us the best of both worlds:
- Full control over code generation through TypeSpec
- Battle-tested runtime utilities from the `oapi-codegen` ecosystem

## Project Structure

```
typespec-go/
├── src/
│   ├── index.ts       # Main emitter entry point
│   ├── emitter.ts     # Core emitter logic
│   ├── go-types.ts    # Go type generation
│   └── lib.ts         # Shared utilities
└── README.md
```

## Usage

The emitter is configured in your project's `tspconfig.yaml`:

```yaml
emit:
  - "@typespec/openapi3"
options:
  "@typespec/openapi3":
    "emitter-output-dir": "{project-root}/api"
    "output-file": "{output-dir}/openapi.yaml"
```

## Dependencies

- Runtime dependencies are managed in your Go project's `go.mod`
- The `oapi-codegen/runtime` package provides HTTP utilities and type definitions
- No need for the `oapi-codegen` CLI tool itself 