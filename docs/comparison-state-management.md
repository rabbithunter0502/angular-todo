# So sánh pattern quản lý state trong Angular

Repo này chọn **service với signal primitives thuần** (`TodoStore` —
`src/app/core/state/todo-store.ts`, giải thích trong
[`docs/signals-deep-dive.md`](./signals-deep-dive.md); lý do chọn ở
[ADR 0002](./adr/0002-custom-store-vs-ngrx-signalstore.md)). Đây không phải khẳng định "cách này
luôn tốt nhất" — dưới đây là so sánh có căn cứ với 3 pattern phổ biến khác, để tự chọn đúng cho
bối cảnh của bạn thay vì copy nguyên xi cách làm của repo này.

| Trục                                       | Signal store thuần (repo này)                                                                    | `@ngrx/signals` SignalStore                                                                       | Service + `BehaviorSubject` (RxJS)                                                                                                      | NgRx classic (store/actions/reducers/effects)                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Boilerplate cho 1 mutation                 | 1 method, vài dòng                                                                               | 1 method trong `withMethods`, tương tự                                                            | 1 method gọi `.next()` trên subject                                                                                                     | Action creator + case trong reducer + (nếu async) effect                                                                   |
| Dependency thêm ngoài `@angular/core`      | Không                                                                                            | `@ngrx/signals`                                                                                   | `rxjs` (đã có sẵn trong Angular)                                                                                                        | `@ngrx/store` (+ `@ngrx/effects` nếu có side-effect async)                                                                 |
| DevTools / time-travel debugging           | Không có sẵn — cần console.log/breakpoint thủ công                                               | Không có time-travel built-in (khác NgRx classic)                                                 | Không có sẵn                                                                                                                            | Có (Redux DevTools: action log, replay, diff state)                                                                        |
| Kỷ luật "một chiều" được compiler ép buộc? | Không — chỉ quy ước (`private` + `.asReadonly()`)                                                | Không — tương tự                                                                                  | Không — tương tự                                                                                                                        | Có phần — action phải đi qua `dispatch`, reducer là pure function bắt buộc                                                 |
| Đường cong học                             | Thấp nếu đã biết Signals; primitive lộ trực tiếp, dễ trace vào source Angular                    | Trung bình — thêm API riêng (`withState`, `withComputed`, `withHooks`) trên nền Signals           | Trung bình — cần hiểu RxJS operator, `distinctUntilChanged`, subscription leak                                                          | Cao — action/reducer/effect/selector, thường cần thư viện phụ (`createFeature`, `createEntityAdapter`) để đỡ boilerplate   |
| Hợp với zoneless?                          | Có — bản chất chính là signal push-notify (xem [ADR 0001](./adr/0001-zoneless-signals-state.md)) | Có — cũng xây trên signal                                                                         | Cần đảm bảo binding cuối cùng đi qua signal (`toSignal()`) để zoneless track được, nếu không dễ rơi vào tình huống UI không tự cập nhật | Selector thường được convert qua `toSignal()` để zoneless track — thêm một lớp chuyển đổi                                  |
| Phù hợp nhất khi                           | Feature nhỏ/vừa, muốn học/dạy trực tiếp cơ chế Signals, team nhỏ tự kỷ luật convention           | Muốn API tiện lợi hơn signal thuần (computed/method gộp sẵn) nhưng chưa cần time-travel debugging | Đã có logic RxJS pipeline sẵn (`switchMap`, `debounceTime`...) muốn tái dùng, hoặc migrate dần từ codebase RxJS cũ                      | App lớn, nhiều team, cần audit trail rõ ràng (ai/khi nào đổi gì), sẵn sàng trả giá boilerplate để đổi lấy kỷ luật cấu trúc |

## Điều không đổi giữa các pattern

Bất kể chọn pattern nào, những nguyên tắc ở
[checklist tư duy senior](./signals-deep-dive.md#10-tổng-hợp--checklist-tư-duy-senior-khi-làm-việc-với-signals)
vẫn áp dụng nếu UI cuối cùng bind qua signal: so sánh mặc định theo tham chiếu (không mutate rồi
set lại cùng object), effect chạy một lần ngay khi tạo, và effect không nên dùng để suy luận lại
"chuyện gì vừa xảy ra" từ diff state — pattern quản lý state chỉ quyết định **state đặt ở đâu và
ai được sửa nó**, không thay đổi cách bản thân đồ thị reactive của Angular hoạt động.

## Khi nào nên đổi pattern giữa chừng

Dấu hiệu nên cân nhắc chuyển từ signal store thuần sang `@ngrx/signals` hoặc NgRx classic:
nhiều team cùng sửa một store và cần audit trail; cần time-travel debug một bug khó tái hiện; số
lượng mutation/computed tăng tới mức một file service trở nên khó điều hướng dù đã tách theo
region. Không có ngưỡng số dòng cụ thể — đây là quyết định về tổ chức team nhiều hơn kỹ thuật
thuần tuý.
