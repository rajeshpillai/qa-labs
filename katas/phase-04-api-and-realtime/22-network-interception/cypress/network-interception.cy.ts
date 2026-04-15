const PLAYGROUND = '/phase-04-api-and-realtime/22-network-interception/playground/';

describe('Kata 22: Network Interception', () => {

  // beforeEach runs before every test in this describe block.
  // We navigate to the playground page so each test starts fresh.
  beforeEach(() => {
    cy.visit(PLAYGROUND);
  });

  // --------------------------------------------------------------------------
  // Exercise 1: Intercept POST and Return Mock Success
  // --------------------------------------------------------------------------
  // This exercise demonstrates cy.intercept() to intercept a POST request
  // and return a mock response. The app's fetch() receives this fake response.
  it('exercise 1: intercept POST and return mock success', () => {
    // cy.intercept(method, url, response) sets up a request interception.
    //   method   — the HTTP method to match ('POST', 'GET', etc.)
    //   url      — a URL pattern (string glob or RegExp) to match
    //   response — an object with { statusCode, body, headers } to return
    //
    // .as('alias') gives this intercept a name so cy.wait() can reference it.
    cy.intercept('POST', '/api/kyc/submit', {
      statusCode: 200,
      body: { referenceId: 'KYC-2024-001' }
    }).as('submitKyc');

    // Fill in the form fields.
    // type(text) types into an input field.
    cy.get('[data-testid="full-name-input"]').type('Aisha Patel');
    cy.get('[data-testid="email-input"]').type('aisha@example.com');

    // Click submit to trigger the POST request.
    cy.get('[data-testid="submit-btn"]').click();

    // cy.wait('@alias') pauses the test until the intercepted request completes.
    // This ensures the response has been received before we assert on the UI.
    cy.wait('@submitKyc');

    // Verify the success message shows the reference ID from our mock.
    cy.get('[data-testid="submit-status"]')
      .should('contain.text', 'KYC-2024-001')
      .and('have.class', 'status-success');
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Intercept GET and Return Mock Applicant Data
  // --------------------------------------------------------------------------
  // This exercise intercepts a GET request with a URL glob pattern and
  // returns mock applicant data.
  it('exercise 2: intercept GET and return mock applicant data', () => {
    // The '*' in the URL pattern matches any characters, including the
    // query string (?id=APP-1001) that the app appends.
    cy.intercept('GET', '/api/applicant*', {
      statusCode: 200,
      body: {
        name: 'Aisha Patel',
        email: 'aisha@example.com',
        country: 'India',
        riskLevel: 'High'
      }
    }).as('getApplicant');

    // Click the button to trigger the GET request.
    cy.get('[data-testid="load-applicant-btn"]').click();

    // Wait for the intercepted request to complete.
    cy.wait('@getApplicant');

    // Verify the applicant card is visible and shows the mock data.
    cy.get('[data-testid="applicant-card"]').should('be.visible');
    cy.get('[data-testid="applicant-name"]').should('have.text', 'Aisha Patel');
    cy.get('[data-testid="applicant-email"]').should('have.text', 'aisha@example.com');
    cy.get('[data-testid="applicant-country"]').should('have.text', 'India');
    cy.get('[data-testid="applicant-risk"]').should('have.text', 'High');
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Verify Request Body Sent
  // --------------------------------------------------------------------------
  // This exercise inspects the request body after the intercept fires to
  // verify the app sends the correct form data.
  it('exercise 3: verify request body sent in POST', () => {
    // Set up the intercept. We return a success response so the app
    // completes normally.
    cy.intercept('POST', '/api/kyc/submit', {
      statusCode: 200,
      body: { referenceId: 'KYC-2024-002' }
    }).as('submitKyc');

    // Fill in the form with specific values.
    cy.get('[data-testid="full-name-input"]').type('Ben Okafor');
    cy.get('[data-testid="email-input"]').type('ben@example.com');
    // select(value) selects an <option> by its value attribute in a <select>.
    cy.get('[data-testid="country-select"]').select('GB');
    cy.get('[data-testid="doc-type-select"]').select('drivers-license');

    // Submit the form.
    cy.get('[data-testid="submit-btn"]').click();

    // cy.wait('@alias') yields the interception object. We use .then() to
    // access it and inspect the request body.
    cy.wait('@submitKyc').then((interception) => {
      // interception.request.body contains the parsed request body.
      // For JSON requests, Cypress automatically parses it into an object.
      const body = interception.request.body;
      expect(body).to.have.property('fullName', 'Ben Okafor');
      expect(body).to.have.property('email', 'ben@example.com');
      expect(body).to.have.property('country', 'GB');
      expect(body).to.have.property('documentType', 'drivers-license');
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Verify Request Headers
  // --------------------------------------------------------------------------
  // This exercise inspects the request headers to verify the app sends the
  // correct Content-Type, Authorization, and custom headers.
  it('exercise 4: verify request headers', () => {
    cy.intercept('POST', '/api/kyc/submit', {
      statusCode: 200,
      body: { referenceId: 'KYC-2024-003' }
    }).as('submitKyc');

    // Fill in required fields and submit.
    cy.get('[data-testid="full-name-input"]').type('Clara Jansen');
    cy.get('[data-testid="email-input"]').type('clara@example.com');
    cy.get('[data-testid="submit-btn"]').click();

    // Inspect the headers from the interception object.
    cy.wait('@submitKyc').then((interception) => {
      // interception.request.headers is an object of header name -> value.
      // Header names are lowercased.
      const headers = interception.request.headers;
      expect(headers).to.have.property('content-type', 'application/json');
      expect(headers).to.have.property('authorization', 'Bearer test-token-abc123');
      expect(headers).to.have.property('x-client-version', '1.0.0');
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Intercept and Return Error Response
  // --------------------------------------------------------------------------
  // This exercise returns an error response (422) so we can test the app's
  // error handling UI.
  it('exercise 5: intercept and return error response', () => {
    // Return a 422 status with an error message in the body.
    cy.intercept('POST', '/api/kyc/submit', {
      statusCode: 422,
      body: { message: 'Invalid document type for selected country' }
    }).as('submitKyc');

    // Fill in and submit the form.
    cy.get('[data-testid="full-name-input"]').type('Derek Wong');
    cy.get('[data-testid="email-input"]').type('derek@example.com');
    cy.get('[data-testid="submit-btn"]').click();

    // Wait for the response and verify the error is shown.
    cy.wait('@submitKyc');

    cy.get('[data-testid="submit-status"]')
      .should('contain.text', 'Invalid document type for selected country')
      .and('have.class', 'status-error');
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Wait for Specific Response
  // --------------------------------------------------------------------------
  // This exercise demonstrates the cy.wait('@alias') pattern to explicitly
  // wait for a specific intercepted request to complete before asserting.
  it('exercise 6: wait for specific response', () => {
    // Use a route handler function (instead of a static response) to add
    // a simulated delay. The req.reply() method sends the mock response.
    cy.intercept('GET', '/api/applicant*', (req) => {
      // req.reply(responseObject) sends a mock response.
      // delay adds a simulated network delay in milliseconds.
      req.reply({
        statusCode: 200,
        body: {
          name: 'Elena Vasquez',
          email: 'elena@example.com',
          country: 'Spain',
          riskLevel: 'Low'
        },
        delay: 200
      });
    }).as('getApplicant');

    // Click the button to trigger the request.
    cy.get('[data-testid="load-applicant-btn"]').click();

    // cy.wait('@getApplicant') pauses until the response arrives.
    // It yields the interception object which we can inspect.
    cy.wait('@getApplicant').then((interception) => {
      // Verify the response status and body.
      expect(interception.response!.statusCode).to.equal(200);
      expect(interception.response!.body).to.have.property('name', 'Elena Vasquez');
    });

    // Verify the UI shows the data after the response arrived.
    cy.get('[data-testid="applicant-name"]').should('have.text', 'Elena Vasquez');
  });

  // --------------------------------------------------------------------------
  // Exercise 7: Verify Multiple Requests
  // --------------------------------------------------------------------------
  // This exercise sets up intercepts for both GET and POST, triggers both
  // requests, and verifies both completed.
  it('exercise 7: verify multiple requests', () => {
    // Set up intercepts for both endpoints with aliases.
    cy.intercept('GET', '/api/applicant*', {
      statusCode: 200,
      body: {
        name: 'Fiona Chen',
        email: 'fiona@example.com',
        country: 'China',
        riskLevel: 'Medium'
      }
    }).as('getApplicant');

    cy.intercept('POST', '/api/kyc/submit', {
      statusCode: 200,
      body: { referenceId: 'KYC-2024-007' }
    }).as('submitKyc');

    // Trigger the GET request.
    cy.get('[data-testid="load-applicant-btn"]').click();
    // Wait for the GET request to complete.
    cy.wait('@getApplicant');
    cy.get('[data-testid="applicant-card"]').should('be.visible');

    // Now trigger the POST request.
    cy.get('[data-testid="full-name-input"]').type('Fiona Chen');
    cy.get('[data-testid="email-input"]').type('fiona@example.com');
    cy.get('[data-testid="submit-btn"]').click();
    // Wait for the POST request to complete.
    cy.wait('@submitKyc');

    // Verify both UI sections updated.
    cy.get('[data-testid="applicant-name"]').should('have.text', 'Fiona Chen');
    cy.get('[data-testid="submit-status"]').should('contain.text', 'KYC-2024-007');
  });

  // --------------------------------------------------------------------------
  // Exercise 8: Abort a Request
  // --------------------------------------------------------------------------
  // This exercise simulates a network failure using forceNetworkError.
  // The app's fetch() call will throw an error and the error UI should appear.
  it('exercise 8: abort a request', () => {
    // { forceNetworkError: true } simulates a complete network failure.
    // The fetch() call in the app throws a TypeError (network error).
    // This is Cypress's equivalent of Playwright's route.abort().
    cy.intercept('POST', '/api/kyc/submit', {
      forceNetworkError: true
    }).as('submitFail');

    // Fill in the form and submit.
    cy.get('[data-testid="full-name-input"]').type('Grace Kim');
    cy.get('[data-testid="email-input"]').type('grace@example.com');
    cy.get('[data-testid="submit-btn"]').click();

    // Verify the error message appears in the UI.
    // Note: We don't cy.wait('@submitFail') because the network error
    // means there is no response to wait for. Instead, we assert on the
    // visible error state in the UI.
    cy.get('[data-testid="submit-status"]')
      .should('be.visible')
      .and('have.class', 'status-error');
  });

});
