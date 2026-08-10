# Bài tập — tự học và dạy Signals bằng cách sửa app này

4 bài, tăng dần độ khó. Mỗi bài: đề bài, gợi ý trỏ đúng phần lý thuyết liên quan trong
[`docs/signals-deep-dive.md`](./docs/signals-deep-dive.md), và một lời giải tóm tắt trong
`<details>` — đừng mở ra trước khi tự làm thử. Làm trực tiếp trên nhánh riêng, chạy
`npm test && npm run typecheck` sau mỗi bài.

---

## Bài 1 — Computed mới: đếm việc quá hạn

Model `Todo` hiện chưa có deadline. Thêm field `dueAt?: number` (timestamp, optional) vào
`Todo` (`src/app/core/models/todo.model.ts`), rồi thêm một `computed()` mới trong `TodoStore`:
`overdueCount` — đếm số todo chưa hoàn tất (`completed: false`) có `dueAt` đã qua so với hiện tại.

**Gợi ý:** đọc [§4 `computed()`](./docs/signals-deep-dive.md#4-computed-primitivessignalssrccomputedts)
— chú ý computed **không tự chạy lại theo thời gian thực**: nó chỉ recompute khi có ai đọc nó _và_
một producer đã đổi version kể từ lần đọc trước. `Date.now()` đọc trực tiếp trong thân `computed`
sẽ không tự "tick" mỗi giây — nếu muốn `overdueCount` tự cập nhật khi thời gian trôi qua mà không
có state nào khác đổi, bạn cần một signal riêng đại diện "thời điểm hiện tại", cập nhật bằng
`setInterval` (và dọn bằng `onCleanup` — xem [§5.3](./docs/signals-deep-dive.md#53-cleanup-oncleanup)).

<details>
<summary>Gợi ý lời giải</summary>

Thêm `private readonly now = signal(Date.now())`, một `effect()` (hoặc đơn giản hơn: gọi
`setInterval` trong constructor cập nhật `now.set(Date.now())` mỗi giây, dọn interval bằng
`DestroyRef`), rồi:

```ts
readonly overdueCount = computed(
  () => this._todos().filter((t) => !t.completed && t.dueAt !== undefined && t.dueAt < this.now()).length,
);
```

Bài học rút ra: computed "phụ thuộc thời gian" luôn cần một signal tường minh đại diện cho thời
gian — không có cách nào khiến computed tự "poll" mà không có producer nào đổi.
</details>

---

## Bài 2 — `resource()` với debounced search

Thêm ô tìm kiếm trong `TodoToolbar`: gõ tiêu đề, danh sách lọc theo tiêu đề chứa chuỗi đó (không
phân biệt hoa thường). Dùng `resource()` để mô phỏng một lệnh search phía server (dù thực chất chỉ
lọc mảng local có `setTimeout` giả lập độ trễ, giống `fetchInitialTodos`), với debounce ~300ms để
tránh gọi lại `loader` trên mỗi phím gõ.

**Gợi ý:** đọc [§7 `resource()`](./docs/signals-deep-dive.md#7-resource--ổn-định-publicapi-220-đúng-từ-bản-v22-này)
— `resource()` tự abort lần load dở dang khi `params` đổi lần nữa, nhưng **không tự debounce**:
nếu bạn để `params` đọc trực tiếp signal của ô input, `loader` sẽ chạy lại (và bị abort ngay lập
tức) trên _mỗi_ ký tự gõ. Cần một bước debounce giữa signal của input và signal bạn đưa vào
`params` — cân nhắc `linkedSignal` hoặc một signal trung gian được set qua `setTimeout` có huỷ.

<details>
<summary>Gợi ý lời giải</summary>

Một signal trung gian `debouncedQuery`, cập nhật qua `effect()` theo dõi `query` (ô input), dùng
`setTimeout` + `onCleanup` để huỷ timer cũ mỗi lần `query` đổi trước khi timer mới kịp chạy —
đúng pattern cleanup ở toast (`TodoListComponent`). `resource({ params: () => this.debouncedQuery() ,
loader: ... })` chỉ load lại khi `debouncedQuery` thực sự đổi (sau khi ngừng gõ 300ms).
</details>

---

## Bài 3 — Undo/redo bằng `linkedSignal`

Thêm nút Undo cho `toggleTodo`/`addTodo`/`removeTodo` gần nhất (một cấp, không cần full history
stack). Cân nhắc: state "hành động gần nhất để undo" cần _ghi được_ (xoá sau khi undo) nhưng cũng
cần _tự reset_ khi có một hành động mới xảy ra (không thể undo một hành động đã bị undo, hoặc undo
nhầm hành động cũ hơn hành động vừa thực hiện).

**Gợi ý:** đọc
[§6 `linkedSignal()`](./docs/signals-deep-dive.md#6-linkedsignal-primitivessignalssrclinked_signalts--render3reactivitylinked_signalts)
và bảng
ba loại state ở cuối mục đó — đây gần như chính xác bài toán mà `draftTitle` đã giải (xem
[ADR 0004](./docs/adr/0004-linkedsignal-draft-title.md)), chỉ khác "nguồn" là gì.

<details>
<summary>Gợi ý lời giải</summary>

Một `signal` (không phải `linkedSignal`) lưu "hành động gần nhất" — set mỗi khi có mutation, chứa
đủ thông tin để đảo ngược (vd `{ type: 'toggle', id }`). `undo()` đọc signal đó, thực hiện hành
động đảo ngược, rồi set về `null`. Không cần `linkedSignal` ở đây thực ra — điểm học được là:
`linkedSignal` phù hợp khi giá trị _tự_ suy ra lại từ một nguồn thay đổi độc lập; ở đây "nguồn"
(hành động gần nhất) chính là thứ signal này lưu, nên `signal` thường + ghi tường minh tại mỗi
call site mutation (giống `completionEvents`) là lựa chọn đúng hơn. Nếu bài làm của bạn dùng
`linkedSignal` mà thấy gượng ép, đó chính là bài học: không phải "state ghi được + có reset" nào
cũng nên dùng `linkedSignal`.
</details>

---

## Bài 4 — Optimistic update + rollback khi "API" giả lập fail

Sửa `fetchInitialTodos` (hoặc thêm một hàm giả lập tương tự cho `toggleTodo`) để có 20% khả năng
`reject`. Khi gọi, cập nhật UI ngay lập tức (optimistic), rồi rollback nếu request thất bại, kèm
thông báo lỗi.

**Gợi ý:** đây là bài tổng hợp — cần `resource()` (hoặc gọi Promise trực tiếp trong method mutation
của store) kết hợp với snapshot state cũ để rollback đúng cách. Đọc lại
[case study `completion-toast-race-condition`](./docs/case-studies/completion-toast-race-condition.md)
trước khi làm: đừng lặp
lại lỗi "suy luận trạng thái từ diff" — lưu tường minh snapshot _trước_ khi optimistic-update, để
rollback là "đặt lại đúng snapshot đó", không phải "đoán ngược lại state trước đó từ state hiện
tại".

<details>
<summary>Gợi ý lời giải</summary>

Trong method mutation (vd `toggleTodo`): lưu `const previous = this._todos()` trước khi
`.update()`, gọi hàm giả lập API bất đồng bộ, `.catch()` thì `this._todos.set(previous)` (đặt lại
đúng tham chiếu cũ — hợp lệ vì `signal` so sánh theo tham chiếu, xem
[§3](./docs/signals-deep-dive.md#3-signal-primitivessignalssrcsignalts)) kèm set một signal lỗi
riêng để hiển thị thông báo. Không dùng `effect()` để "phát hiện" thất bại bằng cách diff state —
xử lý rollback ngay tại `.catch()` của chính request đó, cùng lý do `completionEvents` không được
suy ra bằng diff trong effect.
</details>
