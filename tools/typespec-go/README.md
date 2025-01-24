# CommonGrants TypeSpec Go Emitter

This package provides a TypeSpec emitter that generates Go code from the CommonGrants protocol specification.

## Installation

To use this emitter in your project:

1. Add the package to your project's dependencies:

```json
{
  "dependencies": {
    "@common-grants/typespec-go": "file:../../tools/typespec-go"
  }
}
```

2. Configure the emitter in your `tspconfig.yaml`:

```yaml
emitters:
  "@common-grants/typespec-go": true
```

## Development

### Setup

```bash
npm install
```

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run watch
```

### Test

```bash
npm run test
```

### Format and Lint

```bash
npm run format
npm run lint
```

## License

CC0-1.0
