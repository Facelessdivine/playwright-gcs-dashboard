import type { RunsIndex, Summary } from "./types";

// Asegúrate de que BASE sea la URL completa del bucket
const BASE = "https://storage.googleapis.com/pw-artifacts-demo-1763046256";

export async function fetchRunsIndex(): Promise<RunsIndex> {
  // ✅ El objeto de opciones va FUERA de las comillas de la URL
  const r = await fetch(`${BASE}/index/runs.json`, { cache: "no-store" });
  if (!r.ok)
    throw new Error(`Failed runs index: ${r.statusText} (${r.status})`);
  return r.json();
}

export async function fetchSummary(summaryPath: string): Promise<Summary> {
  // ✅ Corrección aplicada aquí también
  const r = await fetch(`${BASE}/${summaryPath}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`Failed summary: ${r.statusText} (${r.status})`);
  return r.json();
}

export function reportUrl(htmlIndexPath?: string) {
  if (!htmlIndexPath) return null;
  return `${BASE}/${htmlIndexPath}`;
}
