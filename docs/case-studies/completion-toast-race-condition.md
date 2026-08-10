# Vì sao `completionEvents` là một signal riêng, không phải "diff `stats().completed`"

> Bug thật gặp phải khi build demo này, bắt được bằng Playwright thật (không chỉ đọc code), sửa
> đúng theo nguyên tắc chính thức của Angular. Xem cơ chế `effect()` (root vs view, và việc effect
> luôn chạy một lần ngay khi tạo) tại
> [`docs/signals-deep-dive.md` §5.2](../signals-deep-dive.md#52-lớp-angular-root-effect-vs-view-effect)
> trước khi đọc phần dưới — case study này giả định đã hiểu chi tiết đó.

## Triệu chứng

Bản đầu tiên của toast "✔ Đã hoàn tất" trong `TodoListComponent` **không** có `completionEvents`
trong `TodoStore` — nó theo dõi `store.stats().completed` trong một `effect()`, tự lưu
`previousCompleted` trong closure, và so sánh "tăng lên thì báo toast". Chạy build, chạy
`ng serve`, rồi kiểm tra bằng Playwright thật: toast hiện ra **ngay khi tải trang**, trước khi
người dùng bấm gì cả.

## Nguyên nhân

`TodoStore` có hai effect độc lập được tạo gần như đồng thời (một effect hydrate dữ liệu từ
`resource()`, một effect đếm-toast trong `TodoListComponent`) — cả hai đều là root/view effect
riêng biệt, và cả hai đều **chạy đúng một lần ngay khi được tạo** để thiết lập baseline
dependencies, y hệt `computed`. Effect hydrate chỉ hoàn tất _sau khi_ `resource()` resolve (bất
đồng bộ, 500ms giả lập trong demo). Vậy nên "tăng từ 0 lên 1" xảy ra hợp lệ về mặt dữ liệu (một
item seed vốn `completed: true`), nhưng **không hề bắt nguồn từ một cú click nào của người dùng**
— chỉ đơn giản là dữ liệu ban đầu tải xong.

Thêm guard "chạy lần đầu thì chỉ ghi baseline, không báo toast" _vẫn_ không đủ: lần đầu effect
chạy, `resource()` thường **chưa** resolve (nó chạy đồng bộ ngay khi component vừa tạo), nên
baseline ghi nhận là `0`; khi `resource()` resolve sau đó, effect chạy **lại lần thứ hai** với
`completed = 1` — với con mắt của "diff theo thời gian", lần thứ hai _đúng là_ một cú tăng, y hệt
một lần toggle thật. Guard "lần đầu" không phân biệt được hai trường hợp này vì cả hai đều là
"lần chạy thứ N của effect", không phải "lần đầu" theo đúng nghĩa cần.

## Giải pháp đúng

Đừng suy luận "vừa xảy ra hành động gì" bằng cách diff state theo thời gian trong effect — hãy
phát ra tín hiệu tường minh **tại chính nơi hành động xảy ra** (`TodoStore.toggleTodo()`), độc lập
hoàn toàn với bất kỳ tiến trình hydrate/async nào khác:

```ts
toggleTodo(id: string): void {
  let justCompleted = false;
  this._todos.update((todos) =>
    todos.map((todo) => {
      if (todo.id !== id) return todo;
      justCompleted = !todo.completed;
      return { ...todo, completed: justCompleted };
    }),
  );
  if (justCompleted) {
    // Object mới -> luôn notify, kể cả complete → undo → complete lại cùng id.
    this._completionEvents.set({ id, at: Date.now() });
  }
}
```

📍 [`todo-store.ts#L132-L151`](https://github.com/rabbithunter0502/angular-todo/blob/9cc370cb01fad649b8396fbb3f41ee1e5d4f9f94/src/app/core/state/todo-store.ts#L132-L151)
(`toggleTodo`)

`TodoListComponent` phản ứng với `completionEvents` thay vì diff `stats().completed` — xem
[`todo-list.ts#L36-L45`](https://github.com/rabbithunter0502/angular-todo/blob/9cc370cb01fad649b8396fbb3f41ee1e5d4f9f94/src/app/features/todo/todo-list/todo-list.ts#L36-L45).

## Bài học tổng quát

Đây chính là điều tài liệu chính thức của Angular gọi là "effect nên dùng để đồng bộ với hệ thống
ngoài reactive graph (DOM, storage, logging...), không nên dùng để tái tạo lại business logic từ
state" — nhưng ở đây nó không phải một câu trích dẫn suông, mà là một bug thật, bắt được bằng một
bài test Playwright thật, sửa bằng đúng nguyên tắc đó. Cả
`src/app/core/state/todo-store.spec.ts` (test `'emits a completionEvents pulse only on a
false→true transition, and again on repeats'`) lẫn checklist "tư duy senior" ở
[`docs/signals-deep-dive.md` §10](../signals-deep-dive.md#10-tổng-hợp--checklist-tư-duy-senior-khi-làm-việc-với-signals)
đều đúc kết trực tiếp từ ca này. Xem thêm
[ADR 0004](../adr/0004-linkedsignal-draft-title.md) cho một quyết định thiết kế khác né tránh
đúng loại race-giữa-hai-effect này ngay từ đầu, thay vì phải sửa sau khi gặp bug.

## Muốn thêm case study mới?

Dùng khuôn: **Triệu chứng → Nguyên nhân → Giải pháp đúng → Bài học tổng quát**, đặt file mới vào
`docs/case-studies/`, và trỏ link về từ `docs/signals-deep-dive.md` nếu liên quan trực tiếp đến
một primitive cụ thể. Xem [`CONTRIBUTING.md`](../../CONTRIBUTING.md).
