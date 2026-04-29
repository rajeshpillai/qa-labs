import { getAllPhases, getKata, getAdjacentKatas } from '@/lib/katas';
import { KataPageClient } from '@/components/kata-page-client';
import { highlightCode } from '@/lib/highlighter';
import type { FrameworkId, KataFile } from '@/lib/types';

export async function generateStaticParams() {
  const phases = getAllPhases();
  return phases.flatMap((phase) =>
    phase.katas.map((kata) => ({ phase: phase.slug, kata: kata.slug }))
  );
}

interface FrameworkConfig {
  id: FrameworkId;
  label: string;
  files: KataFile[];
  language: string;
}

function languageForFile(filename: string, fallback: string): string {
  if (filename.endsWith('.yml') || filename.endsWith('.yaml')) return 'yaml';
  if (filename.endsWith('.jmx') || filename.endsWith('.xml')) return 'xml';
  if (filename.endsWith('.js')) return 'javascript';
  if (filename.endsWith('.ts')) return 'typescript';
  return fallback;
}

export default async function KataPage({
  params,
}: {
  params: Promise<{ phase: string; kata: string }>;
}) {
  const { phase, kata: kataSlug } = await params;
  const phases = getAllPhases();
  const kata = getKata(phase, kataSlug);

  if (!kata) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-zinc-500">Kata not found</p>
      </div>
    );
  }

  const { prev, next } = getAdjacentKatas(phases, kataSlug);

  // Order matters — perf-first ordering for new curriculum, functional fallback
  const frameworkConfigs: FrameworkConfig[] = [
    { id: 'k6', label: 'k6', files: kata.k6Files, language: 'javascript' },
    { id: 'artillery', label: 'Artillery', files: kata.artilleryFiles, language: 'yaml' },
    { id: 'jmeter', label: 'JMeter', files: kata.jmeterFiles, language: 'xml' },
    { id: 'playwright', label: 'Playwright', files: kata.playwrightFiles, language: 'typescript' },
    { id: 'cypress', label: 'Cypress', files: kata.cypressFiles, language: 'typescript' },
  ];

  const frameworks = await Promise.all(
    frameworkConfigs.map(async (fw) => ({
      id: fw.id,
      label: fw.label,
      files: await Promise.all(
        fw.files.map(async (f) => ({
          filename: f.filename,
          html: await highlightCode(f.content, languageForFile(f.filename, fw.language)),
        }))
      ),
    }))
  );

  return (
    <KataPageClient
      kata={kata}
      prev={prev}
      next={next}
      frameworks={frameworks}
    />
  );
}
