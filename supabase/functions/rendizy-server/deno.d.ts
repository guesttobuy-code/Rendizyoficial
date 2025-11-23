/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

declare namespace Deno {
  namespace env {
    function get(key: string): string | undefined;
  }
}

// Permite imports npm: no TypeScript
declare module "npm:*" {
  const content: any;
  export default content;
  export * from "npm:*";
}

