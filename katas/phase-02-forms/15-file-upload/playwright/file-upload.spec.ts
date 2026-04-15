import { test, expect } from '@playwright/test';

// The base URL for our playground page.
const PLAYGROUND = '/phase-02-forms/15-file-upload/playground/';

// --------------------------------------------------------------------------
// Exercise 1: Upload a File via the File Input
// --------------------------------------------------------------------------
// Use setInputFiles() to upload a virtual PDF file and verify the count.
test('exercise 1: upload a file via file input', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Verify the file count starts at 0.
  await expect(page.getByTestId('file-count')).toHaveText('0');

  // setInputFiles() sets files on an <input type="file"> element.
  // We create a virtual file using a Buffer — no real file on disk is needed.
  // Parameters:
  //   name     — the file name the browser will see
  //   mimeType — the MIME type (must match an allowed type)
  //   buffer   — the file content as a Node.js Buffer
  await page.getByTestId('file-input').setInputFiles({
    name: 'id-proof.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('fake pdf content'),
  });

  // Wait for the simulated upload to complete and the file to appear.
  // toHaveText('1') waits until the file count element's text becomes '1'.
  await expect(page.getByTestId('file-count')).toHaveText('1');
});

// --------------------------------------------------------------------------
// Exercise 2: Verify Uploaded File Appears in the List
// --------------------------------------------------------------------------
// After uploading, verify the file name is visible in the file items area.
test('exercise 2: verify uploaded file appears in the list', async ({ page }) => {
  await page.goto(PLAYGROUND);

  await page.getByTestId('file-input').setInputFiles({
    name: 'passport-scan.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from('fake jpeg content'),
  });

  // toContainText(substring) checks if the element's textContent contains
  // the given substring anywhere within it.
  await expect(page.getByTestId('file-items')).toContainText('passport-scan.jpg');

  // Also verify the "no files" message is hidden.
  await expect(page.getByTestId('empty-list')).toBeHidden();
});

// --------------------------------------------------------------------------
// Exercise 3: Upload Wrong File Type and Verify Error
// --------------------------------------------------------------------------
// Uploading a .txt file should trigger a validation error message.
test('exercise 3: upload wrong file type shows error', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Upload a .txt file — this type is not in the allowed list.
  await page.getByTestId('file-input').setInputFiles({
    name: 'notes.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('some text content'),
  });

  // Verify the error message is visible and contains the file name.
  await expect(page.getByTestId('upload-error')).toBeVisible();
  await expect(page.getByTestId('upload-error')).toContainText('notes.txt');
  await expect(page.getByTestId('upload-error')).toContainText('not allowed');

  // The file should NOT appear in the uploaded list.
  await expect(page.getByTestId('file-count')).toHaveText('0');
});

// --------------------------------------------------------------------------
// Exercise 4: Drag-and-Drop Upload
// --------------------------------------------------------------------------
// Simulate a drag-and-drop by using setInputFiles() on the file input.
// Note: True drag-and-drop file upload from outside the browser cannot be
// fully simulated in Playwright. We use setInputFiles() which triggers
// the same code path via the input's change event.
test('exercise 4: upload file via input (simulating drag-drop path)', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Upload via the file input — this exercises the same handleFiles() logic
  // that the drop event uses.
  await page.getByTestId('file-input').setInputFiles({
    name: 'address-proof.png',
    mimeType: 'image/png',
    buffer: Buffer.from('fake png content'),
  });

  // Verify the file appears in the list.
  await expect(page.getByTestId('file-items')).toContainText('address-proof.png');
  await expect(page.getByTestId('file-count')).toHaveText('1');
});

// --------------------------------------------------------------------------
// Exercise 5: Verify File Preview
// --------------------------------------------------------------------------
// Upload an image file and verify a preview element is rendered.
test('exercise 5: verify file preview exists for image upload', async ({ page }) => {
  await page.goto(PLAYGROUND);

  await page.getByTestId('file-input').setInputFiles({
    name: 'selfie.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from('fake jpeg content'),
  });

  // Wait for the file to appear in the list.
  await expect(page.getByTestId('file-count')).toHaveText('1');

  // Find the file item in the list. Each file item gets a dynamic testid.
  // We locate it by checking for the file name text, then look for a
  // preview element within it.
  const fileItem = page.locator('.file-item').filter({ hasText: 'selfie.jpg' });
  await expect(fileItem).toBeVisible();

  // Verify the preview element exists within the file item.
  // The preview is a <div class="file-preview"> containing an <img>.
  const preview = fileItem.locator('.file-preview');
  await expect(preview).toBeVisible();
});

// --------------------------------------------------------------------------
// Exercise 6: Remove an Uploaded File
// --------------------------------------------------------------------------
// Upload a file, then click Remove. Verify the file disappears.
test('exercise 6: remove an uploaded file', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Upload a file.
  await page.getByTestId('file-input').setInputFiles({
    name: 'old-id.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('fake pdf'),
  });

  // Verify it appeared.
  await expect(page.getByTestId('file-count')).toHaveText('1');

  // Find the file item and its Remove button.
  const fileItem = page.locator('.file-item').filter({ hasText: 'old-id.pdf' });
  const removeBtn = fileItem.locator('.btn-remove');

  // Click the Remove button.
  await removeBtn.click();

  // Verify the file count is back to 0.
  await expect(page.getByTestId('file-count')).toHaveText('0');

  // Verify the "no files" message reappears.
  await expect(page.getByTestId('empty-list')).toBeVisible();

  // Verify the file name is no longer in the list.
  await expect(page.getByTestId('file-items')).not.toContainText('old-id.pdf');
});

// --------------------------------------------------------------------------
// Exercise 7: Upload Multiple Files
// --------------------------------------------------------------------------
// Upload two files at once and verify both appear.
test('exercise 7: upload multiple files at once', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // setInputFiles() accepts an array of file objects to upload multiple
  // files in a single call.
  await page.getByTestId('file-input').setInputFiles([
    {
      name: 'id-front.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('jpeg front'),
    },
    {
      name: 'id-back.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('jpeg back'),
    },
  ]);

  // Wait for both files to finish uploading (progress bar runs sequentially).
  // The count should reach 2.
  await expect(page.getByTestId('file-count')).toHaveText('2');

  // Verify both file names appear in the list.
  await expect(page.getByTestId('file-items')).toContainText('id-front.jpg');
  await expect(page.getByTestId('file-items')).toContainText('id-back.jpg');
});

// --------------------------------------------------------------------------
// Exercise 8: Verify File Size Display
// --------------------------------------------------------------------------
// Upload a file and verify the size is shown in a human-readable format.
test('exercise 8: verify file size display', async ({ page }) => {
  await page.goto(PLAYGROUND);

  // Create a file with a known size. Buffer.alloc(1024) creates a 1 KB buffer.
  await page.getByTestId('file-input').setInputFiles({
    name: 'sized-doc.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.alloc(1024),
  });

  // Wait for upload.
  await expect(page.getByTestId('file-count')).toHaveText('1');

  // Find the file item and check the size display.
  const fileItem = page.locator('.file-item').filter({ hasText: 'sized-doc.pdf' });
  const sizeEl = fileItem.locator('.file-size');

  // The size should show "1.0 KB" for a 1024-byte file.
  await expect(sizeEl).toHaveText('1.0 KB');
});
