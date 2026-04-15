import { test, expect } from '@playwright/test';

// The base URL for our playground page. All tests navigate here first.
const PLAYGROUND = '/phase-04-api-and-realtime/22-network-interception/playground/';

// --------------------------------------------------------------------------
// Exercise 1: Intercept POST and Return Mock Success
// --------------------------------------------------------------------------
// This exercise demonstrates page.route() to intercept a POST request and
// return a mock JSON response. The app's fetch() receives this fake response
// as if a real server sent it.
test('exercise 1: intercept POST and return mock success', async ({ page }) => {
  // Set up the route intercept BEFORE navigating to the page.
  // page.route(urlPattern, handler) registers a handler that runs whenever
  // a request matching the pattern is made. The handler receives:
  //   route   — used to fulfill, abort, or continue the request
  //   request — the outgoing request object with method, url, headers, body
  await page.route('/api/kyc/submit', async (route) => {
    // route.fulfill() sends a mock response back to the browser.
    // The app's fetch() call resolves with this response.
    await route.fulfill({
      // status — the HTTP status code to return (200 = OK)
      status: 200,
      // contentType — the Content-Type header of the response
      contentType: 'application/json',
      // body — the response body as a string
      body: JSON.stringify({ referenceId: 'KYC-2024-001' })
    });
  });

  // Navigate to the playground.
  await page.goto(PLAYGROUND);

  // Fill in the KYC form fields.
  // fill(value) clears the field first, then types the value.
  await page.getByTestId('full-name-input').fill('Aisha Patel');
  await page.getByTestId('email-input').fill('aisha@example.com');

  // Click the submit button to trigger the POST request.
  await page.getByTestId('submit-btn').click();

  // Verify the success message appears with the reference ID.
  // The app displays the referenceId from our mock response.
  await expect(page.getByTestId('submit-status')).toContainText('KYC-2024-001');
  await expect(page.getByTestId('submit-status')).toHaveClass(/status-success/);
});

// --------------------------------------------------------------------------
// Exercise 2: Intercept GET and Return Mock Applicant Data
// --------------------------------------------------------------------------
// This exercise intercepts a GET request and returns mock applicant data.
// The URL pattern uses a glob wildcard (*) to match the query string.
test('exercise 2: intercept GET and return mock applicant data', async ({ page }) => {
  // Intercept GET requests to /api/applicant with any query string.
  // The '*' at the end matches any characters (the ?id=... query parameter).
  await page.route('/api/applicant*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        name: 'Aisha Patel',
        email: 'aisha@example.com',
        country: 'India',
        riskLevel: 'High'
      })
    });
  });

  await page.goto(PLAYGROUND);

  // Click the "Load Applicant" button to trigger the GET request.
  await page.getByTestId('load-applicant-btn').click();

  // Verify the applicant data is displayed in the card.
  // The app populates these fields from our mock response.
  await expect(page.getByTestId('applicant-card')).toBeVisible();
  await expect(page.getByTestId('applicant-name')).toHaveText('Aisha Patel');
  await expect(page.getByTestId('applicant-email')).toHaveText('aisha@example.com');
  await expect(page.getByTestId('applicant-country')).toHaveText('India');
  await expect(page.getByTestId('applicant-risk')).toHaveText('High');
});

// --------------------------------------------------------------------------
// Exercise 3: Verify Request Body Sent
// --------------------------------------------------------------------------
// This exercise intercepts the POST request and inspects the request body
// to verify the app sends the correct data.
test('exercise 3: verify request body sent in POST', async ({ page }) => {
  // We store the captured request body in a variable so we can assert on
  // it after the request completes.
  let capturedBody: Record<string, string> = {};

  await page.route('/api/kyc/submit', async (route, request) => {
    // request.postData() returns the raw body string of the POST request.
    // We parse it as JSON to inspect individual fields.
    const bodyText = request.postData() || '{}';
    capturedBody = JSON.parse(bodyText);

    // Still fulfill the request so the app doesn't hang.
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ referenceId: 'KYC-2024-002' })
    });
  });

  await page.goto(PLAYGROUND);

  // Fill in the form with specific values we will verify in the request body.
  await page.getByTestId('full-name-input').fill('Ben Okafor');
  await page.getByTestId('email-input').fill('ben@example.com');
  // selectOption(value) selects an <option> by its value attribute.
  await page.getByTestId('country-select').selectOption('GB');
  await page.getByTestId('doc-type-select').selectOption('drivers-license');

  // Submit the form.
  await page.getByTestId('submit-btn').click();

  // Wait for the success message so we know the request completed.
  await expect(page.getByTestId('submit-status')).toBeVisible();

  // Now verify the captured request body contains the expected values.
  // These assertions run on the data we captured in the route handler.
  expect(capturedBody.fullName).toBe('Ben Okafor');
  expect(capturedBody.email).toBe('ben@example.com');
  expect(capturedBody.country).toBe('GB');
  expect(capturedBody.documentType).toBe('drivers-license');
});

// --------------------------------------------------------------------------
// Exercise 4: Verify Request Headers
// --------------------------------------------------------------------------
// This exercise intercepts the POST request and verifies the headers sent
// by the app, including Content-Type, Authorization, and custom headers.
test('exercise 4: verify request headers', async ({ page }) => {
  // Store captured headers for assertions after the request completes.
  let capturedHeaders: Record<string, string> = {};

  await page.route('/api/kyc/submit', async (route, request) => {
    // request.headers() returns all request headers as a plain object.
    // Header names are lowercased by the browser.
    capturedHeaders = request.headers();

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ referenceId: 'KYC-2024-003' })
    });
  });

  await page.goto(PLAYGROUND);

  // Fill in required fields and submit.
  await page.getByTestId('full-name-input').fill('Clara Jansen');
  await page.getByTestId('email-input').fill('clara@example.com');
  await page.getByTestId('submit-btn').click();

  // Wait for the response to complete.
  await expect(page.getByTestId('submit-status')).toBeVisible();

  // Verify the headers. Browser lowercases header names in the headers() object.
  expect(capturedHeaders['content-type']).toBe('application/json');
  expect(capturedHeaders['authorization']).toBe('Bearer test-token-abc123');
  expect(capturedHeaders['x-client-version']).toBe('1.0.0');
});

// --------------------------------------------------------------------------
// Exercise 5: Intercept and Return Error Response
// --------------------------------------------------------------------------
// This exercise returns an error response (422) to test the app's error
// handling. The app should display the error message from the response body.
test('exercise 5: intercept and return error response', async ({ page }) => {
  await page.route('/api/kyc/submit', async (route) => {
    // Return a 422 Unprocessable Entity status with an error message.
    // The app checks response.ok (which is false for 422) and shows the error.
    await route.fulfill({
      status: 422,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Invalid document type for selected country' })
    });
  });

  await page.goto(PLAYGROUND);

  // Fill in and submit the form.
  await page.getByTestId('full-name-input').fill('Derek Wong');
  await page.getByTestId('email-input').fill('derek@example.com');
  await page.getByTestId('submit-btn').click();

  // Verify the error message is displayed in the UI.
  await expect(page.getByTestId('submit-status')).toContainText(
    'Invalid document type for selected country'
  );
  await expect(page.getByTestId('submit-status')).toHaveClass(/status-error/);
});

// --------------------------------------------------------------------------
// Exercise 6: Wait for Specific Response
// --------------------------------------------------------------------------
// This exercise uses page.waitForResponse() to explicitly wait for a network
// response. This is useful when you need to wait for a request that happens
// asynchronously after some user action.
test('exercise 6: wait for specific response', async ({ page }) => {
  // Set up the intercept with a small delay to simulate network latency.
  await page.route('/api/applicant*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        name: 'Elena Vasquez',
        email: 'elena@example.com',
        country: 'Spain',
        riskLevel: 'Low'
      })
    });
  });

  await page.goto(PLAYGROUND);

  // page.waitForResponse(urlOrPredicate) returns a Promise that resolves
  // when a response matching the pattern is received. We start waiting
  // BEFORE clicking the button, then await both promises.
  const responsePromise = page.waitForResponse('/api/applicant*');

  // Click the button to trigger the request.
  await page.getByTestId('load-applicant-btn').click();

  // Await the response. This pauses the test until the response arrives.
  const response = await responsePromise;

  // Verify the response details.
  // response.status() returns the HTTP status code.
  expect(response.status()).toBe(200);

  // response.json() parses the response body as JSON.
  const data = await response.json();
  expect(data.name).toBe('Elena Vasquez');

  // Verify the UI also updated.
  await expect(page.getByTestId('applicant-name')).toHaveText('Elena Vasquez');
});

// --------------------------------------------------------------------------
// Exercise 7: Verify Multiple Requests
// --------------------------------------------------------------------------
// This exercise sets up intercepts for both GET and POST requests, triggers
// both, and verifies that both were made.
test('exercise 7: verify multiple requests', async ({ page }) => {
  // Track how many times each route was called.
  let getRequestCount = 0;
  let postRequestCount = 0;

  // Intercept the GET request.
  await page.route('/api/applicant*', async (route) => {
    getRequestCount++;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        name: 'Fiona Chen',
        email: 'fiona@example.com',
        country: 'China',
        riskLevel: 'Medium'
      })
    });
  });

  // Intercept the POST request.
  await page.route('/api/kyc/submit', async (route) => {
    postRequestCount++;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ referenceId: 'KYC-2024-007' })
    });
  });

  await page.goto(PLAYGROUND);

  // Trigger the GET request by loading applicant data.
  await page.getByTestId('load-applicant-btn').click();
  await expect(page.getByTestId('applicant-card')).toBeVisible();

  // Trigger the POST request by submitting the form.
  await page.getByTestId('full-name-input').fill('Fiona Chen');
  await page.getByTestId('email-input').fill('fiona@example.com');
  await page.getByTestId('submit-btn').click();
  await expect(page.getByTestId('submit-status')).toBeVisible();

  // Verify both requests were made exactly once.
  expect(getRequestCount).toBe(1);
  expect(postRequestCount).toBe(1);
});

// --------------------------------------------------------------------------
// Exercise 8: Abort a Request
// --------------------------------------------------------------------------
// This exercise demonstrates route.abort(), which cancels a request entirely.
// The app's fetch() call will throw a network error.
test('exercise 8: abort a request', async ({ page }) => {
  // route.abort(errorCode?) cancels the request. The browser treats this as
  // a network failure. The app's try/catch block handles it and shows an error.
  // Common error codes:
  //   'aborted'            — the request was aborted by the client
  //   'failed'             — generic network failure
  //   'connectionrefused'  — server refused the connection
  await page.route('/api/kyc/submit', async (route) => {
    await route.abort('failed');
  });

  await page.goto(PLAYGROUND);

  // Fill in the form and submit.
  await page.getByTestId('full-name-input').fill('Grace Kim');
  await page.getByTestId('email-input').fill('grace@example.com');
  await page.getByTestId('submit-btn').click();

  // Verify the error message appears — the app shows an error when fetch fails.
  await expect(page.getByTestId('submit-status')).toBeVisible();
  await expect(page.getByTestId('submit-status')).toHaveClass(/status-error/);
});
