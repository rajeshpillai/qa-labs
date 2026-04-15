import { test, expect } from '@playwright/test';

// Set the base URL for all API requests in this file.
// test.use() configures test-level options. baseURL is prepended to all
// relative URLs used with request.get(), request.post(), etc.
// This avoids repeating the full domain in every test.
test.use({ baseURL: 'https://jsonplaceholder.typicode.com' });

// --------------------------------------------------------------------------
// Exercise 1: GET Request and Verify Response Body
// --------------------------------------------------------------------------
// This exercise sends a GET request to an API endpoint and verifies the
// response body contains the expected properties.
test('exercise 1: GET request and verify response body', async ({ request }) => {
  // request.get(url) sends an HTTP GET request and returns a Response object.
  // The `request` fixture is Playwright's built-in API client — it does NOT
  // load a browser page. Requests go directly over the network.
  const response = await request.get('/posts/1');

  // response.status() returns the HTTP status code as a number.
  expect(response.status()).toBe(200);

  // response.json() parses the response body as JSON and returns the
  // resulting JavaScript object. This is async — always use await.
  const post = await response.json();

  // Verify the post has the expected structure and values.
  // toHaveProperty(key, value?) checks that the object has the property.
  expect(post).toHaveProperty('id', 1);
  expect(post).toHaveProperty('userId');
  expect(post).toHaveProperty('title');
  expect(post).toHaveProperty('body');

  // Verify that title and body are non-empty strings.
  // typeof checks the JavaScript type of the value.
  expect(typeof post.title).toBe('string');
  expect(post.title.length).toBeGreaterThan(0);
});

// --------------------------------------------------------------------------
// Exercise 2: POST Request with JSON Body
// --------------------------------------------------------------------------
// This exercise sends a POST request with a JSON body and verifies the
// response includes the posted data plus a server-assigned ID.
test('exercise 2: POST request with JSON body', async ({ request }) => {
  // request.post(url, options) sends an HTTP POST request.
  // The `data` option specifies the request body. When you pass an object,
  // Playwright automatically serializes it as JSON and sets the Content-Type
  // header to application/json.
  const response = await request.post('/posts', {
    data: {
      title: 'KYC Automation Best Practices',
      body: 'This post covers the key patterns for automating KYC workflows.',
      userId: 1
    }
  });

  // Verify the response status is 201 Created.
  // JSONPlaceholder returns 201 for successful POST requests.
  expect(response.status()).toBe(201);

  // Parse the response body.
  const createdPost = await response.json();

  // Verify the response includes our posted data.
  expect(createdPost.title).toBe('KYC Automation Best Practices');
  expect(createdPost.body).toBe(
    'This post covers the key patterns for automating KYC workflows.'
  );
  expect(createdPost.userId).toBe(1);

  // Verify the server assigned an ID to the new post.
  // JSONPlaceholder always returns id: 101 for new posts.
  expect(createdPost).toHaveProperty('id');
  expect(typeof createdPost.id).toBe('number');
});

// --------------------------------------------------------------------------
// Exercise 3: Verify Response Status Code
// --------------------------------------------------------------------------
// This exercise tests both a successful response (200) and a not-found
// response (404) to verify the API returns correct status codes.
test('exercise 3: verify response status codes', async ({ request }) => {
  // Test a valid post ID — should return 200 OK.
  const successResponse = await request.get('/posts/1');
  expect(successResponse.status()).toBe(200);

  // response.ok() is a convenience method that returns true if the status
  // code is in the 200-299 range.
  expect(successResponse.ok()).toBe(true);

  // Test an invalid post ID — should return 404 Not Found.
  // Playwright does NOT throw on non-2xx responses (unlike Cypress).
  // It returns the response and lets you check the status manually.
  const notFoundResponse = await request.get('/posts/9999');
  expect(notFoundResponse.status()).toBe(404);
  expect(notFoundResponse.ok()).toBe(false);
});

// --------------------------------------------------------------------------
// Exercise 4: Verify Response Headers
// --------------------------------------------------------------------------
// This exercise inspects the response headers to verify the API returns
// the correct Content-Type.
test('exercise 4: verify response headers', async ({ request }) => {
  const response = await request.get('/posts/1');

  // response.headers() returns the response headers as a plain object.
  // Header names are lowercased.
  const headers = response.headers();

  // Verify the Content-Type header indicates JSON.
  // The value includes the charset: 'application/json; charset=utf-8'
  // We use toContain() for a partial match.
  expect(headers['content-type']).toContain('application/json');

  // Verify common HTTP headers are present.
  // 'cache-control' tells the browser/client how to cache the response.
  expect(headers).toHaveProperty('cache-control');
});

// --------------------------------------------------------------------------
// Exercise 5: Chain Requests (Create Then Get)
// --------------------------------------------------------------------------
// This exercise demonstrates chaining API calls: first create a post,
// then use the returned userId to fetch the user who created it.
test('exercise 5: chain requests - create then get related data', async ({ request }) => {
  // Step 1: Create a new post.
  const createResponse = await request.post('/posts', {
    data: {
      title: 'Risk Assessment Report',
      body: 'Quarterly risk assessment findings.',
      userId: 3
    }
  });
  expect(createResponse.status()).toBe(201);

  // Parse the created post to get the userId.
  const createdPost = await createResponse.json();
  const userId = createdPost.userId;

  // Step 2: Fetch the user who "created" this post.
  // We use the userId from the first response to build the second request URL.
  const userResponse = await request.get(`/users/${userId}`);
  expect(userResponse.status()).toBe(200);

  // Parse the user data and verify it.
  const user = await userResponse.json();
  expect(user).toHaveProperty('id', userId);
  expect(user).toHaveProperty('name');
  expect(user).toHaveProperty('email');
  expect(user).toHaveProperty('username');

  // Verify the user has a complete address object.
  expect(user).toHaveProperty('address');
  expect(user.address).toHaveProperty('city');
});

// --------------------------------------------------------------------------
// Exercise 6: Verify Error Responses
// --------------------------------------------------------------------------
// This exercise tests how the API handles invalid requests and verifies
// the error response format.
test('exercise 6: verify error responses', async ({ request }) => {
  // Request a post with ID 0, which doesn't exist.
  const response = await request.get('/posts/0');

  // Verify the status code is 404 (Not Found).
  expect(response.status()).toBe(404);

  // Verify the response body is an empty object (JSONPlaceholder's convention).
  const body = await response.json();
  expect(body).toEqual({});

  // Also test with a completely invalid resource path.
  const badPathResponse = await request.get('/nonexistent-endpoint');
  expect(badPathResponse.status()).toBe(404);
});

// --------------------------------------------------------------------------
// Exercise 7: Send Custom Headers
// --------------------------------------------------------------------------
// This exercise sends a request with custom headers, which is a common
// pattern for authentication and request tracing.
test('exercise 7: send custom headers', async ({ request }) => {
  // request.get(url, { headers }) sends the request with additional headers.
  // The `headers` option is an object of header-name -> value pairs.
  const response = await request.get('/posts/1', {
    headers: {
      // Custom header for request tracing (common in fintech systems).
      'X-Request-Source': 'qa-test',
      // Custom correlation ID for log tracing.
      'X-Correlation-Id': 'test-run-12345',
      // Accept header to request JSON format.
      'Accept': 'application/json'
    }
  });

  // The request should succeed — the test API ignores unknown headers.
  expect(response.status()).toBe(200);

  // Verify the response is valid JSON with expected structure.
  const post = await response.json();
  expect(post).toHaveProperty('id', 1);
  expect(post).toHaveProperty('title');
});

// --------------------------------------------------------------------------
// Exercise 8: Parameterized API Tests
// --------------------------------------------------------------------------
// This exercise loops over multiple inputs to run the same assertion pattern
// against different API resources. This is a form of data-driven testing.

// Define the test data: an array of post IDs to test.
// Each entry will generate a separate test case.
const postIds = [1, 2, 3, 4, 5];

for (const postId of postIds) {
  // We create a separate test for each post ID.
  // The test name includes the ID so you can see which one failed.
  test(`exercise 8: verify post ${postId} has valid structure`, async ({ request }) => {
    const response = await request.get(`/posts/${postId}`);

    // Verify status code.
    expect(response.status()).toBe(200);

    // Parse the response body.
    const post = await response.json();

    // Verify the post ID matches what we requested.
    expect(post.id).toBe(postId);

    // Verify all required fields are present and have valid types.
    expect(post).toHaveProperty('userId');
    expect(typeof post.userId).toBe('number');
    expect(post).toHaveProperty('title');
    expect(typeof post.title).toBe('string');
    expect(post.title.length).toBeGreaterThan(0);
    expect(post).toHaveProperty('body');
    expect(typeof post.body).toBe('string');
    expect(post.body.length).toBeGreaterThan(0);
  });
}
