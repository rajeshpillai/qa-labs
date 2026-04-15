const PLAYGROUND = '/phase-03-navigation-and-state/19-local-storage-and-session/playground/';

describe('Kata 19: Local Storage and Session', () => {

  // beforeEach runs before every test in this describe block.
  // We clear all storage before each test so tests don't interfere
  // with each other, then navigate to the playground page.
  beforeEach(() => {
    cy.visit(PLAYGROUND, {
      // onBeforeLoad runs after the page's window is created but before
      // any scripts execute. This is the ideal place to clear storage.
      onBeforeLoad(win) {
        win.localStorage.clear();
        win.sessionStorage.clear();
      }
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 1: Fill Form and Save Draft to localStorage
  // --------------------------------------------------------------------------
  // This exercise demonstrates filling a form and verifying the data was
  // saved to localStorage using cy.window() to access browser APIs.
  it('exercise 1: fill form and save draft to localStorage', () => {
    // Fill in the form fields.
    // cy.get(selector).type(text) types text into the input.
    // {selectall} selects all existing text first to replace it.
    cy.get('[data-testid="draft-name"]').type('Aisha Patel');
    cy.get('[data-testid="draft-email"]').type('aisha@example.com');

    // cy.get(selector).select(value) selects an <option> by its value attribute.
    cy.get('[data-testid="draft-country"]').select('sg');
    cy.get('[data-testid="draft-notes"]').type('Urgent KYC review needed');

    // Click the Save Draft button.
    cy.get('[data-testid="btn-save-draft"]').click();

    // Verify the status message.
    cy.get('[data-testid="draft-status"]').should('have.text', 'Draft saved successfully!');

    // Verify the data was stored in localStorage.
    // cy.window() yields the browser's window object.
    // .then(win => ...) lets us access win.localStorage directly.
    cy.window().then((win) => {
      // win.localStorage.getItem(key) returns the stored string.
      const stored = win.localStorage.getItem('kyc-draft');
      expect(stored).to.not.be.null;

      const draft = JSON.parse(stored!);
      expect(draft.name).to.equal('Aisha Patel');
      expect(draft.email).to.equal('aisha@example.com');
      expect(draft.country).to.equal('sg');
      expect(draft.notes).to.equal('Urgent KYC review needed');
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 2: Reload Page and Load Draft — Verify Data Persists
  // --------------------------------------------------------------------------
  // localStorage persists across page reloads. We save a draft, reload,
  // and load the draft to verify the data survived the reload.
  it('exercise 2: reload page and load draft to verify persistence', () => {
    // Fill and save a draft.
    cy.get('[data-testid="draft-name"]').type('Ben Okafor');
    cy.get('[data-testid="draft-email"]').type('ben@example.com');
    cy.get('[data-testid="draft-country"]').select('uk');
    cy.get('[data-testid="draft-notes"]').type('Documents pending');
    cy.get('[data-testid="btn-save-draft"]').click();

    // Reload the page. cy.reload() refreshes the current page.
    // We do NOT clear localStorage in onBeforeLoad this time because
    // we want to test persistence.
    cy.reload();

    // Verify form fields are empty after reload.
    cy.get('[data-testid="draft-name"]').should('have.value', '');

    // Click Load Draft.
    cy.get('[data-testid="btn-load-draft"]').click();

    // Verify the form fields are restored.
    // .should('have.value', str) checks the element's current value.
    cy.get('[data-testid="draft-name"]').should('have.value', 'Ben Okafor');
    cy.get('[data-testid="draft-email"]').should('have.value', 'ben@example.com');
    cy.get('[data-testid="draft-country"]').should('have.value', 'uk');
    cy.get('[data-testid="draft-notes"]').should('have.value', 'Documents pending');
    cy.get('[data-testid="draft-status"]').should('have.text', 'Draft loaded successfully!');
  });

  // --------------------------------------------------------------------------
  // Exercise 3: Clear Draft — Verify Storage is Empty
  // --------------------------------------------------------------------------
  // The Clear Draft button removes the draft from localStorage and
  // clears all form fields.
  it('exercise 3: clear draft and verify storage is empty', () => {
    // Save a draft first.
    cy.get('[data-testid="draft-name"]').type('Clara Jansen');
    cy.get('[data-testid="btn-save-draft"]').click();

    // Verify the draft exists in localStorage.
    cy.window().then((win) => {
      expect(win.localStorage.getItem('kyc-draft')).to.not.be.null;
    });

    // Click Clear Draft.
    cy.get('[data-testid="btn-clear-draft"]').click();

    // Verify the form fields are empty.
    cy.get('[data-testid="draft-name"]').should('have.value', '');
    cy.get('[data-testid="draft-email"]').should('have.value', '');

    // Verify localStorage no longer has the draft key.
    cy.window().then((win) => {
      expect(win.localStorage.getItem('kyc-draft')).to.be.null;
    });

    cy.get('[data-testid="draft-status"]').should('have.text', 'Draft cleared.');
  });

  // --------------------------------------------------------------------------
  // Exercise 4: Verify sessionStorage Counter Increments
  // --------------------------------------------------------------------------
  // The playground counts page views using sessionStorage. Each reload
  // within the same session increments the counter.
  it('exercise 4: verify sessionStorage counter increments on reload', () => {
    // On first load (after clearing storage in beforeEach), counter = 1.
    cy.get('[data-testid="session-counter"]').should('have.text', '1');

    // Verify sessionStorage has the correct value.
    cy.window().then((win) => {
      expect(win.sessionStorage.getItem('kyc-page-views')).to.equal('1');
    });

    // Reload the page — counter increments to 2.
    // sessionStorage persists across reloads within the same tab.
    cy.reload();
    cy.get('[data-testid="session-counter"]').should('have.text', '2');

    // Reload again — counter should be 3.
    cy.reload();
    cy.get('[data-testid="session-counter"]').should('have.text', '3');

    // Verify sessionStorage matches.
    cy.window().then((win) => {
      expect(win.sessionStorage.getItem('kyc-page-views')).to.equal('3');
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 5: Change Theme and Verify Persistence
  // --------------------------------------------------------------------------
  // The theme toggle switches between light/dark mode and saves the
  // preference to localStorage.
  it('exercise 5: change theme and verify persistence across reload', () => {
    // Verify we start in Light Mode.
    cy.get('[data-testid="theme-label"]').should('have.text', 'Light Mode');
    cy.get('body').should('not.have.class', 'dark');

    // Click the theme switch.
    cy.get('[data-testid="theme-switch"]').click();

    // Verify the UI updated to Dark Mode.
    cy.get('[data-testid="theme-label"]').should('have.text', 'Dark Mode');
    cy.get('body').should('have.class', 'dark');

    // Verify localStorage saved the preference.
    cy.window().then((win) => {
      expect(win.localStorage.getItem('kyc-theme')).to.equal('dark');
    });

    // Reload the page.
    cy.reload();

    // Verify dark mode persists after reload.
    cy.get('[data-testid="theme-label"]').should('have.text', 'Dark Mode');
    cy.get('body').should('have.class', 'dark');
  });

  // --------------------------------------------------------------------------
  // Exercise 6: Verify localStorage Keys Exist
  // --------------------------------------------------------------------------
  // After saving a draft and changing the theme, we verify the expected
  // keys are present in localStorage.
  it('exercise 6: verify localStorage keys after saving draft and theme', () => {
    // Save a draft.
    cy.get('[data-testid="draft-name"]').type('Derek Wong');
    cy.get('[data-testid="btn-save-draft"]').click();

    // Set the theme to dark.
    cy.get('[data-testid="theme-switch"]').click();

    // Read all localStorage keys.
    cy.window().then((win) => {
      const keys: string[] = [];
      for (let i = 0; i < win.localStorage.length; i++) {
        // win.localStorage.key(i) returns the key at the given index.
        keys.push(win.localStorage.key(i)!);
      }
      // Verify both keys exist.
      expect(keys).to.include('kyc-draft');
      expect(keys).to.include('kyc-theme');
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 7: Read Storage Directly in Test (No UI Interaction)
  // --------------------------------------------------------------------------
  // Pre-populate localStorage from the test (without using the UI) and
  // then load the draft. This is useful for setting up test fixtures.
  it('exercise 7: read and write storage directly in the test', () => {
    // Pre-populate localStorage with a draft via cy.window().
    // This bypasses the UI entirely — the draft is written directly.
    cy.window().then((win) => {
      const draft = {
        name: 'Test User',
        email: 'test@example.com',
        country: 'in',
        notes: 'Pre-populated by test'
      };
      win.localStorage.setItem('kyc-draft', JSON.stringify(draft));
    });

    // Reload so the page picks up the new storage values.
    cy.reload();

    // Click Load Draft — should fill the form with our pre-populated data.
    cy.get('[data-testid="btn-load-draft"]').click();

    cy.get('[data-testid="draft-name"]').should('have.value', 'Test User');
    cy.get('[data-testid="draft-email"]').should('have.value', 'test@example.com');
    cy.get('[data-testid="draft-country"]').should('have.value', 'in');
    cy.get('[data-testid="draft-notes"]').should('have.value', 'Pre-populated by test');

    // Read a specific value back.
    cy.window().then((win) => {
      const data = JSON.parse(win.localStorage.getItem('kyc-draft')!);
      expect(data.email).to.equal('test@example.com');
    });
  });

  // --------------------------------------------------------------------------
  // Exercise 8: Verify Storage Survives Page Refresh
  // --------------------------------------------------------------------------
  // This exercise confirms localStorage data persists after a page
  // refresh and verifies the storage inspector UI shows the data.
  it('exercise 8: verify storage survives page refresh', () => {
    // Save a draft.
    cy.get('[data-testid="draft-name"]').type('Priya Sharma');
    cy.get('[data-testid="draft-email"]').type('priya@example.com');
    cy.get('[data-testid="btn-save-draft"]').click();

    // Click Refresh View to update the storage inspector.
    cy.get('[data-testid="btn-refresh-storage"]').click();

    // The localStorage viewer should show the kyc-draft key.
    cy.get('[data-testid="local-storage-view"]').should('contain.text', 'kyc-draft');

    // Reload the page.
    cy.reload();

    // Click Refresh View again.
    cy.get('[data-testid="btn-refresh-storage"]').click();

    // The draft should still be visible in the storage inspector.
    cy.get('[data-testid="local-storage-view"]').should('contain.text', 'kyc-draft');
    cy.get('[data-testid="local-storage-view"]').should('contain.text', 'Priya Sharma');

    // Load the draft and verify the form is populated.
    cy.get('[data-testid="btn-load-draft"]').click();
    cy.get('[data-testid="draft-name"]').should('have.value', 'Priya Sharma');
    cy.get('[data-testid="draft-email"]').should('have.value', 'priya@example.com');
  });

});
