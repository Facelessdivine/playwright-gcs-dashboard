export type Summary = {
  jobId?: string;
  runId?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  git?: { repo?: string; ref?: string; sha?: string };
  env?: { target?: string; baseURL?: string };
  totals?: {
    passed?: number;
    failed?: number;
    skipped?: number;
    flaky?: number;
  };
  report?: { htmlIndex?: string };
};

export type RunsIndex = {
  runs: { runId: string; summaryPath: string }[];
};
