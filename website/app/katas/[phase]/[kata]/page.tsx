import { getAllPhases, getKata, getAdjacentKatas } from '@/lib/katas';
import { KataPageClient } from '@/components/kata-page-client';
import { highlightCode } from '@/lib/highlighter';

export async function generateStaticParams() {
  const phases = getAllPhases();
  return phases.flatMap((phase) =>
    phase.katas.map((kata) => ({ phase: phase.slug, kata: kata.slug }))
  );
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

  const playwrightHighlighted = await Promise.all(
    kata.playwrightFiles.map(async (f) => ({
      filename: f.filename,
      html: await highlightCode(f.content, 'typescript'),
    }))
  );

  const cypressHighlighted = await Promise.all(
    kata.cypressFiles.map(async (f) => ({
      filename: f.filename,
      html: await highlightCode(f.content, 'typescript'),
    }))
  );

  return (
    <KataPageClient
      kata={kata}
      prev={prev}
      next={next}
      playwrightHtml={playwrightHighlighted}
      cypressHtml={cypressHighlighted}
    />
  );
}
