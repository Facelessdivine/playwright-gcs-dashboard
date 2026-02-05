import { useEffect, useMemo, useState } from "react";
import { fetchRunsIndex, fetchSummary, reportUrl } from "./api";
import type { Summary } from "./types";

type Row = {
  runId: string;
  summaryPath: string;
  summary?: Summary;
  err?: string;
};

export default function App() {
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Row | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const idx = await fetchRunsIndex();
      const baseRows = idx.runs.map((r) => ({ ...r }) as Row);
      setRows(baseRows);

      const concurrency = 6;
      let i = 0;

      async function worker() {
        while (i < baseRows.length) {
          const my = i++;
          const row = baseRows[my];
          try {
            const s = await fetchSummary(row.summaryPath);
            setRows((prev) =>
              prev.map((p) =>
                p.summaryPath === row.summaryPath ? { ...p, summary: s } : p,
              ),
            );
          } catch (e: unknown) {
            const msg = getErrorMessage(e);
            setRows((prev) =>
              prev.map((p) =>
                p.summaryPath === row.summaryPath ? { ...p, err: msg } : p,
              ),
            );
          }
        }
      }

      await Promise.all(Array.from({ length: concurrency }, () => worker()));
    })().catch((err) => {
      // This outer catch is fine to be broader—still normalize the message
      console.error(getErrorMessage(err));
    });
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return rows;
    return rows.filter((r) => {
      const s = r.summary;
      const hay = [
        r.runId,
        s?.git?.sha,
        s?.git?.ref,
        s?.env?.target,
        s?.env?.baseURL,
        s?.jobId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(qq);
    });
  }, [rows, q]);

  return (
    <div
      style={{
        fontFamily: "system-ui",
        padding: 16,
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      <h2>Playwright Runs Dashboard</h2>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by runId, sha, env..."
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 8,
            border: "1px solid #ddd",
          }}
        />
        <div style={{ opacity: 0.7 }}>{filtered.length} runs</div>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 16 }}
      >
        <div
          style={{
            border: "1px solid #eee",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#fafafa" }}>
              <tr>
                <th style={th}>Run</th>
                <th style={th}>Status</th>
                <th style={th}>Passed</th>
                <th style={th}>Failed</th>
                <th style={th}>Duration</th>
                <th style={th}>Git</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const s = r.summary;
                const failed = s?.totals?.failed ?? 0;
                const passed = s?.totals?.passed ?? 0;
                const status = r.err
                  ? "ERROR"
                  : s
                    ? failed > 0
                      ? "FAIL"
                      : "PASS"
                    : "LOADING";
                return (
                  <tr
                    key={r.summaryPath}
                    onClick={() => setSelected(r)}
                    style={{
                      cursor: "pointer",
                      background:
                        selected?.summaryPath === r.summaryPath
                          ? "rgba(0,0,0,0.04)"
                          : "white",
                      borderTop: "1px solid #f0f0f0",
                    }}
                  >
                    <td style={td}>{r.runId}</td>
                    <td style={td}>{status}</td>
                    <td style={td}>{s ? passed : "-"}</td>
                    <td style={td}>{s ? failed : "-"}</td>
                    <td style={td}>
                      {s?.durationMs ? msToMin(s.durationMs) : "-"}
                    </td>
                    <td style={td}>
                      {s?.git?.sha ? s.git.sha.slice(0, 8) : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div
          style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}
        >
          <h3 style={{ marginTop: 0 }}>Run details</h3>

          {!selected ? (
            <div style={{ opacity: 0.7 }}>Click a run to see details</div>
          ) : selected.err ? (
            <div>
              <div style={{ fontWeight: 700 }}>{selected.runId}</div>
              <pre style={{ whiteSpace: "pre-wrap" }}>{selected.err}</pre>
            </div>
          ) : !selected.summary ? (
            <div style={{ opacity: 0.7 }}>Loading summary…</div>
          ) : (
            <Details summary={selected.summary} />
          )}
        </div>
      </div>
    </div>
  );
}

function Details({ summary }: { summary: Summary }) {
  const url = reportUrl(summary.report?.htmlIndex);

  return (
    <div>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>
        {summary.jobId || summary.runId || "Run"}
      </div>

      <div style={kv}>
        <span style={k}>Env</span>
        <span style={v}>{summary.env?.target || "-"}</span>
      </div>
      <div style={kv}>
        <span style={k}>BaseURL</span>
        <span style={v}>{summary.env?.baseURL || "-"}</span>
      </div>
      <div style={kv}>
        <span style={k}>Git</span>
        <span style={v}>
          {(summary.git?.ref || "-") +
            " " +
            (summary.git?.sha ? summary.git.sha.slice(0, 8) : "")}
        </span>
      </div>

      <hr
        style={{ border: 0, borderTop: "1px solid #eee", margin: "12px 0" }}
      />

      <div style={{ display: "flex", gap: 12 }}>
        <Stat label="Passed" value={summary.totals?.passed ?? 0} />
        <Stat label="Failed" value={summary.totals?.failed ?? 0} />
        <Stat label="Skipped" value={summary.totals?.skipped ?? 0} />
        <Stat label="Flaky" value={summary.totals?.flaky ?? 0} />
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={kv}>
          <span style={k}>Duration</span>
          <span style={v}>
            {summary.durationMs ? msToMin(summary.durationMs) : "-"}
          </span>
        </div>
        <div style={kv}>
          <span style={k}>Started</span>
          <span style={v}>{summary.startedAt || "-"}</span>
        </div>
        <div style={kv}>
          <span style={k}>Finished</span>
          <span style={v}>{summary.finishedAt || "-"}</span>
        </div>
      </div>

      <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
        <button
          onClick={() => url && window.open(url, "_blank")}
          disabled={!url}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: url ? "white" : "#f5f5f5",
            cursor: url ? "pointer" : "not-allowed",
          }}
        >
          Open HTML Report
        </button>
      </div>

      {!url && (
        <div style={{ marginTop: 8, opacity: 0.7 }}>
          No htmlIndex found in summary.report.htmlIndex
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        border: "1px solid #eee",
        borderRadius: 12,
        padding: 10,
        flex: 1,
      }}
    >
      <div style={{ opacity: 0.7, fontSize: 12 }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 22 }}>{value}</div>
    </div>
  );
}

function msToMin(ms: number) {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r}s`;
}

// ---- Error helpers ----
function isErrorWithMessage(e: unknown): e is { message: string } {
  return (
    typeof e === "object" &&
    e !== null &&
    "message" in e &&
    typeof e.message === "string"
  );
}

function getErrorMessage(e: unknown): string {
  if (isErrorWithMessage(e)) return e.message;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

// ---- Styles ----
const th: React.CSSProperties = {
  textAlign: "left",
  padding: 10,
  fontSize: 13,
};
const td: React.CSSProperties = {
  padding: 10,
  fontSize: 13,
  verticalAlign: "top",
};
const kv: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
};
const k: React.CSSProperties = { opacity: 0.7 };
const v: React.CSSProperties = { fontWeight: 600, textAlign: "right" };
