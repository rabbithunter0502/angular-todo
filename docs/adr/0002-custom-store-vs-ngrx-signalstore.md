# 0002 — Tự viết `TodoStore` bằng signal primitives thay vì NgRx / `@ngrx/signals`

## Bối cảnh

Cần một nơi tập trung giữ state của feature todo (danh sách, filter, item đang sửa) và logic thay
đổi nó (`toggleTodo`, `addTodo`...), tách khỏi component. Có nhiều pattern sẵn có trong hệ sinh
thái Angular để làm việc này — xem so sánh đầy đủ ở
[`docs/comparison-state-management.md`](../comparison-state-management.md).

## Phương án đã cân nhắc

1. **NgRx classic** (`@ngrx/store` + actions/reducers/effects/selectors) — mạnh về DevTools
   time-travel debugging và kỷ luật một-chiều rõ ràng, nhưng boilerplate lớn (action creators,
   reducer, effect, selector cho mỗi thao tác) — quá nặng so với quy mô 6 mutation của feature
   này, và học Signals nguyên bản sẽ bị che khuất sau một lớp trừu tượng khác.
2. **`@ngrx/signals` (SignalStore)** — API mỏng hơn NgRx classic, dùng signal nội bộ, có
   `withMethods`/`withComputed`/`withHooks`. Gần với cách viết ở đây, nhưng vẫn là một lớp
   trừu tượng thêm giữa developer và signal primitive thật — mục tiêu của repo này là để người đọc
   thấy trực tiếp `signal`/`computed`/`effect`/`linkedSignal`/`resource` hoạt động, không phải học
   API riêng của một thư viện đóng gói chúng.
3. **Service với `signal`/`computed`/`effect` thuần** ("service with signals" — pattern được chính
   Angular style guide khuyến nghị) — không thêm dependency nào ngoài `@angular/core`, mọi
   primitive dùng trực tiếp, có thể trace thẳng vào source Angular (xem
   [`docs/signals-deep-dive.md`](../signals-deep-dive.md)).

## Quyết định

Chọn phương án 3: `TodoStore` là một `@Injectable({ providedIn: 'root' })` thuần, `WritableSignal`
private + `.asReadonly()` public, mọi write đi qua method nghiệp vụ
(`src/app/core/state/todo-store.ts`).

## Đánh đổi chấp nhận

- Không có DevTools time-travel debugging miễn phí như NgRx (action log, replay state) — với 6
  mutation của feature này, log thủ công hoặc breakpoint là đủ; ở app lớn hơn nhiều feature/nhiều
  team, cái giá này tăng lên và NgRx (classic hoặc signals) có thể đáng đánh đổi lại.
- Không có convention "action" thống nhất bắt buộc — kỷ luật "chỉ sửa state qua method có tên rõ
  ràng" chỉ được đảm bảo bởi quy ước (`private readonly _todos`, expose `.asReadonly()`), không
  phải bởi compiler. Vi phạm quy ước này (gọi `.set()` trực tiếp từ component) vẫn compile được.
