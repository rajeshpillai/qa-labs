# Kata 22: Network Interception

## What You Will Learn

- How to intercept HTTP requests in your tests and return mock responses
- How to verify the request body, headers, and URL parameters your app sends
- How to simulate error responses from the server
- How to wait for specific network requests to complete
- How to abort requests and verify the app handles it gracefully
- Differences between Playwright's `page.route()` and Cypress's `cy.intercept()`

## Prerequisites

- Completed Katas 01-21
- Understanding of HTTP methods (GET, POST), JSON, and the fetch API
- Understanding of async/await

## Concepts Explained

### Why Intercept Network Requests?

```
In real-world apps, the frontend communicates with a backend API.
During testing, we often do NOT want to hit the real API because:

  1. The backend might not be running
  2. The backend might be slow or unreliable
  3. We want to test specific scenarios (errors, edge cases)
  4. We want deterministic, repeatable tests

Network interception lets us catch outgoing requests and return
fake (mock) responses, giving us full control over what the app sees.
```

### Playwright: page.route()

```typescript
// PLAYWRIGHT
// page.route(urlPattern, handler) intercepts requests matching the pattern.
//
// Signature:
//   page.route(
//     url: string | RegExp | ((url: URL) => boolean),
//     handler: (route: Route, request: Request) => void,
//     options?: { times?: number }
//   ): Promise<void>
//
// Parameters:
//   url     — a glob string, regex, or predicate function to match request URLs
//   handler — a callback that receives a Route object and the Request object
//   times   — how many times to intercept (optional; omit for unlimited)
//
// The Route object has three key methods:
//   route.fulfill(options) — respond with a mock response (status, body, headers)
//   route.abort(errorCode?) — abort the request (simulates network failure)
//   route.continue(overrides?) — let the request proceed, optionally modifying it

// Example: intercept a GET request and return mock JSON data
await page.route('/api/applicant*', async (route) => {
  // route.fulfill() sends a fake response back to the browser.
  // The app's fetch() call receives this response as if the server sent it.
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ name: 'Aisha Patel', email: 'aisha@example.com' })
  });
});

// Example: intercept a POST and check the request body
await page.route('/api/kyc/submit', async (route, request) => {
  // request.postData() returns the body of the request as a string.
  const body = JSON.parse(request.postData() || '{}');
  console.log(body.fullName); // "Aisha Patel"
  await route.fulfill({ status: 200, body: '{"referenceId": "KYC-001"}' });
});
```

### Cypress: cy.intercept()

```typescript
// CYPRESS
// cy.intercept(method, url, response?) intercepts requests matching the
// method and URL pattern.
//
// Signature:
//   cy.intercept(method: string, url: string | RegExp, response?: object)
//   cy.intercept(method, url, routeHandler: Function)
//   cy.intercept(url, response)
//
// Parameters:
//   method  — HTTP method to match: 'GET', 'POST', etc.
//   url     — URL pattern (string glob or RegExp)
//   response — a static response object { statusCode, body, headers }
//   routeHandler — a function to dynamically handle the request
//
// Key features:
//   .as('alias')     — give the intercept a name so you can wait for it
//   cy.wait('@alias') — pause the test until the intercepted request fires

// Example: intercept a GET and return mock data
cy.intercept('GET', '/api/applicant*', {
  statusCode: 200,
  body: { name: 'Aisha Patel', email: 'aisha@example.com' }
}).as('getApplicant');

// Example: wait for the intercept to fire after triggering the request
cy.get('[data-testid="load-applicant-btn"]').click();
cy.wait('@getApplicant');
cy.get('[data-testid="applicant-name"]').should('have.text', 'Aisha Patel');
```

### Verifying Request Details

```typescript
// PLAYWRIGHT
// The request object passed to the route handler lets you inspect:
//   request.method()   — HTTP method (GET, POST, etc.)
//   request.url()      — full request URL
//   request.headers()  — all request headers as an object
//   request.postData() — request body as a string (for POST/PUT requests)

await page.route('/api/kyc/submit', async (route, request) => {
  const headers = request.headers();
  expect(headers['content-type']).toBe('application/json');
  expect(headers['authorization']).toBe('Bearer test-token-abc123');
  await route.fulfill({ status: 200, body: '{"referenceId":"KYC-001"}' });
});

// CYPRESS
// After cy.wait('@alias'), the yielded interception object has:
//   interception.request.body    — parsed request body
//   interception.request.headers — request headers object
//   interception.request.url     — full request URL
//   interception.response.body   — response body

cy.wait('@submitKyc').then((interception) => {
  expect(interception.request.body).to.have.property('fullName', 'Aisha Patel');
  expect(interception.request.headers).to.have.property('authorization');
});
```

### Aborting Requests

```typescript
// PLAYWRIGHT
// route.abort(errorCode?) cancels the request. The fetch() call in the app
// will throw a network error. Common error codes:
//   'aborted'       — request was aborted
//   'failed'        — network failure
//   'connectionrefused' — server refused the connection
await page.route('/api/kyc/submit', (route) => route.abort('failed'));

// CYPRESS
// Use forceNetworkError to simulate a complete network failure.
cy.intercept('POST', '/api/kyc/submit', { forceNetworkError: true }).as('submitFail');
```

## Playground

The playground is a "KYC Submission Form" with two main sections:

1. **Applicant Lookup** — an input field and "Load Applicant" button. Clicking the button sends a `GET /api/applicant?id=APP-1001` request with an `Accept: application/json` and `X-Client-Version: 1.0.0` header. Displays the returned applicant data (name, email, country, risk level) or an error message.

2. **KYC Submission Form** — a form with fields for full name, email, country, and document type. Submitting sends a `POST /api/kyc/submit` request with a JSON body and `Authorization: Bearer test-token-abc123` header. Shows a loading state during submission, then a success message (with reference ID) or error message.

**Important:** There is no real backend. These fetch requests will 404 unless intercepted by the test framework. This is intentional — the exercises teach you to intercept and mock these requests.

## Exercises

### Exercise 1: Intercept POST and Return Mock Success
Set up a route intercept for `POST /api/kyc/submit` that returns a 200 response with `{ "referenceId": "KYC-2024-001" }`. Fill in the form and submit it. Verify the success message appears with the reference ID.

### Exercise 2: Intercept GET and Return Mock Applicant Data
Intercept `GET /api/applicant*` and return mock applicant data `{ name, email, country, riskLevel }`. Click the Load Applicant button. Verify the applicant card displays the correct data.

### Exercise 3: Verify Request Body Sent
Intercept the POST request and capture the request body. Fill in the form with specific values and submit. Verify the request body contains the expected fields (fullName, email, country, documentType).

### Exercise 4: Verify Request Headers
Intercept the POST request and inspect the request headers. Verify the `Content-Type` is `application/json`, the `Authorization` header is `Bearer test-token-abc123`, and `X-Client-Version` is `1.0.0`.

### Exercise 5: Intercept and Return Error Response
Intercept the POST request and return a 422 error with `{ "message": "Invalid document type for selected country" }`. Submit the form and verify the error message appears in the UI.

### Exercise 6: Wait for Specific Response
Set up a route intercept and trigger the request. Use Playwright's `waitForResponse()` or Cypress's `cy.wait('@alias')` to explicitly wait for the response before asserting.

### Exercise 7: Verify Multiple Requests
Load the applicant data, then submit the KYC form. Verify that both the GET and POST requests were made (both intercepts fired). Check request counts.

### Exercise 8: Abort a Request
Set up a route intercept that aborts the POST request. Submit the form. Verify the app shows an error message when the request fails.

## Solutions

### Playwright Solution

See `playwright/network-interception.spec.ts`

### Cypress Solution

See `cypress/network-interception.cy.ts`

## Common Mistakes

| Mistake | Why it's wrong | Fix |
|---------|---------------|-----|
| Setting up intercept AFTER clicking the button | The request fires before the intercept is registered, so it won't be caught | Always set up `page.route()` or `cy.intercept()` BEFORE triggering the action |
| Forgetting `await` on `route.fulfill()` in Playwright | The handler returns before the response is sent, causing flaky behavior | Always `await route.fulfill()` |
| Not matching the URL pattern correctly | Glob patterns need `*` for wildcards; query strings are part of the URL | Use `'/api/applicant*'` to match URLs with query params |
| Forgetting `contentType` in `route.fulfill()` | The browser may not parse the response as JSON | Include `contentType: 'application/json'` |
| Checking request body before `cy.wait()` in Cypress | The request hasn't fired yet | Always `cy.wait('@alias')` first, then inspect the interception |
| Using `route.continue()` when you want `route.fulfill()` | `continue()` forwards to the real server; `fulfill()` returns a mock response | Use `fulfill()` to mock, `continue()` to modify and forward |

## Quick Reference

### Playwright Network Interception

| Action | Method | Example |
|--------|--------|---------|
| Intercept requests | `page.route(url, handler)` | `await page.route('/api/*', handler)` |
| Return mock response | `route.fulfill(options)` | `await route.fulfill({ status: 200, body: '{}' })` |
| Abort request | `route.abort(errorCode?)` | `await route.abort('failed')` |
| Continue with changes | `route.continue(overrides?)` | `await route.continue({ headers })` |
| Get request body | `request.postData()` | `const body = request.postData()` |
| Get request headers | `request.headers()` | `const headers = request.headers()` |
| Wait for response | `page.waitForResponse(url)` | `await page.waitForResponse('/api/*')` |
| Limit intercept count | `page.route(url, handler, { times })` | `await page.route('/api/*', handler, { times: 1 })` |

### Cypress Network Interception

| Action | Method | Example |
|--------|--------|---------|
| Intercept requests | `cy.intercept(method, url, response)` | `cy.intercept('GET', '/api/*', { body: {} })` |
| Alias an intercept | `.as('name')` | `cy.intercept('GET', '/api/*', {}).as('getData')` |
| Wait for intercept | `cy.wait('@alias')` | `cy.wait('@getData')` |
| Inspect request | `cy.wait('@alias').then(i => ...)` | Access `i.request.body`, `i.request.headers` |
| Return error | `{ statusCode: 500, body: {...} }` | `cy.intercept('POST', '/api/*', { statusCode: 500 })` |
| Force network error | `{ forceNetworkError: true }` | `cy.intercept('POST', '/api/*', { forceNetworkError: true })` |
| Dynamic handler | `cy.intercept(method, url, (req) => {...})` | `req.reply({ statusCode: 200, body: {} })` |
| Match multiple times | Default behavior | Cypress intercepts all matching requests by default |
