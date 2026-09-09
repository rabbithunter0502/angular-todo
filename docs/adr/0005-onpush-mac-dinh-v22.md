# 0005 — Bỏ `changeDetection: ChangeDetectionStrategy.OnPush` tường minh

## Bối cảnh

Trước v22, mọi component trong repo này đều khai báo tường minh:

```ts
@Component({
  selector: 'app-todo-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
```

Angular v22.0 đổi mặc định — đây là một breaking change có tên trong changelog:

> Component with undefined `changeDetection` property are now `OnPush` by default. Specify
> `changeDetection: ChangeDetectionStrategy.Eager` to keep the previous behavior.

Nghĩa là dòng khai báo trên giờ **không còn thay đổi gì cả**: bỏ nó đi thì component vẫn `OnPush`,
y hệt. Angular thậm chí ship sẵn migration đi theo chiều ngược lại
(`ng update` chạy `change-detection-eager` để thêm `Eager` vào các component _cần_ hành vi cũ) —
tức là chiều "giữ mặc định mới" được coi là chuyện đương nhiên, không cần migration.

Tình trạng thực tế trong repo lúc đó cũng đã không nhất quán: 5/6 component khai báo tường minh,
riêng `App` (`src/app/app.ts`) thì không — và `App` vẫn `OnPush`, chỉ là nhờ mặc định. Đọc lướt
qua thì trông như một chỗ bị bỏ sót.

## Phương án đã cân nhắc

1. **Giữ nguyên khai báo tường minh ở mọi component** — lập luận: "viết rõ ra vẫn hơn, người đọc
   không phải nhớ mặc định là gì". Vấn đề: repo này lấy _"đây là Angular hiện tại trông như thế
   nào"_ làm luận điểm chính. Boilerplate thời v21 nằm rải khắp `src/` dạy người đọc một thói quen
   đã lỗi thời, và tệ hơn — nó **che mất** chính cái sự thật đáng học ở đây (v22 đã đổi mặc định).
   Người đọc copy pattern này sang project mới sẽ mang theo dòng thừa đó vô thời hạn.
2. **Thêm `Eager` vào đúng những component "cần"** — không component nào ở đây cần: toàn bộ state
   đi qua signal, không có chỗ nào dựa vào việc Angular quét lại cây một cách vô điều kiện. Đây là
   phương án dành cho codebase cũ đang migrate, không phải cho repo này.
3. **Bỏ khai báo tường minh, ghi lại lý do ở đúng một chỗ** — `src/app/app.ts` (component gốc, vốn
   đã không khai báo) mang comment giải thích quy ước chung, ADR này giữ lập luận đầy đủ.

## Quyết định

Chọn phương án 3. Bỏ `changeDetection: ChangeDetectionStrategy.OnPush` (và import
`ChangeDetectionStrategy` kèm theo) khỏi cả 6 component; comment quy ước đặt tại
[`src/app/app.ts`](../../src/app/app.ts).

Kiểm chứng không đổi hành vi: 8 unit test + 8 e2e test (Playwright, chạy trên **production
build**) đều xanh trước và sau khi bỏ — trong đó có các test bắt đúng loại lỗi change-detection,
ví dụ "addTodo() appends and computed() stats update in the same paint".

## Đánh đổi chấp nhận

- Người đọc quen Angular ≤ v21 mở `todo-item.ts` sẽ **không thấy** `OnPush` ở đâu và có thể tưởng
  component đang chạy change-detection kiểu cũ. Đây là đánh đổi có ý thức: giải quyết bằng comment
  ở `app.ts` + ADR này, chứ không bằng cách rải lại boilerplate.
- Nếu sau này repo cần một component thực sự chạy `Eager`, phải nhớ khai báo tường minh — và lúc
  đó dòng khai báo ấy sẽ mang đúng ý nghĩa "chỗ này khác mặc định", thay vì lẫn vào 6 dòng giống
  hệt nhau không nói lên điều gì.
