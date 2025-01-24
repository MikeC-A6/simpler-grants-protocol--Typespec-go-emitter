import { createTestHost, TestHost } from "@typespec/compiler/testing";

export async function createGoTestHost(code: string): Promise<TestHost> {
  const host = await createTestHost();
  await host.addTypeSpecFile("main.tsp", code);
  await host.compile("main.tsp");
  return host;
} 