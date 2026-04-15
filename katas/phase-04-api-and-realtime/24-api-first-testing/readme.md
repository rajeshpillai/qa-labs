# Kata 24: API-First Testing

## What You Will Learn

- How to send HTTP requests directly from your test framework (no browser UI)
- How to verify response body, status codes, and headers
- How to send POST requests with JSON payloads
- How to chain API calls (create a resource, then fetch it)
- How to test error responses from APIs
- How to send custom headers (e.g., authentication tokens)
- How to run parameterized tests across multiple API inputs
- Differences between Playwright's `request` context and Cypress's `cy.request()`

## Prerequisites

- Completed Katas 22-23 (Network Interception, API Mocking)
- Understanding of HTTP methods, status codes, and JSON
- Understanding of REST API conventions (GET, POST, PUT, DELETE)

## Concepts Explained

### API-First Testing

```
API-first testing means testing the API layer directly — sending real
HTTP requests and verifying responses — WITHOUT loading a browser page.

Why test APIs directly?
  1. Speed  — API tests run 10-100x faster than UI tests
  2. Scope  — catch backend bugs before the UI is involved
  3. Setup  — seed test data via API before running UI tests
  4. Coverage — test error paths that are hard to trigger from the UI

This is NOT the same as mocking (Kata 22-23). Here we hit real endpoints
and verify real responses. We use a public test API (jsonplaceholder)
since we don't have our own backend.
```

### Playwright: request Context

```typescript
// PLAYWRIGHT
// Playwright provides a built-in `request` fixture for making HTTP requests
// without a browser page. It acts like a lightweight HTTP client.
//
// Key methods:
//   request.get(url, options?)   — send a GET request
//   request.post(url, options?)  — send a POST request
//   request.put(url, options?)   — send a PUT request
//   request.delete(url, options?)— send a DELETE request
//
// Options:
//   data    — request body (object, string, or Buffer)
//   headers — custom headers as an object
//   params  — URL query parameters as an object
//
// The response object has:
//   response.status()  — HTTP status code (number)
//   response.headers() — response headers (object)
//   response.json()    — parse body as JSON (Promise)
//   response.text()    — body as string (Promise)
//   response.ok()      — true if status is 200-299

// Example: GET request
const response = await request.get('https://jsonplaceholder.typicode.com/posts/1');
expect(response.status()).toBe(200);
const post = await response.json();
expect(post.id).toBe(1);
```

### Cypress: cy.request()

```typescript
// CYPRESS
// cy.request() sends an HTTP request from the Cypress test runner.
// It does NOT go through the browser — it's sent directly from Node.js.
//
// Signatures:
//   cy.request(url)                     — simple GET
//   cy.request(method, url)             — GET/POST/PUT/DELETE
//   cy.request(method, url, body)       — with request body
//   cy.request({ method, url, headers, body, ... }) — full options
//
// The yielded response has:
//   response.status  — HTTP status code
//   response.headers — response headers
//   response.body    — parsed response body (auto-parsed from JSON)
//   response.duration — request duration in ms
//
// By default, cy.request() fails on non-2xx status codes. Use
// failOnStatusCode: false to test error responses.

// Example: GET request
cy.request('https://jsonplaceholder.typicode.com/posts/1')
  .its('status').should('eq', 200);

cy.request('https://jsonplaceholder.typicode.com/posts/1')
  .its('body').should('have.property', 'id', 1);
```

### Setting a Base URL

```typescript
// PLAYWRIGHT
// Use test.use() to set apiBaseURL so you don't repeat it in every call.
test.use({ baseURL: 'https://jsonplaceholder.typicode.com' });
// Then use relative paths:
const response = await request.get('/posts/1');

// CYPRESS
// Set baseUrl in cypress.config.ts or override per-test:
// In the test, use relative URLs:
cy.request('/posts/1');
```

## Playground

This kata has a **reference page** instead of an interactive playground. The HTML page explains the API-first testing concept and lists the endpoints used in the exercises.

The exercises use **JSONPlaceholder** (`https://jsonplaceholder.typicode.com`), a free public REST API that provides fake data for testing.

## Exercises

### Exercise 1: GET Request and Verify Response Body
Send a GET request to `/posts/1` and verify the response body contains `id: 1`, and has `userId`, `title`, and `body` properties.

### Exercise 2: POST Request with JSON Body
Send a POST request to `/posts` with a JSON body `{ title, body, userId }`. Verify the response contains the posted data and includes a new `id` field.

### Exercise 3: Verify Response Status Code
Send GET requests to `/posts/1` (should return 200) and `/posts/9999` (should return 404). Verify the correct status codes.

### Exercise 4: Verify Response Headers
Send a GET request to `/posts/1` and verify the response headers contain `content-type: application/json`.

### Exercise 5: Chain Requests (Create Then Get)
Send a POST request to create a new post, capture the returned `userId`, then send a GET request to `/users/:userId` to fetch the user who created it. Verify the user data.

### Exercise 6: Verify Error Responses
Send a GET request to `/posts/0` (invalid ID). Verify the response returns a 404 status code and an empty object body.

### Exercise 7: Send Custom Headers
Send a GET request to `/posts/1` with a custom header `X-Request-Source: qa-test`. Verify the request succeeds (the test API ignores unknown headers, but this exercises the header-sending mechanism).

### Exercise 8: Parameterized API Tests
Test multiple posts (IDs 1 through 5) in a loop. For each, send a GET request and verify the response has the matching `id` and all required fields.

## Solutions

### Playwright Solution

See `playwright/api-first-testing.spec.ts`

### Cypress Solution

See `cypress/api-first-testing.cy.ts`

## Common Mistakes

| Mistake | Why it's wrong | Fix |
|---------|---------------|-----|
| Forgetting `await` on `response.json()` in Playwright | `.json()` returns a Promise; without await you get a Promise object, not the data | Always `await response.json()` |
| Using `cy.request()` without `failOnStatusCode: false` for error tests | Cypress throws an error on non-2xx responses by default | Add `failOnStatusCode: false` when testing 4xx/5xx responses |
| Hardcoding response values that might change | Public APIs may update their data | Assert on structure (has property) not exact values where possible |
| Not checking both status AND body | A 200 status doesn't guarantee the body is correct | Always verify both status code and response body |
| Confusing `request` (API client) with `page` (browser) in Playwright | `request.get()` sends a direct HTTP call; `page.goto()` loads a browser page | Use `request` for API tests, `page` for UI tests |
| Sending body with GET requests | GET requests should not have a body per HTTP spec | Use query parameters or URL path segments for GET request data |

## Quick Reference

### Playwright API Testing

| Action | Method | Example |
|--------|--------|---------|
| GET request | `request.get(url)` | `const r = await request.get('/posts/1')` |
| POST request | `request.post(url, { data })` | `const r = await request.post('/posts', { data: { title: '...' } })` |
| Check status | `response.status()` | `expect(r.status()).toBe(200)` |
| Parse JSON body | `response.json()` | `const data = await r.json()` |
| Check headers | `response.headers()` | `const h = r.headers()` |
| Set base URL | `test.use({ baseURL })` | `test.use({ baseURL: 'https://...' })` |
| Custom headers | `request.get(url, { headers })` | `request.get('/posts', { headers: { 'X-Foo': 'bar' } })` |

### Cypress API Testing

| Action | Method | Example |
|--------|--------|---------|
| GET request | `cy.request(url)` | `cy.request('/posts/1')` |
| POST request | `cy.request('POST', url, body)` | `cy.request('POST', '/posts', { title: '...' })` |
| Check status | `.its('status')` | `.its('status').should('eq', 200)` |
| Check body | `.its('body')` | `.its('body').should('have.property', 'id')` |
| Check headers | `.its('headers')` | `.its('headers').its('content-type')` |
| Allow errors | `failOnStatusCode: false` | `cy.request({ url, failOnStatusCode: false })` |
| Custom headers | `cy.request({ headers })` | `cy.request({ url, headers: { 'X-Foo': 'bar' } })` |
