import {
    Program,
    Model,
    Type,
    getTypeName,
    navigateProgram,
  } from "@typespec/compiler";
  import { getHttpOperation } from "@typespec/http";
  import { join } from "path";
  
  export interface EmitterOptions {
    packageName?: string;
    outputDir?: string;
  }
  
  function cleanTypeName(name: string): string {
    return name
      .split(".").pop()!
      .replace(/[^a-zA-Z0-9]/g, "")
      .trim();
  }
  
  function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  function shouldSkipModel(modelName: string): boolean {
    return (
      modelName.startsWith("TypeSpec.") ||
      modelName.includes("@typespec") ||
      modelName === "object" ||
      modelName === "string" ||
      modelName === "unknown" ||
      modelName === "Record"
    );
  }
  
  function getGoType(type: Type): string {
    if (!type) return "interface{}";
  
    // Handle array types
    const arrayType = type as { kind?: string; elementType?: Type };
    if (arrayType.kind === "Array" && arrayType.elementType) {
      const elemType = getGoType(arrayType.elementType);
      return `[]${elemType}`;
    }
  
    // Handle model types
    if (type.kind === "Model") {
      // Handle response objects with body
      const model = type as { properties?: Map<string, { type: Type }> };
      if (model.properties?.has("body")) {
        const bodyType = model.properties.get("body")!.type;
        return getGoType(bodyType);
      }
      return cleanTypeName(getTypeName(type));
    }
  
    // Handle enum types
    if (type.kind === "Enum") {
      return cleanTypeName(getTypeName(type));
    }
  
    // Handle scalar types
    if (type.kind === "Scalar") {
      const baseType = (type as any).baseScalar;
      if (baseType) {
        return getGoType(baseType);
      }
    }
  
    // Handle primitive types
    switch (type.kind) {
      case "String": {
        const format = (type as any).format;
        if (format === "uuid") {
          return "types.UUID";
        } else if (format === "date-time") {
          return "time.Time";
        }
        return "string";
      }
      case "Number":
        return "float64";
      case "Boolean":
        return "bool";
      case "Intrinsic": {
        const name = getTypeName(type);
        switch (name) {
          case "TypeSpec.uuid":
            return "types.UUID";
          case "TypeSpec.url":
          case "TypeSpec.plainTime":
            return "string";
          default:
            return "interface{}";
        }
      }
      default:
        return "interface{}";
    }
  }
  
  function getReturnType(type: Type): string {
    if (!type) return "interface{}";
  
    // Handle array types
    const arrayType = type as { kind?: string; elementType?: Type };
    if (arrayType.kind === "Array" && arrayType.elementType) {
      const elemType = getGoType(arrayType.elementType);
      return `[]${elemType}`;
    }
  
    // Handle model types
    if (type.kind === "Model") {
      // Handle response objects with body
      const model = type as { properties?: Map<string, { type: Type }> };
      if (model.properties?.has("body")) {
        const bodyType = model.properties.get("body")!.type;
        return getReturnType(bodyType);
      }
      return cleanTypeName(getTypeName(type));
    }
  
    // Handle enum types
    if (type.kind === "Enum") {
      return cleanTypeName(getTypeName(type));
    }
  
    // Handle scalar types
    if (type.kind === "Scalar") {
      const baseType = (type as any).baseScalar;
      if (baseType) {
        return getReturnType(baseType);
      }
    }
  
    // Handle primitive types
    switch (type.kind) {
      case "String": {
        const format = (type as any).format;
        if (format === "uuid") {
          return "types.UUID";
        } else if (format === "date-time") {
          return "time.Time";
        }
        return "string";
      }
      case "Number":
        return "float64";
      case "Boolean":
        return "bool";
      case "Intrinsic": {
        const name = getTypeName(type);
        switch (name) {
          case "TypeSpec.uuid":
            return "types.UUID";
          case "TypeSpec.url":
          case "TypeSpec.plainTime":
            return "string";
          default:
            return "interface{}";
        }
      }
      default:
        return "interface{}";
    }
  }
  
  export async function $onEmit(program: Program, options: EmitterOptions = {}): Promise<Map<string, string>> {
    const files = new Map<string, string>();
    const packageName = options.packageName || "api";
    const outputDir = options.outputDir || "generated";
  
    // Generate models.go
    const modelsContent = generateModels(program, packageName);
    files.set(join(outputDir, "models.go"), modelsContent);
  
    // Generate api.go
    const apiContent = generateAPI(program, packageName);
    files.set(join(outputDir, "api.go"), apiContent);
  
    return files;
  }
  
  export function generateModels(program: Program, packageName: string): string {
    let code = `// Code generated by typespec-go. DO NOT EDIT.

package ${packageName}

import (
    "encoding/json"
    "time"
    "github.com/oapi-codegen/runtime"
    "github.com/oapi-codegen/runtime/types"
)

`;
  
    // Track processed models to avoid duplicates
    const processedModels = new Set<string>();
    const models = new Set<Model>();
    const enums = new Set<Type>();
  
    navigateProgram(program, {
      model: (model) => {
        const modelName = getTypeName(model);
        if (!shouldSkipModel(modelName)) {
          models.add(model);
        }
      },
      enum: (enumType) => {
        const enumName = getTypeName(enumType);
        if (!shouldSkipModel(enumName)) {
          enums.add(enumType);
        }
      }
    });
  
    // Generate enums first
    for (const enumType of enums) {
      const enumName = cleanTypeName(getTypeName(enumType));
      code += `// ${enumName} represents a generated enum
type ${enumName} string

const (
`;
      
      // Generate enum values
      for (const [memberName, member] of (enumType as any).members) {
        code += `    ${enumName}${capitalize(memberName)} ${enumName} = "${memberName}"\n`;
      }
  
      code += ")\n\n";
    }
  
    // Generate models
    for (const model of models) {
      const modelName = cleanTypeName(getTypeName(model));
      
      // Skip if we've already processed this model
      if (processedModels.has(modelName)) {
        continue;
      }
      processedModels.add(modelName);
  
      code += `// ${modelName} represents a generated model
type ${modelName} struct {
`;
  
      // Embed base model if it exists
      if (model.baseModel) {
        const baseModelName = cleanTypeName(getTypeName(model.baseModel));
        code += `    ${baseModelName}\n`;
      }
  
      // Generate fields
      for (const [fieldName, field] of model.properties) {
        // Skip if field exists in base model
        if (model.baseModel && model.baseModel.properties.has(fieldName)) {
          continue;
        }
  
        const fieldType = getGoType(field.type);
        const isPointer = field.optional && !fieldType.startsWith("[");
  
        code += `    ${capitalize(fieldName)} ${isPointer ? "*" : ""}${fieldType} \`json:"${fieldName}${field.optional ? ",omitempty" : ""}"\`\n`;
      }
  
      code += "}\n\n";
    }
  
    return code;
  }
  
  export function generateAPI(program: Program, packageName: string): string {
    let code = `// Code generated by typespec-go. DO NOT EDIT.

package ${packageName}

import (
    "context"
    "net/http"
)

// ServerInterface represents all server handlers.
type ServerInterface interface {
`;
  
    // Track used operation names to avoid duplicates
    const usedNames = new Set<string>();
  
    // Collect operations from interfaces
    navigateProgram(program, {
      operation: (op) => {
        const [httpOp] = getHttpOperation(program, op);
        if (!httpOp) return;
  
        // Generate a unique operation name
        let opName = capitalize(op.name);
        if (usedNames.has(opName)) {
          const pathParts = httpOp.path.split("/").filter(p => p && !p.startsWith("{"));
          const pathSuffix = pathParts.map(capitalize).join("");
          opName = `${opName}${pathSuffix}`;
        }
        usedNames.add(opName);
  
        // Get return type
        const returnType = op.returnType ? getReturnType(op.returnType) : "interface{}";
  
        code += `    // ${opName} handles ${httpOp.verb.toUpperCase()} ${httpOp.path}
    ${opName}(ctx context.Context`;
  
        // Add parameters
        if (httpOp.parameters?.parameters) {
          for (const param of httpOp.parameters.parameters) {
            const paramType = getGoType(param.param.type);
            code += `, ${param.name} ${param.type === "query" ? "*" : ""}${paramType}`;
          }
        }
  
        // Add body parameter if it exists
        if (httpOp.parameters?.body) {
          const bodyType = getGoType(httpOp.parameters.body.type);
          code += `, body *${bodyType}`;
        }
  
        code += `) (${returnType}, error)\n`;
      },
    });
  
    code += "}\n";
    return code;
  }