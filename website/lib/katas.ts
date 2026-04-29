import fs from 'node:fs';
import path from 'node:path';
import type { Kata, KataFile, Phase } from './types';

const KATAS_DIR = path.join(process.cwd(), '..', 'katas');

function titleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

function parsePhaseName(dirName: string): string {
  // "phase-00-foundations" → drop "phase" and "00", join rest, title-case
  const parts = dirName.split('-');
  const nameParts = parts.slice(2); // drop "phase" and number
  return titleCase(nameParts.join(' '));
}

function parsePhaseNumber(dirName: string): number {
  const match = dirName.match(/^phase-(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function parseKataNumber(slug: string): number {
  const match = slug.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function parseKataTitle(readmeContent: string): string {
  const match = readmeContent.match(/^#\s+Kata\s+\d+:\s*(.+)$/m);
  return match ? match[1].trim() : 'Untitled';
}

function readFilesRecursively(dir: string, extensions: string[]): KataFile[] {
  const files: KataFile[] = [];
  if (!fs.existsSync(dir)) return files;

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
        files.push({
          filename: path.relative(dir, fullPath),
          content: fs.readFileSync(fullPath, 'utf-8'),
        });
      }
    }
  }

  walk(dir);
  return files.sort((a, b) => a.filename.localeCompare(b.filename));
}

function readKata(phaseSlug: string, kataSlug: string): Kata {
  const kataDir = path.join(KATAS_DIR, phaseSlug, kataSlug);
  const readmePath = path.join(kataDir, 'readme.md');
  const readmeRaw = fs.existsSync(readmePath)
    ? fs.readFileSync(readmePath, 'utf-8')
    : '';

  const hasPlayground = fs.existsSync(path.join(kataDir, 'playground', 'index.html'));
  const playwrightFiles = readFilesRecursively(path.join(kataDir, 'playwright'), ['.ts']);
  const cypressFiles = readFilesRecursively(path.join(kataDir, 'cypress'), ['.ts']);
  const k6Files = readFilesRecursively(path.join(kataDir, 'k6'), ['.js', '.ts']);
  const artilleryFiles = readFilesRecursively(path.join(kataDir, 'artillery'), ['.yml', '.yaml', '.js']);
  const jmeterFiles = readFilesRecursively(path.join(kataDir, 'jmeter'), ['.jmx']);

  return {
    slug: kataSlug,
    number: parseKataNumber(kataSlug),
    title: parseKataTitle(readmeRaw),
    phaseSlug,
    phaseNumber: parsePhaseNumber(phaseSlug),
    phaseName: parsePhaseName(phaseSlug),
    readmeRaw,
    hasPlayground,
    playwrightFiles,
    cypressFiles,
    k6Files,
    artilleryFiles,
    jmeterFiles,
  };
}

export function getAllPhases(): Phase[] {
  const phaseDirs = fs.readdirSync(KATAS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith('phase-'))
    .map((d) => d.name)
    .sort((a, b) => parsePhaseNumber(a) - parsePhaseNumber(b));

  return phaseDirs.map((phaseSlug) => {
    const phaseDir = path.join(KATAS_DIR, phaseSlug);
    const kataDirs = fs.readdirSync(phaseDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort((a, b) => parseKataNumber(a) - parseKataNumber(b));

    const katas = kataDirs.map((kataSlug) => readKata(phaseSlug, kataSlug));

    return {
      slug: phaseSlug,
      number: parsePhaseNumber(phaseSlug),
      name: parsePhaseName(phaseSlug),
      katas,
    };
  });
}

export function getAllKatas(): Kata[] {
  const phases = getAllPhases();
  return phases.flatMap((phase) => phase.katas);
}

export function getKata(phaseSlug: string, kataSlug: string): Kata | undefined {
  const phases = getAllPhases();
  const phase = phases.find((p) => p.slug === phaseSlug);
  if (!phase) return undefined;
  return phase.katas.find((k) => k.slug === kataSlug);
}

export function getAdjacentKatas(
  phases: Phase[],
  currentKataSlug: string
): { prev: Kata | null; next: Kata | null } {
  const allKatas = phases.flatMap((phase) => phase.katas);
  const index = allKatas.findIndex((k) => k.slug === currentKataSlug);

  return {
    prev: index > 0 ? allKatas[index - 1] : null,
    next: index < allKatas.length - 1 ? allKatas[index + 1] : null,
  };
}
