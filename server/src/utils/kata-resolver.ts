import path from 'path';
import fs from 'fs';

const SLUG_REGEX = /^[a-z0-9-]+$/;
const KATAS_DIR = path.join(process.cwd(), '..', 'katas');

function validateSlug(slug: string): boolean {
  return SLUG_REGEX.test(slug);
}

export function resolveTestFile(
  phaseSlug: string,
  kataSlug: string,
  framework: 'playwright' | 'cypress',
  testFile?: string
): string {
  if (!validateSlug(phaseSlug)) {
    throw new Error(`Invalid phase slug: ${phaseSlug}`);
  }
  if (!validateSlug(kataSlug)) {
    throw new Error(`Invalid kata slug: ${kataSlug}`);
  }

  const kataDir = path.join(KATAS_DIR, phaseSlug, kataSlug);

  if (!fs.existsSync(kataDir)) {
    throw new Error(`Kata directory not found: ${phaseSlug}/${kataSlug}`);
  }

  const frameworkDir = path.join(kataDir, framework);
  const extension = framework === 'playwright' ? '.spec.ts' : '.cy.ts';

  if (!fs.existsSync(frameworkDir)) {
    throw new Error(`No ${framework} directory found in ${phaseSlug}/${kataSlug}`);
  }

  if (testFile) {
    if (testFile.includes('..') || testFile.includes('/')) {
      throw new Error(`Invalid test file name: ${testFile}`);
    }
    const filePath = path.join(frameworkDir, testFile);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Test file not found: ${testFile}`);
    }
    return filePath;
  }

  const files = fs.readdirSync(frameworkDir).filter((f) => f.endsWith(extension));

  if (files.length === 0) {
    throw new Error(
      `No ${framework} test files (${extension}) found in ${phaseSlug}/${kataSlug}`
    );
  }

  return path.join(frameworkDir, files[0]);
}
