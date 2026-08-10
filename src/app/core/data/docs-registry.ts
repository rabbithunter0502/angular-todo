import { DocCategory, DocEntry } from '../models/doc.model';

/**
 * Every markdown file under `docs/` (plus the top-level `README.md`, `EXERCISES.md`,
 * `CONTRIBUTING.md`) is normally only readable by opening the repo in an editor. This registry
 * is what lets `DocsViewer` fetch and render them **inside the running app** instead — see the
 * extra `assets` globs in `angular.json` that make these paths resolvable at runtime.
 *
 * `path` must match exactly what those asset globs publish, since it's fed straight into
 * `fetch()`.
 */
export const DOC_CATEGORIES: readonly DocCategory[] = [
  {
    label: 'Tổng quan',
    docs: [
      {
        id: 'readme',
        title: 'README',
        description: 'Chạy thử, cấu trúc thư mục, CI/CD, giới hạn của repo.',
        path: 'README.md',
      },
    ],
  },
  {
    label: 'Học Signals',
    docs: [
      {
        id: 'signals-deep-dive',
        title: 'Signals Deep Dive',
        description:
          'Giải thích signal/computed/effect/linkedSignal/resource từ chính source code Angular, map vào app này.',
        path: 'docs/signals-deep-dive.md',
      },
      {
        id: 'comparison-state-management',
        title: 'So sánh State Management',
        description:
          'Signal store thuần vs @ngrx/signals vs BehaviorSubject vs NgRx classic — có căn cứ.',
        path: 'docs/comparison-state-management.md',
      },
    ],
  },
  {
    label: 'Quyết định thiết kế (ADR)',
    docs: [
      {
        id: 'adr-index',
        title: 'ADR — Tổng quan',
        description: 'Danh sách mọi Architecture Decision Record và khuôn 4 mục dùng chung.',
        path: 'docs/adr/README.md',
      },
      {
        id: 'adr-0001',
        title: '0001 — Zoneless + Signals',
        description: 'Vì sao bỏ Zone.js thay vì giữ change-detection kiểu truyền thống.',
        path: 'docs/adr/0001-zoneless-signals-state.md',
      },
      {
        id: 'adr-0002',
        title: '0002 — Tự viết TodoStore',
        description: 'Vì sao dùng signal primitives thuần thay vì NgRx/@ngrx/signals.',
        path: 'docs/adr/0002-custom-store-vs-ngrx-signalstore.md',
      },
      {
        id: 'adr-0003',
        title: '0003 — Ghim CLI vs core',
        description: '@angular/cli@^21 trong khi framework là 22.1.1 — chủ đích, không nhầm lẫn.',
        path: 'docs/adr/0003-cli-vs-core-version-pin.md',
      },
      {
        id: 'adr-0004',
        title: '0004 — linkedSignal cho draftTitle',
        description: 'Vì sao ô sửa tên việc dùng linkedSignal thay vì signal + effect.',
        path: 'docs/adr/0004-linkedsignal-draft-title.md',
      },
    ],
  },
  {
    label: 'Case Studies',
    docs: [
      {
        id: 'case-completion-toast',
        title: 'Race condition — toast hoàn tất',
        description:
          'Bug thật bắt được bằng Playwright: toast hiện ra ngay khi tải trang, nguyên nhân và cách sửa.',
        path: 'docs/case-studies/completion-toast-race-condition.md',
      },
    ],
  },
  {
    label: 'Thực hành',
    docs: [
      {
        id: 'exercises',
        title: 'Bài tập',
        description:
          '4 bài tăng dần độ khó, có gợi ý và lời giải, để tự học hoặc giao cho dev khác.',
        path: 'EXERCISES.md',
      },
      {
        id: 'contributing',
        title: 'Contributing',
        description: 'Quy ước thêm feature mới, ADR mới, case-study mới vào repo.',
        path: 'CONTRIBUTING.md',
      },
    ],
  },
];

export const ALL_DOCS: readonly DocEntry[] = DOC_CATEGORIES.flatMap((category) => category.docs);

export function findDocById(id: string): DocEntry | undefined {
  return ALL_DOCS.find((doc) => doc.id === id);
}

export function findDocByPath(path: string): DocEntry | undefined {
  return ALL_DOCS.find((doc) => doc.path === path);
}
