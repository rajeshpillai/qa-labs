import { createHighlighter, type Highlighter } from 'shiki';

let highlighter: Highlighter | null = null;

export async function getHighlighter(): Promise<Highlighter> {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: ['github-dark', 'github-light'],
      langs: ['typescript', 'html', 'css', 'javascript', 'bash', 'yaml', 'json'],
    });
  }
  return highlighter;
}

export async function highlightCode(code: string, lang: string = 'typescript'): Promise<string> {
  const hl = await getHighlighter();
  return hl.codeToHtml(code, {
    lang,
    theme: 'github-dark',
  });
}
