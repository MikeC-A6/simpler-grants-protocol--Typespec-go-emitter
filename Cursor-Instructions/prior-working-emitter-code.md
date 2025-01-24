lib.ts

import { createTypeSpecLibrary } from "@typespec/compiler";


export const $lib = createTypeSpecLibrary({
 name: "typespec-go",
 diagnostics: {},
});


export const internalLib = {
 name: "typespec-go",
 diagnostics: {},
} as const;


export const { reportDiagnostic, createDiagnostic } = $lib;

index.tx

export { $onEmit } from "./emitter.js";
export { $lib } from "./lib.js";




go-types.ts

import { Model, ModelProperty, Type, Program, Namespace } from "@typespec/compiler";


const INTERNAL_NAMESPACES = new Set([
 "TypeSpec",
 "Rest",
 "Http",
 "OpenAPI",
 "JsonSchema",
]);


const INTERNAL_TYPES = new Set([
 "EnumMember",
 "Namespace",
 "Scalar",
 "ModelProperty",
 "Model",
 "Union",
 "Operation",
 "Interface",
 "Enum",
 "UnionVariant",
 "StringTemplate",
 "object",
]);


function getPropertyType(prop: ModelProperty): string {
 const name = prop.name;
 const parentName = (prop.model as Model).name;


 // Handle specific fields
 if (parentName === "Currency" && name === "amount") {
   return "float64";
 }
 if (parentName === "CustomField") {
   if (name === "type") {
     return "string";
   }
   if (name === "value") {
     return "interface{}"; // Keep as interface{} since it can be any type
   }
 }


 // Handle array and map types
 if (name === "applicationTimeline") {
   return "[]Event";
 }
 if (name === "customFields") {
   return "map[string]CustomField";
 }


 return getGoType(prop.type);
}


export function getGoType(type: Type): string {
 if (type.kind === "Scalar") {
   return getGoScalarType(type);
 } else if (type.kind === "Model") {
   const model = type as Model;
   if (model.namespace && INTERNAL_NAMESPACES.has(model.namespace.name)) {
     return "interface{}";
   }
   return model.name;
 } else if (type.kind === "Union") {
   return "interface{}"; // For now, treat unions as interface{}
 }


 // Handle array types
 const typeStr = String(type);
 if (typeStr.includes("Array<")) {
   const elementTypeStr = typeStr.slice(typeStr.indexOf("<") + 1, typeStr.lastIndexOf(">")).trim();
   if (elementTypeStr === "Event") {
     return "[]Event";
   }
   return `[]${elementTypeStr}`;
 }


 // Handle map types
 if (typeStr.includes("Record<")) {
   const keyType = typeStr.slice(typeStr.indexOf("<") + 1, typeStr.indexOf(",")).trim();
   const valueType = typeStr.slice(typeStr.indexOf(",") + 1, typeStr.lastIndexOf(">")).trim();
   if (keyType === "string" && valueType === "CustomField") {
     return "map[string]CustomField";
   }
   return `map[${keyType}]${valueType}`;
 }


 return "interface{}"; // Default fallback
}


function getGoScalarType(type: Type): string {
 const name = type.kind === "Scalar" ? type.name : "";
 switch (name) {
   case "string":
     return "string";
   case "int32":
     return "int32";
   case "int64":
     return "int64";
   case "float32":
     return "float32";
   case "float64":
     return "float64";
   case "boolean":
     return "bool";
   case "uuid":
     return "string";
   case "url":
     return "string";
   case "duration":
     return "time.Duration";
   case "date":
     return "time.Time";
   case "time":
     return "time.Time";
   case "datetime":
     return "time.Time";
   case "integer":
     return "int64"; // Default to int64 for generic integer
   case "number":
     return "float64"; // Default to float64 for generic number
   case "decimal":
     return "float64"; // Use float64 for decimal
   case "bytes":
     return "[]byte";
   default:
     // Try to handle common scalar types by name
     const lowerName = name.toLowerCase();
     if (lowerName.includes("date") || lowerName.includes("time")) {
       return "time.Time";
     }
     if (lowerName.includes("int")) {
       return "int64";
     }
     if (lowerName.includes("float") || lowerName.includes("decimal") || lowerName.includes("number")) {
       return "float64";
     }
     if (lowerName.includes("bool")) {
       return "bool";
     }
     return "interface{}";
 }
}


export function generateGoStruct(model: Model): string {
 // Skip internal types
 if (model.namespace && INTERNAL_NAMESPACES.has(model.namespace.name)) {
   return "";
 }


 // Skip TypeSpec internal types
 if (INTERNAL_TYPES.has(model.name) || model.name.startsWith("TypeSpec.")) {
   return "";
 }


 const fields = Array.from(model.properties.values())
   .map((prop) => generateGoField(prop))
   .join("\n");


 const description = model.kind === "Model" && "description" in model ? model.description : "";
 return `${description ? `// ${description}\n` : ""}type ${model.name} struct {
${fields}
}`;
}


function generateGoField(prop: ModelProperty): string {
 const goType = getPropertyType(prop);
 const jsonTag = `\`json:"${prop.name}${prop.optional ? ",omitempty" : ""}"\``;
 const description = "description" in prop ? prop.description : "";
 return `${description ? `    // ${description}\n` : ""}    ${prop.name} ${prop.optional ? "*" : ""}${goType} ${jsonTag}`;
}

emitter.ts

import { EmitContext, emitFile, resolvePath, navigateProgram, Model } from "@typespec/compiler";
import { generateGoStruct } from "./go-types.js";


const INTERNAL_NAMESPACES = new Set([
 "TypeSpec",
 "Rest",
 "Http",
 "OpenAPI",
 "JsonSchema",
]);


export async function $onEmit(context: EmitContext) {
 if (context.program.compilerOptions.noEmit) {
   return;
 }


 const models: string[] = [];
  navigateProgram(context.program, {
   model(m: Model) {
     // Skip internal types
     if (m.namespace && INTERNAL_NAMESPACES.has(m.namespace.name)) {
       return;
     }
     const struct = generateGoStruct(m);
     if (struct) {
       models.push(struct);
     }
   },
 });


 const content = `package api


import (
   "time"
)


${models.join("\n\n")}
`;


 await emitFile(context.program, {
   path: resolvePath(context.emitterOutputDir, "models.go"),
   content,
 });
}
