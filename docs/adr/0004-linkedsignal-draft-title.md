# 0004 — `draftTitle` dùng `linkedSignal` thay vì `signal` + `effect`

## Bối cảnh

Ô sửa tên việc (`TodoStore.draftTitle`) cần hai thứ tưởng chừng mâu thuẫn: **ghi được** trực tiếp
mỗi lần người dùng gõ phím (`updateDraft()`), và **tự reset** về đúng tiêu đề của todo đang sửa mỗi
khi `editingId` chuyển sang một item khác — nhưng _không_ reset trên mỗi lần gõ phím, chỉ khi
`editingId` thực sự đổi.

## Phương án đã cân nhắc

1. **`signal<string>('')` trần** — ghi được, nhưng không có cách nào tự biết "cần reset" khi
   `editingId` đổi mà không có logic bên ngoài theo dõi cả hai signal và đồng bộ tay.
2. **`signal` + `effect` theo dõi `editingId` để `.set()` lại `draftTitle`** — hoạt động, nhưng tạo
   ra đúng pattern mà mục checklist "Kiến trúc state" trong
   [`docs/signals-deep-dive.md` §10](../signals-deep-dive.md) cảnh báo: hai signal "phải luôn khớp
   nhau bằng tay". Effect chạy bất đồng bộ (microtask), nên có một khoảng ngắn `draftTitle` mang
   giá trị cũ trước khi effect kịp chạy lại — và nếu sau này thêm effect khác cũng ghi vào
   `draftTitle`, nguy cơ race giữa hai effect là có thật (xem case study về `completionEvents` ở
   [`docs/case-studies/completion-toast-race-condition.md`](../case-studies/completion-toast-race-condition.md)
   cho một ví dụ cụ thể của đúng loại lỗi này khi suy luận sai về thứ tự effect chạy).
3. **`computed()` thuần** — tự đồng bộ đúng lúc, nhưng không ghi được: gõ phím vào một `computed`
   là không hợp lệ.
4. **`linkedSignal({ source, computation })`** — `source: this._editingId`, `computation` chỉ chạy
   lại khi `source` đổi giá trị; giữa hai lần đổi đó, `draftTitle` là một `WritableSignal` bình
   thường, `updateDraft()` gọi thẳng `.set()` không đụng đến `computation`.

## Quyết định

Chọn `linkedSignal` (phương án 4) — xem implementation tại `TodoStore.draftTitle`
(`src/app/core/state/todo-store.ts`) và giải thích cơ chế tại
[`docs/signals-deep-dive.md` §6](../signals-deep-dive.md).

## Đánh đổi chấp nhận

- `linkedSignal` là primitive ít quen thuộc hơn `signal`/`computed`/`effect` — cần người đọc nắm
  đúng khái niệm "ghi được nhưng tự reset theo nguồn" mới hiểu ngay tại sao không dùng `computed`
  hay `signal` thường; đổi lại, không có effect nào phải viết/maintain chỉ để đồng bộ hai signal.
