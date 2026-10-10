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

## Upgrade checklist — bắt kịp nhịp release của Angular

Từ v22, Angular ra major mỗi **12 tháng** (v23 ~06/2027), 4–6 minor mỗi major, patch gần như hàng
tuần. Repo này ghim **hai** version tách biệt, cố ý — lý do đầy đủ ở
[ADR 0007](./docs/adr/0007-version-upgrade-policy.md):

|                     | Ghim ở đâu                                             | Ai đổi                         |
| ------------------- | ------------------------------------------------------ | ------------------------------ |
| Version **runtime** | `package.json`                                         | Dependabot, hàng tuần, tự động |
| **Docs pin**        | [`docs/pinned-source.json`](./docs/pinned-source.json) | người, theo checklist dưới     |

### Patch hàng tuần (~2 phút)

Merge PR của Dependabot khi CI xanh. Không cần đụng tới docs — docs pin **được phép** tụt lại sau,
và `npm run check:docs` chỉ cảnh báo mềm chứ không fail vì việc đó.

### Mỗi minor (~2 tháng/lần, ~20 phút)

Chỉ đọc các dòng `feat:`, không đọc cả changelog:

```bash
curl -sL https://raw.githubusercontent.com/angular/angular/main/CHANGELOG.md \
  | awk '/^<a name="22\.3\.0">/,/SPLIT MARKER/' | grep 'feat'
```

Thêm một lượt grep để canh [ADR 0008](./docs/adr/0008-angular-compiler-rust.md) (compiler Rust):

```bash
curl -sL https://raw.githubusercontent.com/angular/angular/main/CHANGELOG.md \
  | awk '/^<a name="22\.3\.0">/,/SPLIT MARKER/' | grep -i 'oxc\|rust\|native'
```

Câu hỏi cần trả lời: **có `feat` nào chạm vào primitive mà repo này đang có ADR không?** Nếu có →
cập nhật ADR/deep-dive tương ứng (ví dụ v22.1 thêm option `set` cho `linkedSignal` → ADR 0004 + §6).

Nguồn tín hiệu tốt hơn changelog là diff của public API golden:

```bash
git diff v22.2.2:goldens/public-api/core/index.api.md \
        v22.3.0:goldens/public-api/core/index.api.md
```

### Nâng docs pin (chỉ khi có lý do, ~1 giờ)

**Không bao giờ `sed` SHA mà chưa chạy bước 1.** Đổi SHA luôn "thành công" kể cả khi anchor
`#L...` đã trỏ sang đoạn code khác — xem ADR 0007.

```bash
# 1. Anchor còn trỏ đúng đoạn code cũ không? (gọi mạng, nên chạy tay)
npm run check:permalinks -- v22.3.0

# 2. Chỉ khi bước 1 xanh: lấy SHA của tag đích
NEW=$(git ls-remote --tags https://github.com/angular/angular refs/tags/v22.3.0 | cut -f1)
OLD=$(node -p "require('./docs/pinned-source.json').angularSha")
grep -rl "$OLD" docs *.md | xargs sed -i "s/$OLD/$NEW/g"

# 3. Cập nhật docs/pinned-source.json: angularVersion, angularTag, angularSha,
#    và THÊM pin cũ vào stalePins (cả version lẫn SHA đầy đủ).
#    Nhớ cả SHA rút gọn dùng làm chữ hiển thị của link — `sed` ở bước 2 KHÔNG đụng tới nó.

# 4. Chốt
npm run check:docs
```

Nếu bước 1 báo anchor lệch: mở từng link ở ref đích, tìm lại đúng đoạn code, sửa số dòng bằng tay.
Đừng sed mù.

### Mỗi major (v23, ~06/2027)

`ng update`, chạy hết danh sách migration, và viết ADR cho mọi quyết định bị thay đổi.

## Accessibility

Component nào dựng lại một widget đã có sẵn ngữ nghĩa ARIA (radiogroup, listbox, tab...) thì phải
mang đủ role + trạng thái + hành vi bàn phím của widget đó, không chỉ role. Ví dụ có sẵn:
`TodoToolbar` (`role="radiogroup"` + `aria-checked` + roving `tabindex` + phím mũi tên) và
`TodoItemComponent` (`host: { role: 'listitem' }`, để `role="list"` của `TodoListComponent` thật
sự có item bên trong).

Repo cố ý **không** dùng `@angular/aria`: nó kéo theo `@angular/cdk` như peer dependency, tức là
hai package runtime mới cho một hàng nút lọc — đi ngược tinh thần của
[ADR 0002](./docs/adr/0002-custom-store-vs-ngrx-signalstore.md). Với app thật có nhiều widget hơn
thì cân nhắc lại là hợp lý.

## Trước khi commit

```bash
npm run format:check
npm run typecheck
npm run check:docs
npm test
npm run build && npm run e2e   # nếu đổi hành vi UI
```
