/// <reference types="vite/client" />

type WebMCPTool = {
  name: string;
  title?: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
  };
  execute: (
    input: Record<string, unknown>,
    options: { signal: AbortSignal },
  ) => unknown | Promise<unknown>;
};

interface Document {
  modelContext?: {
    registerTool: (
      tool: WebMCPTool,
      options?: { signal?: AbortSignal; exposedTo?: string[] },
    ) => void | Promise<void>;
    getTools?: () => Promise<Array<{ name: string }>>;
  };
}
