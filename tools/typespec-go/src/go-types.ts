import { Type, Program } from "@typespec/compiler";

export interface GoType {
  name: string;
  packageName?: string;
  isPointer?: boolean;
  imports?: Set<string>;
}

export function getGoType(program: Program, type: Type): GoType {
  if (type.kind === "Scalar") {
    return mapScalarToGoType(type);
  } else if (type.kind === "Model") {
    return mapModelToGoType(type);
  } else if (type.kind === "Enum") {
    return mapEnumToGoType(type);
  }
  
  // Default fallback
  return { name: "interface{}" };
}

function mapScalarToGoType(scalar: Type): GoType {
  const scalarName = scalar.kind === "Scalar" ? scalar.name : "unknown";
  switch (scalarName) {
    case "string":
      return { name: "string" };
    case "int32":
      return { name: "int32" };
    case "int64":
      return { name: "int64" };
    case "float32":
      return { name: "float32" };
    case "float64":
      return { name: "float64" };
    case "boolean":
      return { name: "bool" };
    case "bytes":
      return { name: "[]byte" };
    case "datetime":
      return { 
        name: "Time",
        packageName: "time",
        imports: new Set(["time"]) 
      };
    default:
      return { name: "interface{}" };
  }
}

function mapModelToGoType(model: Type): GoType {
  return { 
    name: model.kind === "Model" ? model.name : "interface{}",
    isPointer: true 
  };
}

function mapEnumToGoType(enum_: Type): GoType {
  return { 
    name: enum_.kind === "Enum" ? enum_.name : "string" 
  };
} 