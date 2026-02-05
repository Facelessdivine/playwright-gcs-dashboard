import type { RunsIndex, Summary } from "./types";

const BASE = import.meta.env.VITE_GCS_BASE as string;

export async function fetchRunsIndex(): Promise<RunsIndex> {
  const r = await fetch(`${BASE}/index/runs.json, { cache: "no-store" }`);
  if (!r.ok) throw new Error(`Failed runs index: ${r.status}`);
  return r.json();
}

export async function fetchSummary(summaryPath: string): Promise<Summary> {
  const r = await fetch(`${BASE}/${summaryPath}, { cache: "no-store" }`);
  if (!r.ok) throw new Error(`Failed summary: ${r.status}`);
  return r.json();
}

export function reportUrl(htmlIndexPath?: string) {
  if (!htmlIndexPath) return null;
  return `${BASE}/${htmlIndexPath}`;
}
