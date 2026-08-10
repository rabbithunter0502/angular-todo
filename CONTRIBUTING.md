# Contributing

Repo này là tài liệu tự học/giảng dạy Signals trước, là app demo sau. Mọi đóng góp nên giữ đúng
tinh thần đó: code có ý định rõ ràng, quyết định thiết kế có ghi lại, bug thật (nếu gặp) được kể
lại thay vì chỉ âm thầm sửa.

## Thêm feature mới trong `src/app/`

- **State đặt ở đâu:** nếu nhiều component cần đọc/ghi cùng một state → thuộc về store
  (`core/state/`), theo đúng pattern của `TodoStore` — `WritableSignal` private, expose qua
  `.asReadonly()`, mọi write đi qua method nghiệp vụ có tên rõ ràng. Không expose `WritableSignal`
  ra ngoài store. Nếu state chỉ dùng nội bộ một component (như `toast` trong `TodoListComponent`)
  → giữ tại component đó, không đẩy lên store "cho chắc".
- **Khi nào `input()` / `output()` / `model()`:**
  - `input()`/`input.required()` khi component chỉ _phản ánh_ dữ liệu từ nơi khác (store, cha) —
    component không sở hữu state đó.
  - `output()` khi component cần báo sự kiện lên cha/store, không tự thay đổi state của chính nó
    theo sự kiện đó.
  - `model()` chỉ khi component _thực sự sở hữu_ state và cha _tuỳ chọn_ bind hai chiều — không
    dùng chỉ để gộp gọn một cặp `input()+output()` nếu bạn không có ý định để state đó "sống" ở
    component.
- **`computed` vs `linkedSignal` vs `signal` + `effect` để đồng bộ:** ưu tiên theo đúng thứ tự đó.
  Nếu thấy mình viết `effect()` chỉ để copy giá trị từ signal A sang signal B mỗi khi A đổi — dừng
  lại, đó gần như luôn nên là `computed` (nếu B không cần ghi được) hoặc `linkedSignal` (nếu B cần
  ghi được nhưng cũng cần reset theo A). Xem [ADR 0004](./docs/adr/0004-linkedsignal-draft-title.md)
  cho một ví dụ cụ thể đã đi qua đúng cân nhắc này.
- **Mutation, không mutate-in-place:** signal so sánh theo tham chiếu (`Object.is`) — luôn tạo
  array/object mới khi "sửa" (xem [`docs/signals-deep-dive.md` §3](./docs/signals-deep-dive.md#3-signal-primitivessignalssrcsignalts)).

## Thêm ADR mới

Khi một quyết định thiết kế đáng ghi lại (chọn primitive nào, đổi convention, đổi công cụ build...)
— thêm file mới vào `docs/adr/`, đánh số tiếp theo, theo khuôn 4 mục ở
[`docs/adr/README.md`](./docs/adr/README.md), và thêm dòng vào bảng index trong file đó.

## Thêm case study mới

Gặp một bug thật (không phải lỗi gõ nhầm, mà loại lỗi bắt nguồn từ hiểu sai cơ chế reactive graph)
— viết lại theo khuôn **Triệu chứng → Nguyên nhân → Giải pháp đúng → Bài học tổng quát**, đặt vào
`docs/case-studies/`, xem mẫu tại
[`docs/case-studies/completion-toast-race-condition.md`](./docs/case-studies/completion-toast-race-condition.md).
Nếu case study liên quan trực tiếp một primitive cụ thể, trỏ link về từ section tương ứng trong
`docs/signals-deep-dive.md`.

## Thêm bài tập mới

Thêm vào [`EXERCISES.md`](./EXERCISES.md), theo khuôn: đề bài → gợi ý (trỏ đúng section lý thuyết
liên quan) → lời giải tóm tắt trong `<details>`. Bài tập nên dạy đúng một khái niệm/cạm bẫy cụ thể,
không phải "thêm feature cho đẹp".

## Trước khi commit

```bash
npm run format:check
npm run typecheck
npm test
npm run build && npm run e2e   # nếu đổi hành vi UI
```
