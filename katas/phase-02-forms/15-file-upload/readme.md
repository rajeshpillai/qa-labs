# Kata 15: File Upload

## What You Will Learn

- How to upload files via a file input using test frameworks
- How to verify uploaded files appear in a file list
- How to test file type validation (rejecting invalid types)
- How to simulate drag-and-drop file upload
- How to verify file previews and remove uploaded files
- Differences between Playwright's `setInputFiles()` and Cypress's `selectFile()`

## Prerequisites

- Completed Katas 13-14
- Understanding of form interactions and assertions

## Concepts Explained

### Playwright: setInputFiles()

```typescript
// PLAYWRIGHT
// setInputFiles(files) sets the files for an <input type="file"> element.
// It accepts a file path string, an array of paths, or a file-like object.
//
// Signature:
//   locator.setInputFiles(files: string | string[] | {
//     name: string, mimeType: string, buffer: Buffer
//   } | Array<{ name: string, mimeType: string, buffer: Buffer }>)
//
// Using a file path (reads from disk):
await page.getByTestId('file-input').setInputFiles('path/to/document.pdf');

// Using a buffer (creates a virtual file — no disk file needed):
await page.getByTestId('file-input').setInputFiles({
  name: 'id-proof.pdf',
  mimeType: 'application/pdf',
  buffer: Buffer.from('fake pdf content'),
});

// Multiple files at once:
await page.getByTestId('file-input').setInputFiles([
  { name: 'id.pdf', mimeType: 'application/pdf', buffer: Buffer.from('pdf') },
  { name: 'photo.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('jpg') },
]);

// Clear file input:
await page.getByTestId('file-input').setInputFiles([]);
```

### Cypress: selectFile()

```typescript
// CYPRESS
// selectFile() sets files on an <input type="file"> element.
// It was added in Cypress 9.3 as a built-in command (no plugin needed).
//
// Signature:
//   .selectFile(file | file[], options?)
//
// file can be:
//   - A string path (relative to cypress project root)
//   - A Cypress.Buffer with { fileName, mimeType }
//   - A { contents, fileName, mimeType } object
//
// Using a buffer (creates a virtual file):
cy.get('[data-testid="file-input"]').selectFile({
  contents: Cypress.Buffer.from('fake pdf content'),
  fileName: 'id-proof.pdf',
  mimeType: 'application/pdf',
});

// Multiple files:
cy.get('[data-testid="file-input"]').selectFile([
  { contents: Cypress.Buffer.from('pdf'), fileName: 'id.pdf', mimeType: 'application/pdf' },
  { contents: Cypress.Buffer.from('jpg'), fileName: 'photo.jpg', mimeType: 'image/jpeg' },
]);

// Drag-and-drop mode (drops file onto an element instead of setting input):
cy.get('[data-testid="drop-zone"]').selectFile(
  { contents: Cypress.Buffer.from('pdf'), fileName: 'doc.pdf', mimeType: 'application/pdf' },
  { action: 'drag-drop' }
);
```

### Verifying Uploaded Files

```typescript
// PLAYWRIGHT
// After uploading, the file appears in the list. We check by finding
// elements that contain the file name.
const fileList = page.getByTestId('file-items');
await expect(fileList).toContainText('id-proof.pdf');

// CYPRESS
cy.get('[data-testid="file-items"]').should('contain.text', 'id-proof.pdf');
```

## Playground

The playground is a "KYC Document Upload" page. It contains:

1. **Drop Zone** — A dashed-border area that accepts drag-and-drop files. Clicking it opens the browser's file picker dialog.
2. **Hidden File Input** — An `<input type="file">` element that accepts `.pdf`, `.jpg`, `.png` files. It supports the `multiple` attribute for multi-file selection.
3. **File Type Validation** — Only `.pdf`, `.jpg`, `.jpeg`, `.png` files are accepted. Invalid files show a red error message.
4. **File Size Limit** — Files over 5 MB show an error. The display shows each file's size in human-readable format (KB/MB).
5. **Upload Progress Bar** — A simulated progress bar animates from 0% to 100% when a file is "uploaded".
6. **Uploaded Files List** — Each uploaded file appears as a card showing its name, size, preview thumbnail (for images), and a "Remove" button.
7. **File Count** — A counter showing the number of uploaded files.
8. **Preview Thumbnails** — Image files (`.jpg`, `.png`) show a thumbnail preview. PDF files show a "PDF" label.

## Exercises

### Exercise 1: Upload a File via the File Input
Use `setInputFiles()` (Playwright) or `selectFile()` (Cypress) to upload a PDF file. Verify the file count updates to 1.

### Exercise 2: Verify Uploaded File Appears in the List
Upload a file and verify its name appears in the file items list.

### Exercise 3: Upload Wrong File Type and Verify Error
Upload a `.txt` file and verify the error message appears saying the file type is not allowed.

### Exercise 4: Drag-and-Drop Upload
Use drag-and-drop to upload a file onto the drop zone. Verify it appears in the file list.

### Exercise 5: Verify File Preview
Upload an image file (`.jpg` or `.png`) and verify the preview element exists for that file.

### Exercise 6: Remove an Uploaded File
Upload a file, then click its "Remove" button. Verify the file is removed from the list and the count decreases.

### Exercise 7: Upload Multiple Files
Upload two files at once and verify both appear in the file list with a count of 2.

### Exercise 8: Verify File Size Display
Upload a file and verify the size display shows a human-readable value (e.g., "1.0 KB").

## Solutions

### Playwright Solution

See `playwright/file-upload.spec.ts`

### Cypress Solution

See `cypress/file-upload.cy.ts`

## Common Mistakes

| Mistake | Why it's wrong | Fix |
|---------|---------------|-----|
| Trying to type a file path into the input | File inputs cannot be typed into — they require a special API | Use `setInputFiles()` (Playwright) or `selectFile()` (Cypress) |
| Forgetting the `mimeType` when creating virtual files | Without a MIME type, the file validation may reject the file | Always provide `mimeType` matching the file extension |
| Using real file paths that don't exist | The test will fail with a file-not-found error | Use buffer-based virtual files for portability |
| Not waiting for the upload progress to complete | Assertions run before the file appears in the list | Wait for the file name to appear in the DOM |
| Targeting the drop zone instead of the input for selectFile | By default, selectFile targets an input element | Use `{ action: 'drag-drop' }` option for drop zone targets |

## Quick Reference

### File Upload Methods

| Action | Playwright | Cypress |
|--------|-----------|---------|
| Upload single file | `setInputFiles({ name, mimeType, buffer })` | `selectFile({ contents, fileName, mimeType })` |
| Upload multiple files | `setInputFiles([file1, file2])` | `selectFile([file1, file2])` |
| Drag-drop upload | `setInputFiles()` on input + dispatch events | `selectFile(file, { action: 'drag-drop' })` |
| Clear file input | `setInputFiles([])` | N/A (re-select or reload) |
| Check file in list | `expect(list).toContainText(name)` | `cy.get(list).should('contain.text', name)` |
| Check file count | `expect(count).toHaveText('2')` | `cy.get(count).should('have.text', '2')` |
