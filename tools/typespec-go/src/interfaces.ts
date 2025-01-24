import { Interface, Operation, Type, Program, navigateProgram } from "@typespec/compiler";
import { HttpOperation, getHttpOperation } from "@typespec/http";

export interface GoOperation {
  name: string;
  method: string;
  path: string;
  parameters: GoParameter[];
  returnType: string;
  documentation?: string;
}

export interface GoParameter {
  name: string;
  type: string;
  isPointer: boolean;
  isQuery: boolean;
  isPath: boolean;
  isBody: boolean;
}

export interface GoInterface {
  name: string;
  operations: GoOperation[];
  documentation?: string;
}

export function collectInterfaces(program: Program): GoInterface[] {
  const interfaces: GoInterface[] = [];

  navigateProgram(program, {
    interface: (iface) => {
      // Skip built-in interfaces and those from the base library
      if (iface.name.startsWith("TypeSpec.") || iface.name.includes("@typespec")) {
        return;
      }

      const goInterface: GoInterface = {
        name: iface.name,
        operations: collectOperations(program, iface),
        documentation: iface.node?.docs?.join("\n"),
      };

      interfaces.push(goInterface);
    },
  });

  return interfaces;
}

function collectOperations(program: Program, iface: Interface): GoOperation[] {
  const operations: GoOperation[] = [];

  for (const member of iface.operations.values()) {
    const httpOp = getHttpOperation(program, member);
    if (!httpOp) continue;

    const operation: GoOperation = {
      name: member.name,
      method: httpOp.method.toUpperCase(),
      path: httpOp.path,
      parameters: collectParameters(program, member, httpOp),
      returnType: getReturnType(program, member),
      documentation: member.node?.docs?.join("\n"),
    };

    operations.push(operation);
  }

  return operations;
}

function collectParameters(program: Program, operation: Operation, httpOp: HttpOperation): GoParameter[] {
  const parameters: GoParameter[] = [];

  // Path parameters
  for (const param of httpOp.parameters.path) {
    parameters.push({
      name: param.name,
      type: getTypeString(param.type),
      isPointer: false,
      isQuery: false,
      isPath: true,
      isBody: false,
    });
  }

  // Query parameters
  for (const param of httpOp.parameters.query) {
    parameters.push({
      name: param.name,
      type: getTypeString(param.type),
      isPointer: param.optional,
      isQuery: true,
      isPath: false,
      isBody: false,
    });
  }

  // Body parameter
  if (httpOp.parameters.body) {
    parameters.push({
      name: "body",
      type: getTypeString(httpOp.parameters.body.type),
      isPointer: false,
      isQuery: false,
      isPath: false,
      isBody: true,
    });
  }

  return parameters;
}

function getReturnType(program: Program, operation: Operation): string {
  if (!operation.returnType) return "interface{}";
  return getTypeString(operation.returnType);
}

function getTypeString(type: Type): string {
  if (type.kind === "Model") {
    return type.name;
  } else if (type.kind === "Scalar") {
    return type.name;
  } else {
    return "interface{}";
  }
} 