import { Marked, Tokens } from 'marked';
import { DocEntry } from '../../core/models/doc.model';
import { findDocByPath } from '../../core/data/docs-registry';

export interface DocHeading {
  readonly depth: 2 | 3;
  readonly text: string;
  readonly slug: string;
}

export interface RenderedDoc {
  readonly html: string;
  readonly headings: readonly DocHeading[];
}

/**
 * Renders one doc's markdown to HTML for the in-app viewer.
 *
 * Two things markdown-as-a-file gets for free but markdown-in-a-fetch-response doesn't:
 * 1. Heading ids — GitHub slugs them automatically; we approximate that so the `#section-name`
 *    anchors already written throughout `docs/` keep working.
 * 2. Relative links between docs (`../../CONTRIBUTING.md`, `./adr/0001-....md#bối-cảnh`) — a
 *    browser would resolve these against the *app's* URL, not the markdown file's original
 *    location, so we resolve them ourselves against `doc.path` and rewrite matches into
 *    in-app navigation (`data-doc-id`) instead of dead links.
 */
export function renderMarkdown(markdown: string, doc: DocEntry): RenderedDoc {
  const headings: DocHeading[] = [];
  const slugCounts = new Map<string, number>();

  const marked = new Marked({ gfm: true, breaks: false });

  marked.use({
    renderer: {
      heading({ tokens, depth }: Tokens.Heading): string {
        const html = this.parser.parseInline(tokens);
        const plain = decodeHtmlEntities(html.replace(/<[^>]+>/g, ''));
        const slug = uniqueSlug(slugify(plain), slugCounts);
        if (depth === 2 || depth === 3) {
          headings.push({ depth, text: plain, slug });
        }
        return `<h${depth} id="${slug}">${html}</h${depth}>\n`;
      },
      link({ href, title, tokens }: Tokens.Link): string {
        const text = this.parser.parseInline(tokens);
        const titleAttr = title ? ` title="${escapeAttr(title)}"` : '';
        const resolved = resolveHref(href, doc.path);

        if (resolved.kind === 'doc') {
          // `[docs/adr/](./docs/adr/)`-style links point at a directory, relying on GitHub's own
          // rendering to fall back to that directory's `README.md` — match the same convention.
          const path = resolved.path.endsWith('/') ? `${resolved.path}README.md` : resolved.path;
          const target = findDocByPath(path);
          if (target) {
            const hashSuffix = resolved.hash ? `#${resolved.hash}` : '';
            return (
              `<a href="#/docs/${target.id}${hashSuffix}" data-doc-id="${target.id}"` +
              `${resolved.hash ? ` data-doc-hash="${escapeAttr(resolved.hash)}"` : ''}${titleAttr}>${text}</a>`
            );
          }
        }
        if (resolved.kind === 'anchor') {
          return `<a href="#${escapeAttr(resolved.hash)}" data-doc-anchor="${escapeAttr(resolved.hash)}"${titleAttr}>${text}</a>`;
        }
        // External link (or a relative link we don't recognize as a known doc) — leave it as a
        // normal navigation, opened in a new tab so it never abandons the app.
        return `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer"${titleAttr}>${text}</a>`;
      },
    },
  });

  return { html: marked.parse(markdown, { async: false }), headings };
}

function uniqueSlug(base: string, seen: Map<string, number>): string {
  const count = seen.get(base) ?? 0;
  seen.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
}

/** Approximates GitHub's heading slugger closely enough for the anchors already in `docs/`. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[`~!@#$%^&*()+=<>,.?/:;"'|{}[\]\\]/g, '')
    .replace(/\s+/g, '-');
}

const HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  '#39': "'",
  apos: "'",
};

/**
 * Undoes marked's inline-HTML entity-encoding for headings. Needed because `heading.text` is
 * fed straight into an Angular interpolation (`{{ heading.text }}`), which escapes it for
 * display on its own — passing already-encoded text through means `&quot;` shows up literally
 * instead of rendering as `"`.
 */
function decodeHtmlEntities(text: string): string {
  return text.replace(/&(#39|amp|lt|gt|quot|apos);/g, (_, name: string) => HTML_ENTITIES[name]);
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

type ResolvedHref =
  | { kind: 'doc'; path: string; hash: string | null }
  | { kind: 'anchor'; hash: string }
  | { kind: 'external' };

/** Resolves `href` (as written inside `fromPath`'s markdown) against the doc registry's paths. */
function resolveHref(href: string, fromPath: string): ResolvedHref {
  if (href.startsWith('#')) {
    return { kind: 'anchor', hash: href.slice(1) };
  }
  if (/^[a-z]+:\/\//i.test(href) || href.startsWith('mailto:')) {
    return { kind: 'external' };
  }
  // Resolve the relative link the same way a file system would, using a fake origin so we can
  // reuse the platform's own URL resolution instead of hand-rolling `../` handling.
  const base = new URL(fromPath, 'https://doc-registry.local/');
  const resolved = new URL(href, base);
  if (resolved.origin !== base.origin) {
    return { kind: 'external' };
  }
  const path = decodeURIComponent(resolved.pathname.replace(/^\//, ''));
  const hash = resolved.hash ? resolved.hash.slice(1) : null;
  return { kind: 'doc', path, hash };
}
