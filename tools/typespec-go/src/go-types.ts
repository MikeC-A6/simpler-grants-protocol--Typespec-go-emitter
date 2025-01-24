import { Type, Program, getTypeName } from "@typespec/compiler";

export interface GoType {
  name: string;
  imports: Set<string>;
  isPointer?: boolean;
}

function cleanTypeName(name: string): string {
  // Strip namespace prefixes and clean up special characters
  return name
    .split(".")
    .pop()!
    .replace(/[\[\]<>{}]/g, "")
    .trim();
}

/**
 * Map a TypeSpec type to a Go type name (plus some metadata).
 */
export function getGoType(program: Program, type: Type): GoType {
  if (!type) {
    return { name: "interface{}", imports: new Set<string>() };
  }

  if (type.kind === "Scalar") {
    return mapScalarToGoType(type);
  } else if (type.kind === "Model") {
    return mapModelToGoType(program, type);
  } else if (type.kind === "Enum") {
    return mapEnumToGoType(type);
  } else if ((type as any).kind === "Array") {
    const elementType = getGoType(program, (type as any).elementType);
    const cleanName = cleanTypeName(elementType.name);
    // Arrays of models use pointer elements
    return {
      name: elementType.isPointer ? `[]*${cleanName}` : `[]${cleanName}`,
      imports: elementType.imports,
    };
  } else if ((type as any).kind === "Record") {
    const valueType = getGoType(program, (type as any).valueType);
    const cleanName = cleanTypeName(valueType.name);
    // Maps use non-pointer values
    return {
      name: `map[string]${cleanName}`,
      imports: new Set<string>([...valueType.imports]),
    };
  }

  return { name: "interface{}", imports: new Set<string>() };
}

/**
 * Convert TypeSpec scalar to an appropriate Go type.
 */
function mapScalarToGoType(type: Type): GoType {
  const typeName = getTypeName(type);
  switch (typeName) {
    case "string":
      return { name: "string", imports: new Set<string>() };
    case "int32":
      return { name: "int32", imports: new Set<string>() };
    case "int64":
      return { name: "int64", imports: new Set<string>() };
    case "float32":
      return { name: "float32", imports: new Set<string>() };
    case "float64":
      return { name: "float64", imports: new Set<string>() };
    case "boolean":
      return { name: "bool", imports: new Set<string>() };
    case "bytes":
      return { name: "[]byte", imports: new Set<string>() };
    case "date":
    case "time":
    case "datetime":
      return { name: "time.Time", imports: new Set<string>(["time"]) };
    default:
      return { name: "interface{}", imports: new Set<string>() };
  }
}

/**
 * Convert TypeSpec model to a pointer-to-struct type in Go (unless it's internal).
 */
function mapModelToGoType(program: Program, model: Type): GoType {
  const modelName = getTypeName(model);
  
  // Filter out TypeSpec internal types
  if (modelName.startsWith("TypeSpec.") || modelName.includes("@typespec")) {
    return { name: "interface{}", imports: new Set<string>() };
  }

  const cleanName = cleanTypeName(modelName);
  
  // Models are always pointer types
  return {
    name: `*${cleanName}`,
    imports: new Set<string>(),
    isPointer: true,
  };
}

/**
 * Convert TypeSpec enum to a named type in Go (commonly you'd define string-based or iota-based).
 */
function mapEnumToGoType(type: Type): GoType {
  const enumName = cleanTypeName(getTypeName(type));
  return { name: enumName, imports: new Set<string>() };
}
