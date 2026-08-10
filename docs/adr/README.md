# Architecture Decision Records

Mỗi ADR ghi lại **một** quyết định thiết kế cụ thể của repo này: bối cảnh, các phương án đã cân
nhắc, quyết định cuối, và đánh đổi chấp nhận. Mục tiêu không phải liệt kê "best practice" chung
chung — mà là để bất kỳ ai (kể cả chính tác giả 6 tháng sau) đọc lại và hiểu **tại sao** code
trông như vậy, không chỉ **nó trông như vậy**.

Khi thêm quyết định thiết kế mới đáng ghi lại (đổi cách chọn primitive, đổi convention, đổi công
cụ build...), thêm một file mới đánh số tiếp theo, theo đúng khuôn 4 mục dưới đây — xem
[`CONTRIBUTING.md`](../../CONTRIBUTING.md).

| #                                                  | Tiêu đề                                                                 | Trạng thái |
| -------------------------------------------------- | ----------------------------------------------------------------------- | ---------- |
| [0001](./0001-zoneless-signals-state.md)           | Zoneless + Signals thay vì Zone.js                                      | Accepted   |
| [0002](./0002-custom-store-vs-ngrx-signalstore.md) | Tự viết `TodoStore` bằng signal primitives thay vì NgRx/`@ngrx/signals` | Accepted   |
| [0003](./0003-cli-vs-core-version-pin.md)          | Ghim `@angular/cli@^21` trong khi framework là `22.1.1`                 | Accepted   |
| [0004](./0004-linkedsignal-draft-title.md)         | `draftTitle` dùng `linkedSignal` thay vì `signal` + `effect`            | Accepted   |

Mỗi ADR theo khuôn:

1. **Bối cảnh** — vấn đề cần giải quyết, ràng buộc đang có.
2. **Phương án đã cân nhắc** — ít nhất 2, kể cả phương án bị loại, và vì sao bị loại.
3. **Quyết định** — chọn gì.
4. **Đánh đổi chấp nhận** — cái gì mất đi khi chọn phương án này, chấp nhận có ý thức.
