// Base URL for the public test API.
// JSONPlaceholder is a free REST API for testing and prototyping.
const API_BASE = 'https://jsonplaceholder.typicode.com';

describe('Kata 24: API-First Testing', () => {

  // --------------------------------------------------------------------------
  // Exercise 1: GET Request and Verify Response Body
  // --------------------------------------------------------------------------
  // This exercise sends a GET request directly (no browser page) and verifies
  // the response body structure.
  it('exercise 1: GET request and verify response body', () => {
    // cy.request(url) sends an HTTP GET request from the Cypress test runner.
    // Unlike cy.visit(), this does NOT load a browser page — it makes a direct
    // HTTP call. The response is yielded for assertions.
    cy.request(`${API_BASE}/posts/1`).then((response) => {
      // response.status contains the HTTP status code.
      expect(response.status).to.equal(200);

      // response.body contains the parsed response body.
      // Cypress auto-parses JSON responses into JavaScript objects.
      const post = response.body;

      // Verify the post has the expected structure and values.
      expect(post).to.have.property('id', 1);
      expect(post).to.have.property('userId');
      expect(post).to.have.property('title');
      expect(post).to.have.property('body');

      // Verify title is a non-empty string.
      expect(post.title).to.be.a('string');
      expect(post.title.length).to.be.greaterThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 2: POST Request with JSON Body
  // --------------------------------------------------------------------------
  // This exercise sends a POST request with a JSON body and verifies the
  // response includes the posted data with a new ID.
  it('exercise 2: POST request with JSON body', () => {
    // cy.request(method, url, body) sends a request with the specified method.
    // When the body is a JavaScript object, Cypress automatically sets the
    // Content-Type header to application/json and serializes the body.
    cy.request('POST', `${API_BASE}/posts`, {
      title: 'KYC Automation Best Practices',
      body: 'This post covers the key patterns for automating KYC workflows.',
      userId: 1
    }).then((response) => {
      // JSONPlaceholder returns 201 Created for POST requests.
      expect(response.status).to.equal(201);

      // Verify the response includes our posted data.
      expect(response.body.title).to.equal('KYC Automation Best Practices');
      expect(response.body.body).to.equal(
        'This post covers the key patterns for automating KYC workflows.'
      );
      expect(response.body.userId).to.equal(1);

      // Verify the server assigned an ID.
      expect(response.body).to.have.property('id');
      expect(response.body.id).to.be.a('number');
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Verify Response Status Code
  // --------------------------------------------------------------------------
  // This exercise tests both successful and error responses. By default,
  // cy.request() fails on non-2xx status codes, so we use failOnStatusCode.
  it('exercise 3: verify response status codes', () => {
    // Test a valid post ID — should return 200.
    cy.request(`${API_BASE}/posts/1`).its('status').should('equal', 200);

    // Test an invalid post ID — should return 404.
    // By default, cy.request() FAILS on non-2xx responses. We must set
    // failOnStatusCode: false to allow 4xx/5xx responses without failing.
    cy.request({
      url: `${API_BASE}/posts/9999`,
      // failOnStatusCode: false tells Cypress "don't fail on 4xx/5xx status
      // codes — I want to assert on them myself."
      failOnStatusCode: false
    }).its('status').should('equal', 404);
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Verify Response Headers
  // --------------------------------------------------------------------------
  // This exercise checks the response headers to verify Content-Type.
  it('exercise 4: verify response headers', () => {
    cy.request(`${API_BASE}/posts/1`).then((response) => {
      // response.headers is an object of header-name -> value pairs.
      // Header names are lowercased by Cypress.
      expect(response.headers).to.have.property('content-type');

      // Verify the Content-Type contains 'application/json'.
      // We use .include() for a partial match since the value may include
      // charset: 'application/json; charset=utf-8'
      expect(response.headers['content-type']).to.include('application/json');

      // Verify cache-control header is present.
      expect(response.headers).to.have.property('cache-control');
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Chain Requests (Create Then Get)
  // --------------------------------------------------------------------------
  // This exercise chains two API calls: create a post, then fetch the user.
  it('exercise 5: chain requests - create then get related data', () => {
    // Step 1: Create a new post.
    cy.request('POST', `${API_BASE}/posts`, {
      title: 'Risk Assessment Report',
      body: 'Quarterly risk assessment findings.',
      userId: 3
    }).then((createResponse) => {
      expect(createResponse.status).to.equal(201);

      // Extract the userId from the created post.
      const userId = createResponse.body.userId;

      // Step 2: Fetch the user who "created" this post.
      // We chain a second cy.request() inside the .then() callback.
      // This ensures the second request runs AFTER the first completes.
      cy.request(`${API_BASE}/users/${userId}`).then((userResponse) => {
        expect(userResponse.status).to.equal(200);

        const user = userResponse.body;
        expect(user).to.have.property('id', userId);
        expect(user).to.have.property('name');
        expect(user).to.have.property('email');
        expect(user).to.have.property('username');

        // Verify the user has a complete address.
        expect(user).to.have.property('address');
        expect(user.address).to.have.property('city');
      });
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Verify Error Responses
  // --------------------------------------------------------------------------
  // This exercise tests API error handling by requesting invalid resources.
  it('exercise 6: verify error responses', () => {
    // Request a post with ID 0 (doesn't exist).
    // We must use failOnStatusCode: false to prevent Cypress from failing
    // automatically on the 404 response.
    cy.request({
      url: `${API_BASE}/posts/0`,
      failOnStatusCode: false
    }).then((response) => {
      // Verify 404 status.
      expect(response.status).to.equal(404);

      // Verify the body is an empty object (JSONPlaceholder's convention).
      expect(response.body).to.deep.equal({});
    });

    // Test a completely invalid endpoint.
    cy.request({
      url: `${API_BASE}/nonexistent-endpoint`,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.equal(404);
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 7: Send Custom Headers
  // --------------------------------------------------------------------------
  // This exercise demonstrates sending custom headers, commonly used for
  // authentication tokens and request tracing.
  it('exercise 7: send custom headers', () => {
    // Use the object form of cy.request() to specify custom headers.
    // The headers option is an object of header-name -> value pairs.
    cy.request({
      method: 'GET',
      url: `${API_BASE}/posts/1`,
      headers: {
        // Custom header for request tracing.
        'X-Request-Source': 'qa-test',
        // Custom correlation ID for log tracing.
        'X-Correlation-Id': 'test-run-12345',
        // Accept header to request JSON.
        'Accept': 'application/json'
      }
    }).then((response) => {
      // The request should succeed — the test API ignores unknown headers.
      expect(response.status).to.equal(200);

      // Verify the response is valid JSON with expected structure.
      expect(response.body).to.have.property('id', 1);
      expect(response.body).to.have.property('title');
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 8: Parameterized API Tests
  // --------------------------------------------------------------------------
  // This exercise loops over multiple inputs to run the same assertion pattern
  // against different API resources. This is data-driven testing.

  // Define the test data: an array of post IDs to test.
  const postIds = [1, 2, 3, 4, 5];

  postIds.forEach((postId) => {
    // Create a separate test for each post ID so failures are isolated.
    it(`exercise 8: verify post ${postId} has valid structure`, () => {
      cy.request(`${API_BASE}/posts/${postId}`).then((response) => {
        // Verify status code.
        expect(response.status).to.equal(200);

        const post = response.body;

        // Verify the post ID matches what we requested.
        expect(post.id).to.equal(postId);

        // Verify all required fields are present with correct types.
        expect(post).to.have.property('userId');
        expect(post.userId).to.be.a('number');
        expect(post).to.have.property('title');
        expect(post.title).to.be.a('string');
        expect(post.title.length).to.be.greaterThan(0);
        expect(post).to.have.property('body');
        expect(post.body).to.be.a('string');
        expect(post.body.length).to.be.greaterThan(0);
      });
    });
  });

});
