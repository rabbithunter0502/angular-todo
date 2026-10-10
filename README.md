# angular-todo

[![Pipeline](https://github.com/rabbithunter0502/angular-todo/actions/workflows/pipeline.yml/badge.svg)](https://github.com/rabbithunter0502/angular-todo/actions/workflows/pipeline.yml)

Todo app dựng bằng **Angular v22** (`@angular/core@22.2.2`), zoneless, dùng **Signals**
(`signal`, `computed`, `effect`, `linkedSignal`, `resource`) làm toàn bộ state management —
không NgRx, không RxJS store.

Repo này là **tài liệu tự học/giảng dạy Signals trước, app demo sau** — xem mục
[Giới hạn](#giới-hạn) trước khi coi đây là template production.

🖥️ **Đọc ngay trong app, không cần mở `src/`** — chạy `npm start` rồi bấm tab **📖 Tài liệu**: mọi
file dưới đây (README, ADR, case study, so sánh, bài tập...) được render thành một trang tài liệu
có sidebar, tìm kiếm, mục lục tự sinh theo heading, và link điều hướng qua lại giữa các tài liệu —
xem `src/app/features/docs/`.

📖 **[docs/signals-deep-dive.md](./docs/signals-deep-dive.md)** — giải thích Signals từ chính
source code của Angular (permalink pinned theo tag `v22.2.2` — xem
[`docs/pinned-source.json`](./docs/pinned-source.json); pin này được phép tụt sau version runtime
trong `package.json`, lý do ở [ADR 0007](./docs/adr/0007-version-upgrade-policy.md)), map từng
primitive vào code thật trong app này, một case study bug thật gặp
phải khi build demo (và cách sửa đúng theo nguyên tắc của Angular), và một checklist tư duy
senior khi làm việc với Signals. Tài liệu liên quan:

- [`docs/adr/`](./docs/adr/) — quyết định thiết kế (vì sao zoneless, vì sao không NgRx, compiler Rust, vì sao
  `linkedSignal` cho `draftTitle`...), theo khuôn ADR.
- [`docs/case-studies/`](./docs/case-studies/) — bug thật gặp phải khi build demo, kể lại theo
  khuôn triệu chứng → nguyên nhân → giải pháp → bài học.
- [`docs/comparison-state-management.md`](./docs/comparison-state-management.md) — so sánh có
  căn cứ giữa signal store thuần (repo này), `@ngrx/signals`, `BehaviorSubject`, và NgRx classic.
- [`EXERCISES.md`](./EXERCISES.md) — 4 bài tập tăng dần độ khó, có gợi ý lời giải, để tự học hoặc
  giao cho dev khác.
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — quy ước thêm feature/ADR/case-study mới.

## Chạy thử

```bash
npm install
npm start          # ng serve — http://localhost:4200
npm test           # ng test — vitest, 8 unit test
npm run build      # ng build — dist/angular-todo/browser
npm run typecheck  # tsc --noEmit trên cả src/ lẫn e2e/
npm run format:check

npx playwright install --with-deps chromium   # một lần, để chạy E2E cục bộ
npm run build && npm run e2e                  # Playwright chạy trên chính bản build production
```

## Cấu trúc

```
src/app/
  core/
    models/todo.model.ts       # Todo, TodoFilter
    models/doc.model.ts        # DocEntry, DocCategory — khai báo cho docs viewer
    data/todo-api.ts           # nguồn dữ liệu giả lập (cho resource())
    data/docs-registry.ts      # danh sách + metadata mọi tài liệu render trong app
    state/todo-store.ts        # TodoStore — signal/computed/effect/linkedSignal/resource
  features/todo/
    todo-shell/                # bố cục tổng
    todo-toolbar/               # form thêm việc + bộ lọc (model())
    todo-stats/                 # thống kê, presentational (input())
    todo-list/                   # danh sách + toast hoàn tất (effect() + onCleanup)
    todo-item/                   # một dòng việc, sửa/xoá/hoàn tất (input()/output())
  features/docs/
    markdown-renderer.ts        # markdown -> HTML (marked) + heading id/mục lục/link nội bộ
    docs-viewer/                # sidebar + nội dung, resource() fetch từng file .md
e2e/                            # Playwright E2E, chạy trên bản build production
.github/workflows/pipeline.yml  # lint -> unit-test -> build -> e2e -> deploy (Pages)
```

Các file `.md` (README, `docs/`, `EXERCISES.md`, `CONTRIBUTING.md`) được publish thành static
asset qua mấy entry `assets` thêm trong `angular.json`, để `docs-viewer` `fetch()` được lúc chạy —
xem entry đó nếu thêm tài liệu mới ở một thư mục khác `docs/`.

## CI/CD

`.github/workflows/pipeline.yml` — chạy trên mọi push/PR vào `main` (và có thể bấm chạy tay qua
tab _Actions_ → _Pipeline_ → _Run workflow_):

1. **lint** — `prettier --check` + `tsc --noEmit` (cả `src/` và `e2e/`)
2. **unit-test** — `ng test` (vitest, qua `TestBed`)
3. **build** — `ng build` production, lưu lại làm artifact
4. **e2e** — tải artifact ở bước 3, tự cài Chromium, chạy Playwright **trên đúng bản build đó**
   (không phải `ng serve`) — bắt được lỗi chỉ lộ ra sau khi bundle/minify
5. **deploy** — chỉ chạy khi **cả hai** điều kiện đúng: (a) đây là push vào `main`, và (b) biến
   repo `DEPLOY_PAGES` = `true`. Build lại riêng với `--base-href /angular-todo/` rồi publish lên
   GitHub Pages tại `https://<owner>.github.io/angular-todo/`.

**Bật/tắt deploy:** Settings → Secrets and variables → Actions → tab _Variables_ → New repository
variable → tên `DEPLOY_PAGES`, giá trị `true` (bật) hoặc `false`/xoá đi (tắt — mặc định tắt).
Tắt biến này chỉ chặn các lần deploy _sau đó_, **không** tự gỡ site đã publish trước đó khỏi
mạng — muốn gỡ hẳn thì vào Settings → Pages → Build and deployment → Source → chọn "None".

Chi phí: repo này là **public**, nên cả GitHub Actions (mọi job ở trên) lẫn GitHub Pages đều
**miễn phí**, không giới hạn số phút chạy đáng kể cho quy mô demo này.

## Ghi chú

Khai báo `@angular/cli@^21.2.20` trong khi mọi package framework (`@angular/core` và các gói
liên quan) đều ghim `22.2.2` là chủ đích, không phải nhầm lẫn — lý do đầy đủ ở
[ADR 0003](./docs/adr/0003-cli-vs-core-version-pin.md).

## Angular 22.2 có gì mới (và liên quan gì tới repo này)

Nâng từ bản trước lên `22.2.2` (22.2.0 ra ngày 2026-09-23; `22.2.1` và `22.2.2` là patch). Chỉ liệt
kê các `feat` chạm tới thứ repo này dùng — nguồn: `CHANGELOG.md` của Angular:

| Thay đổi                                                               | Liên quan tới repo                                                                                          |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Template truy cập được thành viên `private`                            | Có thể bỏ `protected` chỉ để template đọc được; **chưa đổi code** — `protected` vẫn đúng và quen thuộc hơn. |
| Option `strictUnclaimedEventNames` (`angularCompilerOptions`)          | Bắt lỗi gõ sai tên `output()` ở template. Chưa bật; cân nhắc khi thêm component có nhiều output.            |
| Đọc `Injector` từ view/content query                                   | Không dùng — app không có query lấy injector.                                                               |
| API lập trình cho `ErrorBoundary`, khối `@boundary` (language service) | Không dùng — chưa có error boundary trong app.                                                              |
| CSS lồng nhau được scope đúng                                          | Không ảnh hưởng — style của app không lồng.                                                                 |
| Router: `RedirectCommand` ném được, router resources công khai         | Không liên quan — app không cài `@angular/router` (xem `docs-viewer.ts`).                                   |
| Tiện ích test directive                                                | Chưa dùng; spec hiện tại dùng `TestBed` + `provideZonelessChangeDetection()`.                               |

Không có `feat` nào về compiler Rust trong 22.2. Phần đó được ghi riêng ở
[ADR 0008](./docs/adr/0008-angular-compiler-rust.md): Oxc Angular Compiler của VoidZero và hướng
hybrid (Rust frontend + TS backend) của Angular team — **theo dõi, chưa áp dụng**.

Docs pin cũng đã được nâng lên `v22.2.2` sau khi `npm run check:permalinks -- v22.2.2` báo 2/17
anchor trong `signals-deep-dive.md` bị lệch (`effect.ts`, `resource.ts`) và được sửa số dòng tay.

## Bắt kịp nhịp release của Angular

Từ v22, Angular đổi nhịp: **major mỗi 12 tháng** (v23 ~06/2027), 4–6 minor mỗi major, patch gần
như hàng tuần. Nghĩa là thứ đáng tự động hoá là patch, còn major thì còn xa.

Repo này tách **hai** version, cố ý — chi tiết ở
[ADR 0007](./docs/adr/0007-version-upgrade-policy.md):

|                                                          | Ghim ở đâu                                             | Nhịp đổi                                         |
| -------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------ |
| Version **runtime** (app compile bằng gì)                | `package.json`                                         | Mỗi patch, Dependabot bump tự động hàng tuần     |
| **Docs pin** (docs đang đọc source Angular ở commit nào) | [`docs/pinned-source.json`](./docs/pinned-source.json) | Thủ công, chỉ khi đã kiểm tra lại anchor `#L...` |

```bash
npm run check:docs         # CI chạy: docs có còn nhất quán với docs pin không
npm run check:permalinks   # thủ công: anchor #L... còn trỏ đúng đoạn code cũ không
```

Quy trình nâng pin từng bước: mục **Upgrade checklist** trong
[`CONTRIBUTING.md`](./CONTRIBUTING.md).

## Giới hạn

Đây là tài liệu học/dạy Signals, **không phải** production template. Không có: auth thật, backend
thật (`core/data/todo-api.ts` chỉ giả lập bằng `setTimeout`), offline-first, i18n, hay bất kỳ
chiến lược error-reporting/monitoring nào ngoài phạm vi demo. Đem nguyên xi cấu trúc này vào một
app production cần cân nhắc lại, không copy máy móc — xem
[`docs/comparison-state-management.md`](./docs/comparison-state-management.md) để biết khi nào
signal store thuần (như ở đây) là lựa chọn phù hợp so với các pattern khác.
