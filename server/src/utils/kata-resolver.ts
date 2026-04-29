import path from 'path';
import fs from 'fs';

const SLUG_REGEX = /^[a-z0-9-]+$/;
const KATAS_DIR = path.join(process.cwd(), '..', 'katas');

export type Framework = 'playwright' | 'cypress' | 'k6' | 'artillery' | 'jmeter';

const FRAMEWORK_EXTENSIONS: Record<Framework, string[]> = {
  playwright: ['.spec.ts'],
  cypress: ['.cy.ts'],
  k6: ['.test.js', '.test.ts', '.js', '.ts'],
  artillery: ['.yml', '.yaml'],
  jmeter: ['.jmx'],
};

function validateSlug(slug: string): boolean {
  return SLUG_REGEX.test(slug);
}

export function resolveTestFile(
  phaseSlug: string,
  kataSlug: string,
  framework: Framework,
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
  const extensions = FRAMEWORK_EXTENSIONS[framework];

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

  // Pick the first matching extension that has files (preserves preferred order).
  for (const ext of extensions) {
    const files = fs.readdirSync(frameworkDir).filter((f) => f.endsWith(ext));
    if (files.length > 0) {
      return path.join(frameworkDir, files[0]);
    }
  }

  throw new Error(
    `No ${framework} test files (${extensions.join(', ')}) found in ${phaseSlug}/${kataSlug}`
  );
}
