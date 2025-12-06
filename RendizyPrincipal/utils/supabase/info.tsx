// Fonte única de projectId/publicAnonKey, com override via .env.local
const envProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const envAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;


// Fallbacks:
// - projectId: mantém o ID oficial (usado apenas em alguns logs)
// - publicAnonKey: LÊ DO ENV. Se falhar, string vazia (melhor que chave inválida).
const envProjectIdLoaded = (envProjectId && envProjectId.trim()) || "odcgnzfremrqnvtitpcc";
const envAnonLoaded = (envAnon && envAnon.trim()) || "";

console.log("[Info] ProjectID:", envProjectIdLoaded);
console.log("[Info] AnonKey Loaded:", envAnonLoaded ? "YES (Starts with " + envAnonLoaded.substring(0, 5) + "...)" : "NO (MISSING)");

export const projectId = envProjectIdLoaded;
export const publicAnonKey = envAnonLoaded;

