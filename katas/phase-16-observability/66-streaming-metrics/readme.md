# Kata 66: Streaming Metrics — Output Formats

## What You Will Learn

- Why the **end-of-test summary alone is not enough** for serious perf work
- k6's six `--out` output formats: **json, csv, statsd, influxdb, prometheus-rw, cloud**
- The difference between **per-data-point streams** and **aggregated rollups**
- When to capture per-iteration data (and when it costs too much disk)
- How to stream metrics so a Grafana / Prometheus stack can ingest them in real time
- Tagging patterns that survive the round-trip into a time-series DB

## Prerequisites

- Comfortable with k6 thresholds, custom metrics (kata 50)
- The QA Labs server running

## Concepts Explained

### The summary isn't enough

After a 10-minute load test k6 prints:

```
http_req_duration: avg=120ms p(95)=210ms p(99)=480ms
```

That's **a single number per metric**. It tells you nothing about:
- Was p95 stable across the run, or did it drift up at minute 8?
- Did errors cluster at a specific time?
- Did the slow VU correlate with a specific endpoint?

To answer those, you need **per-data-point output**: every individual sample, written somewhere you can query.

### Six built-in output options

| Output | What it produces | Best for |
|--------|------------------|----------|
| (default) | Console summary only | Smoke tests, CI logs |
| `--out json=file.json` | Every data point as ndjson | Local debugging, post-hoc analysis |
| `--out csv=file.csv` | Same data as CSV | Excel / pandas / quick plots |
| `--out statsd` | Push to a statsd daemon | Existing statsd infra |
| `--out influxdb=...` | Push to InfluxDB v1/v2 | Grafana with InfluxDB backend |
| `--out experimental-prometheus-rw` | Prometheus remote-write | Prometheus / Mimir / Grafana Cloud |
| `--out cloud` | Stream to k6 Cloud | Hosted dashboards, sharing |

You can specify `--out` multiple times — same run, multiple destinations.

### `--out json` — per-data-point JSON

```bash
k6 run --out json=metrics.json my-test.js
```

Output is **newline-delimited JSON**: one record per data point.

```json
{"type":"Point","metric":"http_req_duration","data":{"time":"2026-04-29T10:00:01Z","value":42.5,"tags":{"name":"GET /api/foo","status":"200"}}}
{"type":"Point","metric":"http_req_duration","data":{"time":"2026-04-29T10:00:01Z","value":31.0,"tags":{"name":"GET /api/bar","status":"200"}}}
```

You can pipe this to:
- `jq` for ad-hoc filtering
- pandas for analysis
- Custom scripts that build per-period histograms

**Cost:** big tests produce big files. A 10-minute test at 500 RPS = 300,000 lines of JSON ≈ 150MB.

### `--out csv` — same data, smaller

```bash
k6 run --out csv=metrics.csv my-test.js
```

Same fidelity as JSON, smaller, easier to load into Excel/pandas. Loses some structural nuances (nested tags get flattened).

### `--out experimental-prometheus-rw` — for live Grafana

This is the modern default for production-grade dashboards.

```bash
K6_PROMETHEUS_RW_SERVER_URL=http://prometheus:9090/api/v1/write \
k6 run --out experimental-prometheus-rw my-test.js
```

k6 streams metrics directly to a Prometheus remote-write endpoint. With Grafana pointing at the same Prometheus, you get **real-time dashboards while the test runs**.

This is what kata 67 covers in depth.

### Tagging matters more in streaming output

The summary aggregates everything, so tags only matter for thresholds. With streaming output, tags **become labels in your time-series DB** — the dimensions you slice by:

```javascript
http.get(url, {
  tags: {
    endpoint: 'dashboard',  // → label endpoint=dashboard in Prometheus
    user_type: 'admin',
    region: 'us-east',
  },
});
```

In Grafana you can then plot `http_req_duration{endpoint="dashboard",region="us-east"}` and see exactly that slice.

**Pitfall:** every unique tag combination creates a new time series. Tagging by request ID (`tag.id = uuid`) creates **one series per request** — that's a cardinality explosion and will overwhelm Prometheus.

| Good tag values | Bad tag values |
|-----------------|----------------|
| Endpoint name (a few values) | User ID (millions) |
| Status code class | Request ID |
| Region | Timestamp |
| Test variant / scenario | Random correlation ID |

### Multiple outputs simultaneously

```bash
k6 run \
  --out json=local.ndjson \
  --out csv=local.csv \
  --out experimental-prometheus-rw \
  my-test.js
```

Useful pattern: stream to Prometheus for live dashboards AND save JSON locally for post-hoc analysis.

### `--summary-export` — the thing kata-runner uses

Separate from `--out`, this writes the end-of-run rollup to a JSON file:

```bash
k6 run --summary-export=summary.json my-test.js
```

That's what the QA Labs server's k6 runner parses (kata-runner integration). It's *only* the summary, not per-data-point — fast and small.

## Exercises

1. **Local JSON capture.** Run the kata's spec with `--out json=metrics.json`. Open the file. How many data points were recorded? What metrics show up?
2. **CSV → pandas.** Same run, `--out csv=metrics.csv`. Load it: `pd.read_csv('metrics.csv')`. Plot `http_req_duration` over `time`. Do you see drift?
3. **Tag cardinality.** Add a tag `request_id: uuid()` to every request and run with `--out json`. Compare file size to a run without that tag. Now imagine that going into Prometheus.
4. **Compare summary vs streaming.** Run with both `--summary-export=s.json` and `--out json=stream.json`. Read s.json — how does it differ from stream.json?

## Common Mistakes

- **Cardinality explosions.** High-cardinality tags (user IDs, request IDs) crash Prometheus. Tag by category, not by individual.
- **Trying to load multi-GB JSON in jq.** For big runs, use `jq --stream` or a streaming Python parser.
- **Forgetting timezones.** `time` field in `--out json` is UTC. Most dashboards display local time. Check the offset.
- **Streaming and not retaining locally.** If your Prometheus retention is 7 days, that data is gone. Pair with local CSV/JSON for archival.

## Cheat Sheet

```bash
# Local capture
k6 run --out json=run.ndjson --out csv=run.csv my-test.js

# Live to Grafana (Prometheus remote-write)
K6_PROMETHEUS_RW_SERVER_URL=http://prom:9090/api/v1/write \
k6 run --out experimental-prometheus-rw my-test.js

# k6 Cloud (hosted)
k6 run --out cloud my-test.js
```

| Need | Use |
|------|-----|
| Quick check, no infra | Default summary |
| Local debugging | `--out json` |
| Live dashboard | `--out experimental-prometheus-rw` |
| Existing statsd | `--out statsd` |
| Spreadsheet analysis | `--out csv` |
| Hosted, sharable | `--out cloud` |

| Tag cardinality |
|-----------------|
| `endpoint` (10s) — fine |
| `region` (10s) — fine |
| `status_class` (5) — fine |
| `user_id` (millions) — BAD |
| `request_id` (per request) — BAD |
