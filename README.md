# angular-todo

Todo app dựng bằng **Angular v22** (`@angular/core@22.1.1`), zoneless, dùng **Signals**
(`signal`, `computed`, `effect`, `linkedSignal`, `resource`) làm toàn bộ state management —
không NgRx, không RxJS store.

📖 **[docs/signals-deep-dive.md](./docs/signals-deep-dive.md)** — giải thích Signals từ chính
source code của Angular (`packages/core/primitives/signals`, `render3/reactivity`), map từng
primitive vào code thật trong app này, một case study bug thật gặp phải khi build demo (và cách
sửa đúng theo nguyên tắc của Angular), và một checklist tư duy senior khi làm việc với Signals.

## Chạy thử

```bash
npm install
npm start        # ng serve — http://localhost:4200
npm test         # ng test  — vitest
npm run build    # ng build — dist/angular-todo
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
```

## Ghi chú

Khai báo `@angular/cli@^21.2.20` trong khi mọi package framework (`@angular/core` và các gói
liên quan) đều ghim `22.1.1` là chủ đích, không phải nhầm lẫn — lý do nằm ở mục cuối
`docs/signals-deep-dive.md`.
