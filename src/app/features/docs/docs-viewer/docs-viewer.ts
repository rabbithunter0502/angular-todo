import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  ViewEncapsulation,
  afterRenderEffect,
  computed,
  effect,
  inject,
  resource,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DOC_CATEGORIES, findDocById } from '../../../core/data/docs-registry';
import { DocEntry } from '../../../core/models/doc.model';
import { DocHeading, renderMarkdown } from '../markdown-renderer';

const DEFAULT_DOC_ID = 'readme';

/**
 * Renders every markdown file in `docs/` (plus the top-level README/EXERCISES/CONTRIBUTING)
 * inside the app itself, so reading the project's own documentation never requires opening an
 * editor. Fittingly for a Signals-teaching repo, the fetch-and-render pipeline is built the same
 * way `TodoStore` builds everything else: `resource()` for the async load, `computed()` for the
 * pure derivation from raw markdown to sanitized HTML, and a plain `signal()` for the bit of
 * local UI state (the sidebar filter) that isn't derived from anything.
 */
@Component({
  selector: 'app-docs-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The rendered markdown is injected via `[innerHTML]`, so it never goes through Angular's
  // template compiler — emulated encapsulation's `_ngcontent-*` attribute never lands on it,
  // and scoped selectors like `.markdown-body h2` would silently never match. `None` makes this
  // component's styles genuinely global, which is fine: they're all prefixed under `.markdown-body`
  // / `.docs`, distinctive enough not to leak into the todo feature.
  encapsulation: ViewEncapsulation.None,
  templateUrl: './docs-viewer.html',
  styleUrl: './docs-viewer.css',
})
export class DocsViewerComponent {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly document = inject(DOCUMENT);
  private readonly contentPane = viewChild<ElementRef<HTMLElement>>('contentPane');

  protected readonly categories = DOC_CATEGORIES;
  protected readonly filterText = signal('');

  private readonly _selectedId = signal(initialDocIdFromHash() ?? DEFAULT_DOC_ID);
  private readonly pendingAnchor = signal<string | null>(initialHashAnchor());

  readonly selectedDoc = computed<DocEntry>(
    () => findDocById(this._selectedId()) ?? findDocById(DEFAULT_DOC_ID)!,
  );

  protected readonly filteredCategories = computed(() => {
    const query = this.filterText().trim().toLowerCase();
    if (!query) {
      return this.categories;
    }
    return this.categories
      .map((category) => ({
        ...category,
        docs: category.docs.filter(
          (doc) =>
            doc.title.toLowerCase().includes(query) ||
            doc.description.toLowerCase().includes(query),
        ),
      }))
      .filter((category) => category.docs.length > 0);
  });

  private readonly content = resource({
    params: () => this.selectedDoc(),
    loader: async ({ params, abortSignal }) => {
      const response = await fetch(params.path, { signal: abortSignal });
      if (!response.ok) {
        throw new Error(`Không tải được ${params.path} (HTTP ${response.status})`);
      }
      return response.text();
    },
  });

  protected readonly isLoading = this.content.isLoading;
  protected readonly loadError = computed(() => this.content.error()?.message ?? null);

  protected readonly rendered = computed<{
    html: SafeHtml;
    headings: readonly DocHeading[];
  } | null>(() => {
    const markdown = this.content.value();
    if (markdown === undefined) {
      return null;
    }
    const { html, headings } = renderMarkdown(markdown, this.selectedDoc());
    return { html: this.sanitizer.bypassSecurityTrustHtml(html), headings };
  });

  constructor() {
    // Keeps the URL bookmarkable/shareable without pulling in `@angular/router` for a single
    // view — `location.hash` is enough state to reopen the same doc (and, via `pendingAnchor`,
    // the same heading) on reload.
    effect(() => {
      const doc = this.selectedDoc();
      const anchor = this.pendingAnchor();
      this.document.location.hash = anchor ? `/docs/${doc.id}#${anchor}` : `/docs/${doc.id}`;
    });

    // Scrolling has to wait for the new HTML to actually land in the DOM — `afterRenderEffect`
    // (unlike a plain `effect`) is guaranteed to run after Angular has applied the view update
    // that `rendered()` triggered, so `getElementById` below can't race the render.
    afterRenderEffect(() => {
      const anchor = this.pendingAnchor();
      const doc = this.rendered();
      if (!anchor || !doc) {
        return;
      }
      this.document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  protected selectDoc(id: string, anchor: string | null = null): void {
    this._selectedId.set(id);
    this.pendingAnchor.set(anchor);
    this.contentPane()?.nativeElement.scrollTo({ top: 0 });
  }

  /**
   * A single delegated click handler on the rendered-markdown container, rather than binding
   * every generated `<a>` individually — the HTML comes from `[innerHTML]`, so there's nothing
   * for Angular's template binding to attach *to* per-link in the first place.
   */
  protected onContentClick(event: MouseEvent): void {
    const anchor = (event.target as HTMLElement).closest('a');
    if (!anchor) {
      return;
    }
    const docId = anchor.getAttribute('data-doc-id');
    if (docId && findDocById(docId)) {
      event.preventDefault();
      this.selectDoc(docId, anchor.getAttribute('data-doc-hash'));
      return;
    }
    const sameDocAnchor = anchor.getAttribute('data-doc-anchor');
    if (sameDocAnchor) {
      event.preventDefault();
      this.jumpToHeading(sameDocAnchor);
    }
  }

  /** Same-doc heading jump — used by both the "Mục lục" TOC and in-body `#anchor` links. */
  protected jumpToHeading(slug: string): void {
    this.pendingAnchor.set(slug);
    this.document.getElementById(slug)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function initialDocIdFromHash(): string | null {
  const match = /^#\/docs\/([^/#]+)/.exec(location.hash);
  const id = match?.[1];
  return id && findDocById(id) ? id : null;
}

function initialHashAnchor(): string | null {
  const match = /^#\/docs\/[^/#]+#(.+)$/.exec(location.hash);
  return match?.[1] ?? null;
}

/** So `app.ts` can decide the initial top-level tab from the same hash format on load. */
export function hashPointsAtDocs(): boolean {
  return location.hash.startsWith('#/docs/');
}
