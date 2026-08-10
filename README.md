# angular-todo

[![Pipeline](https://github.com/rabbithunter0502/angular-todo/actions/workflows/pipeline.yml/badge.svg)](https://github.com/rabbithunter0502/angular-todo/actions/workflows/pipeline.yml)

Todo app dựng bằng **Angular v22** (`@angular/core@22.1.1`), zoneless, dùng **Signals**
(`signal`, `computed`, `effect`, `linkedSignal`, `resource`) làm toàn bộ state management —
không NgRx, không RxJS store.

Repo này là **tài liệu tự học/giảng dạy Signals trước, app demo sau** — xem mục
[Giới hạn](#giới-hạn) trước khi coi đây là template production.

📖 **[docs/signals-deep-dive.md](./docs/signals-deep-dive.md)** — giải thích Signals từ chính
source code của Angular (permalink pinned theo tag `v22.1.1`, khớp version đang ghim trong
`package.json`), map từng primitive vào code thật trong app này, một case study bug thật gặp
phải khi build demo (và cách sửa đúng theo nguyên tắc của Angular), và một checklist tư duy
senior khi làm việc với Signals. Tài liệu liên quan:

- [`docs/adr/`](./docs/adr/) — quyết định thiết kế (vì sao zoneless, vì sao không NgRx, vì sao
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
    data/todo-api.ts           # nguồn dữ liệu giả lập (cho resource())
    state/todo-store.ts        # TodoStore — signal/computed/effect/linkedSignal/resource
  features/todo/
    todo-shell/                # bố cục tổng
    todo-toolbar/               # form thêm việc + bộ lọc (model())
    todo-stats/                 # thống kê, presentational (input())
    todo-list/                   # danh sách + toast hoàn tất (effect() + onCleanup)
    todo-item/                   # một dòng việc, sửa/xoá/hoàn tất (input()/output())
e2e/                            # Playwright E2E, chạy trên bản build production
.github/workflows/pipeline.yml  # lint -> unit-test -> build -> e2e -> deploy (Pages)
```

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
liên quan) đều ghim `22.1.1` là chủ đích, không phải nhầm lẫn — lý do đầy đủ ở
[ADR 0003](./docs/adr/0003-cli-vs-core-version-pin.md).

## Giới hạn

Đây là tài liệu học/dạy Signals, **không phải** production template. Không có: auth thật, backend
thật (`core/data/todo-api.ts` chỉ giả lập bằng `setTimeout`), offline-first, i18n, hay bất kỳ
chiến lược error-reporting/monitoring nào ngoài phạm vi demo. Đem nguyên xi cấu trúc này vào một
app production cần cân nhắc lại, không copy máy móc — xem
[`docs/comparison-state-management.md`](./docs/comparison-state-management.md) để biết khi nào
signal store thuần (như ở đây) là lựa chọn phù hợp so với các pattern khác.
