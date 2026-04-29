# Kata 67: Grafana + Prometheus Integration

## What You Will Learn

- The full **k6 → Prometheus → Grafana** pipeline for live perf dashboards
- A working **docker-compose** stack you can spin up locally in 60 seconds
- The k6 metrics that show up in Prometheus and how to query them with **PromQL**
- Building three essential dashboards: **per-endpoint latency**, **error rate over time**, **VU/RPS**
- How to **import a community dashboard** instead of building from scratch
- Tying alerts to **threshold breaches** so a regression pages someone

## Prerequisites

- Completed [Kata 66 (Streaming Metrics)](../66-streaming-metrics/)
- Docker installed (we'll use docker-compose to run Prometheus + Grafana)
- The QA Labs server running

## Concepts Explained

### The architecture

```
┌─────────┐  remote-write   ┌────────────┐  scrape    ┌─────────┐
│ k6 test │───────────────→│ Prometheus │←──────────│ Grafana │
└─────────┘                  └────────────┘            └─────────┘
                                                          │
                                                       (you view)
```

- k6 sends metrics to Prometheus's **remote-write** endpoint as the test runs
- Prometheus stores them as time series
- Grafana queries Prometheus and renders dashboards

### Stand up the stack: docker-compose

Save this as `docker-compose.yml` in the kata folder:

```yaml
services:
  prometheus:
    image: prom/prometheus:v2.55.0
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--web.enable-remote-write-receiver'
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana:11.0.0
    ports:
      - "3001:3000"  # Grafana on 3001 (3000 is QA Labs)
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_AUTH_ANONYMOUS_ENABLED=true
      - GF_AUTH_ANONYMOUS_ORG_ROLE=Viewer
```

And `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
```

(No scrape config needed — Prometheus is in remote-write-receiver mode, k6 pushes data in directly.)

Run: `docker compose up -d`. Grafana is now at http://localhost:3001 (admin / admin), Prometheus at http://localhost:9090.

### Send k6 metrics to Prometheus

```bash
K6_PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write \
K6_PROMETHEUS_RW_TREND_STATS=p(50),p(95),p(99),avg,min,max \
k6 run --out experimental-prometheus-rw your-test.js
```

The `K6_PROMETHEUS_RW_TREND_STATS` env var controls which percentiles k6 sends. Default is just avg+max — useless for tail analysis. Override to get p95 and p99 in your dashboards.

### What metrics show up in Prometheus

After a test run, query in Prometheus / Grafana:

| Metric | Description |
|--------|-------------|
| `k6_http_reqs` | Counter of total HTTP requests |
| `k6_http_req_duration` | Trend: response time (with `_p95`, `_p99` suffixes) |
| `k6_http_req_failed_rate` | Error rate |
| `k6_iterations_total` | VU iterations completed |
| `k6_vus` | Currently active VUs |
| `k6_data_received_total` | Bytes received |
| `k6_<custom_metric>_*` | Your custom Trends/Counters/Rates |

All metrics include the **tags you set in k6** as Prometheus labels.

### Three essential PromQL queries

#### 1. p95 latency per endpoint, over time

```promql
k6_http_req_duration_p95{endpoint=~".+"}
```

In Grafana: time-series panel, instant query disabled. You see one line per endpoint.

#### 2. Error rate over time

```promql
rate(k6_http_reqs{status=~"5.."}[1m])
  / rate(k6_http_reqs[1m])
```

Shows the fraction of 5xx responses, smoothed over 1-minute windows.

#### 3. Throughput per second

```promql
rate(k6_http_reqs[1m])
```

The actual RPS the test achieved (different from your `arrival_rate` setting if the system slows down).

### Pre-built dashboards

You don't need to build all dashboards from scratch — Grafana has community templates.

The official **k6 Prometheus dashboard** is at Grafana.com dashboard ID **19665**. Import it:

1. Grafana → Dashboards → New → Import
2. Enter ID `19665`, click Load
3. Pick your Prometheus data source

Now you have 30+ pre-built panels covering all the standard k6 metrics.

### Alerting

Once metrics are in Prometheus, you can alert on regressions:

```yaml
# alerts.yml
groups:
  - name: perf-alerts
    rules:
      - alert: HighP95Latency
        expr: max_over_time(k6_http_req_duration_p95[5m]) > 500
        for: 1m
        annotations:
          summary: "p95 latency exceeded 500ms during load test"
```

Wire to PagerDuty / Slack / Discord via Alertmanager. Now a load-test regression actually wakes someone up — same as a production alert.

### When to use this vs k6 Cloud

| Local docker stack | k6 Cloud |
|-------------------|----------|
| Free | Paid (free tier limits) |
| Self-hosted, full control | Hosted, no infra |
| Need ops effort to keep up | Maintained by Grafana Labs |
| One machine | Distributed across regions |
| Custom dashboards | Pre-built |

For solo / small teams: Cloud (free tier is enough for many use cases). For mature orgs already on Prometheus: docker-compose stack mirrors prod observability and integrates with existing alerts.

## Exercises

1. **Spin up the stack.** Save the docker-compose.yml + prometheus.yml from above. Run `docker compose up -d`. Visit http://localhost:9090 and http://localhost:3001 to confirm both are alive.
2. **Send a kata-66 test to Prometheus.** Copy the k6 file from kata 66 to this folder, run with `K6_PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write k6 run --out experimental-prometheus-rw 66-streaming-metrics.test.js`. Open Prometheus and query `k6_http_reqs`. Should see counts per endpoint.
3. **Import dashboard 19665.** Get a polished view of the run without building anything.
4. **Build a custom panel.** In Grafana, create a panel showing `k6_http_req_duration_p95{region="us-east"}` over time. What happens during your test?
5. **Add an alert.** Set a threshold rule for p95 > 500ms and run a test against `/lab/slow?ms=600`. Alert should fire.

## Common Mistakes

- **Forgetting `--web.enable-remote-write-receiver`.** Without this Prometheus flag, remote-write requests are rejected.
- **Using port 3000 for Grafana.** That's QA Labs's port. Map Grafana to 3001 in docker-compose to avoid conflict.
- **Default Trend stats.** Without `K6_PROMETHEUS_RW_TREND_STATS`, you only get `avg` and `max` — no percentiles in your dashboard.
- **Cardinality explosion in production.** As kata 66 warned: high-cardinality tags will overwhelm Prometheus over time.
- **Treating dashboards as "set and forget."** When endpoints change, dashboard queries need updating too. Pin a version of your dashboard JSON in Git.

## Cheat Sheet

```bash
# Stand up the stack
docker compose up -d

# Run k6 with Prometheus output + better trend stats
K6_PROMETHEUS_RW_SERVER_URL=http://localhost:9090/api/v1/write \
K6_PROMETHEUS_RW_TREND_STATS=p(50),p(95),p(99),avg,min,max \
k6 run --out experimental-prometheus-rw test.js

# Verify metrics arrived
curl 'http://localhost:9090/api/v1/query?query=k6_http_reqs'

# Tear down
docker compose down -v   # -v wipes the data volumes too
```

| Tool | Default port | Use |
|------|--------------|-----|
| QA Labs server | 3000 | Test runner + lab targets |
| QA Labs playground | 8080 | Static kata pages |
| Prometheus | 9090 | Time series storage + scrape |
| Grafana | 3001 | Dashboards (mapped, not 3000) |

| PromQL helper | What |
|---------------|------|
| `rate(metric[1m])` | Per-second rate over 1m window |
| `histogram_quantile(0.95, ...)` | p95 from histogram buckets |
| `max_over_time(metric[5m])` | Max value in 5m window |
| `metric{label=~"regex"}` | Filter by label regex |
