# Kata 73: JMeter Awareness

## What You Will Learn

- Why **JMeter still matters** in 2026 even though k6 is technically better
- How to read a basic **JMX file** (the XML format JMeter uses)
- The JMeter mental model: **Thread Groups, Samplers, Listeners, Assertions**
- How to **migrate** a JMeter test plan to k6 (and back, when stuck with JMeter)
- The JMeter ecosystem: BlazeMeter, JMeter Maven Plugin, Taurus
- When to **stay on JMeter** vs when to push for migration

## Prerequisites

- All earlier perf phases (you understand load patterns conceptually)
- JMeter installed (optional — `brew install jmeter` or [download](https://jmeter.apache.org/download_jmeter.cgi))

## Concepts Explained

### Why this kata exists

Most QA orgs in large enterprises **still run JMeter**. Banks, telecoms, governments — anywhere with 10+ year-old QA infrastructure. As a perf engineer, you'll meet JMeter test plans regularly. Even if you wouldn't choose it for new work, you need to **read, debug, and migrate** JMeter tests.

This is a single awareness kata — not a deep dive. The real curriculum is k6 + Artillery (the rest of phases 9-17). But you should be able to recognize a JMX file when one shows up in your codebase.

### What JMeter is

A Java desktop application (with CLI mode) for HTTP/protocol load testing. It's been around since the early 2000s.

| Strengths | Weaknesses |
|-----------|------------|
| GUI for visual test plan editing | GUI mode is slow / unsuitable for actual load runs |
| Massive plugin ecosystem | Plugins are inconsistently maintained |
| Supports many protocols (HTTP, JDBC, JMS, AMQP, …) | Verbose XML config |
| Established in enterprise QA | Heavy memory footprint per "thread" |
| Distributed mode built-in | Distributed mode is fragile |
| Familiar to non-developers | Hard to put under version control sanely |

### The JMeter mental model

A JMeter test plan (`.jmx` file) is a tree:

```
Test Plan
├── Thread Group        (the "scenario" — VUs and duration)
│   ├── HTTP Request    (the "step" — sampler)
│   │   └── Response Assertion   (a check)
│   └── Constant Throughput Timer  (rate control)
├── View Results Tree   (a listener — UI/result viewer)
└── Aggregate Report    (another listener)
```

**Equivalents:**
- Thread Group ≈ k6 scenario
- Thread = VU
- Sampler = HTTP request
- Listener = output / reporter
- Assertion = check
- Timer = sleep / rate control

### Reading a JMX file

The provided `jmeter/73-smoke-test.jmx` is a minimal test plan. Excerpts:

```xml
<ThreadGroup>
  <stringProp name="ThreadGroup.num_threads">5</stringProp>     <!-- 5 VUs -->
  <stringProp name="ThreadGroup.duration">30</stringProp>        <!-- 30 sec -->
  <hashTree>
    <HTTPSamplerProxy>
      <stringProp name="HTTPSampler.domain">localhost</stringProp>
      <stringProp name="HTTPSampler.port">3000</stringProp>
      <stringProp name="HTTPSampler.path">/lab/echo</stringProp>
      <stringProp name="HTTPSampler.method">GET</stringProp>
    </HTTPSamplerProxy>
    <hashTree>
      <ResponseAssertion>
        <collectionProp name="Asserion.test_strings">
          <stringProp>200</stringProp>
        </collectionProp>
        <stringProp name="Assertion.test_field">Assertion.response_code</stringProp>
      </ResponseAssertion>
    </hashTree>
  </hashTree>
</ThreadGroup>
```

XML is verbose; the tree structure is what matters.

### Running a JMX file

```bash
# CLI mode — what production uses
jmeter -n -t 73-smoke-test.jmx -l results.jtl -e -o report/

# Flags:
# -n  no-GUI mode
# -t  test plan
# -l  log results to JTL file
# -e  generate HTML report after run
# -o  output directory for HTML report
```

Open `report/index.html` for a Lighthouse-style perf report.

### Migrating JMX to k6

The JMeter team's recommended migration: **Taurus**. Taurus is a tool that takes JMX (or YAML, or others) and runs it via JMeter under the hood, but is a stepping stone — you can rewrite scenarios in Taurus YAML and Taurus is more script-friendly.

Direct JMX → k6: no automatic tool. The path:
1. Identify Thread Groups in the JMX
2. Map each to a k6 scenario
3. Each Sampler becomes an `http.get/post`
4. Each ResponseAssertion becomes a `check()`
5. Timer config becomes `sleep()` or `arrival-rate`
6. Listeners become k6 outputs (`--out json` etc.)

For the kata's `73-smoke-test.jmx`:

```javascript
// k6 equivalent
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 5,         // ThreadGroup.num_threads
  duration: '30s', // ThreadGroup.duration
};

export default function () {
  const res = http.get('http://localhost:3000/lab/echo');
  check(res, {
    'status is 200': (r) => r.status === 200,  // ResponseAssertion
  });
}
```

Roughly 30 lines of XML → 10 lines of JavaScript.

### When to stay on JMeter

Despite k6 being better for new work, **don't migrate** if:

- The team has 10+ years of JMeter expertise and no JS culture
- You have hundreds of existing JMX plans that all work
- You're using a JMeter-specific feature (SOAP samplers, JDBC samplers, JMS samplers — k6 doesn't have these)
- A vendor's perf tool only outputs JMX

Migration is a **multi-quarter effort** for any non-trivial test estate. Don't do it lightly.

### When to push for migration

Migrate when:

- You're starting fresh
- Your team is JS-fluent (Playwright/Cypress backgrounds)
- You need CI integration that JMeter makes painful (k6 Docker image is small; JMeter Docker images are 1GB+)
- You want to use modern observability (Prometheus, Grafana — k6 has first-class support)
- You need to scale to 100k+ RPS (k6 in Go is significantly more efficient per machine)

### The QA Labs server doesn't have a JMeter runner

This kata's "Run Tests" tab will show JMeter as 501 (not implemented) when selected, because we don't ship a JMeter runner in the lab server. The included `.jmx` file is for reference and for running standalone:

```bash
jmeter -n -t katas/phase-18-cicd-and-capstone/73-jmeter-awareness/jmeter/73-smoke-test.jmx -l results.jtl
```

If you want to add JMeter runner support, see `server/src/runners/k6-runner.ts` as a template — the dispatch infrastructure is already there.

## Exercises

1. **Read the JMX.** Open `jmeter/73-smoke-test.jmx` in any text editor. Identify the Thread Group config, the Sampler URL, the Assertion.
2. **Run the JMX.** If you have JMeter installed: `jmeter -n -t 73-smoke-test.jmx -l results.jtl -e -o report/`. Open the HTML report.
3. **Translate to k6.** The translation is given above — verify you can map each JMX element to its k6 equivalent.
4. **Compare runtimes.** Run the JMX with 100 threads. Run the equivalent k6 with 100 VUs. Compare memory usage.
5. **When you'd recommend migration.** Write a 1-paragraph migration justification for an imaginary team. What questions would you need to answer?

## Common Mistakes

- **Running JMeter in GUI mode for actual load.** GUI mode adds significant overhead and is intended for test development, not execution.
- **Trying to put JMX files in code review.** They're huge XML files where line-level diffs are unreadable. Keep tests small or use Taurus YAML.
- **Skipping listeners config.** A misconfigured listener can be the perf bottleneck of your perf test.
- **Ignoring distributed mode setup.** JMeter's distributed mode requires careful config — RMI ports, Java versions matching across all nodes.

## Cheat Sheet

| JMeter element | k6 equivalent |
|----------------|---------------|
| Test Plan | options + default function |
| Thread Group | scenarios entry |
| HTTP Request Sampler | `http.get/post/put` |
| ResponseAssertion | `check()` |
| Constant Throughput Timer | `arrival-rate` executor |
| ConstantTimer | `sleep()` |
| CSV Data Set Config | `SharedArray` + JSON/CSV file |
| If Controller | regular `if` statement |
| Loop Controller | regular `for` loop |
| Listener | `--out` flag |

| When migrating, ask | Answer |
|---------------------|--------|
| How many JMX files? | 1-10: easy. 100+: project. |
| Custom plugins used? | Each needs an equivalent or rewrite. |
| Team JS familiarity? | Low → migration is risky |
| Existing CI integration? | k6 Docker image is much smaller |
| Distributed-mode in use? | k6 cloud or self-hosted distributed |
