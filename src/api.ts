import type { RunsIndex, Summary } from "./types";

const BASE = "https://storage.googleapis.com/pw-artifacts-demo-1763046256";

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
