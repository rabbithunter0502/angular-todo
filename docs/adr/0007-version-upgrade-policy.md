# 0007 — Tách "version runtime" khỏi "docs pin", và tự động hoá phần còn lại

## Bối cảnh

Repo bị tụt lại 4 bản patch (`22.1.1` trong khi mới nhất là `22.1.5`) không phải vì nâng patch
khó, mà vì một câu trong `README.md`:

> permalink pinned theo tag `v22.1.1`, **khớp version đang ghim trong `package.json`**

Lời hứa "hai thứ luôn bằng nhau" biến một lần bump một dòng `package.json` thành một cuộc di cư
~30 permalink. Việc đó không bao giờ được làm, nên patch cũng không bao giờ được bump — kể cả
những bản patch có nội dung đáng lấy (`22.1.5` thêm extended diagnostic bắt uninvoked signal alias,
`22.1.3` sửa lỗi effect chạy tiếp sau khi một effect khác destroy view giữa chừng — đúng loại lỗi
mà [case study về toast](../case-studies/completion-toast-race-condition.md) nói tới).

Cần phân biệt: chi phí thật **không** nằm ở việc đổi SHA. Cả 17 permalink dùng chung một SHA, và
SHA đó chính là commit của tag:

```
7c15737f50c0f22b2f04e138f18ec862ac446d09  refs/tags/v22.1.1
468b65b74566537456c192ac4281795c5a1e1a5e  refs/tags/v22.1.5
```

Chi phí thật nằm ở các **anchor `#L...`**. `sed` đổi SHA thì luôn "thành công" — link vẫn mở được,
vẫn ra đúng file. Nhưng nếu số dòng trong `graph.ts` đã dịch chuyển giữa hai bản patch thì
`#L120-L207` giờ trỏ vào một đoạn code khác, và **không có gì báo**. Với một repo mà toàn bộ giá
trị nằm ở "đọc source thật, có permalink để đối chiếu, không cần tin chay", đó là dạng hỏng tệ
nhất: tài liệu vẫn trông đúng, chỉ là dẫn sai chỗ.

Ngoài ra, nhịp release của Angular đã đổi kể từ v22 (nguồn: `adev/reference/releases.md`):

- major mỗi **12 tháng** (trước v22 là 6 tháng) → v23 rơi vào khoảng **06/2027**
- 4–6 minor mỗi major → v22.2 ~09/2026, v22.3 ~11/2026, v22.4 ~01/2027, v22.5 ~03/2027
- patch **gần như hàng tuần**
- vòng đời: 12 tháng active + 12 tháng LTS

Nghĩa là thứ đáng tự động hoá là **patch**, không phải major.

## Phương án đã cân nhắc

1. **Giữ nguyên ràng buộc "hai version phải bằng nhau", thêm CI ép nó** — thất bại có thể đoán
   trước: mỗi PR bump patch của Dependabot sẽ đỏ CI cho tới khi có người re-pin toàn bộ docs. Sau
   vài tuần bị chặn như vậy, cách phản ứng tự nhiên là tắt Dependabot. Ép chặt hơn ở đây tạo ra
   **ít** cập nhật hơn, không phải nhiều hơn.
2. **Bỏ hẳn permalink có số dòng, chỉ link tới file** — hết rot, nhưng mất đúng thứ làm tài liệu
   này khác các bài blog "giải thích signals" khác: trỏ thẳng vào 20 dòng đang bàn.
3. **Tách hai khái niệm version, và ép sự nhất quán của từng cái riêng** — `package.json` chạy
   nhanh theo patch (tự động), docs pin đi chậm và có chủ đích (thủ công, có công cụ kiểm anchor).

## Quyết định

Chọn phương án 3.

|                     | Ghim ở đâu                                         | Nhịp đổi     | Ai đổi                                 |
| ------------------- | -------------------------------------------------- | ------------ | -------------------------------------- |
| Version **runtime** | `package.json`                                     | mỗi patch    | Dependabot, hàng tuần                  |
| **Docs pin**        | [`docs/pinned-source.json`](../pinned-source.json) | khi có lý do | người, sau khi chạy `check:permalinks` |

Ba mảnh cơ khí đi kèm:

- **`npm run check:docs`** (`scripts/check-doc-versions.mjs`) — chạy trong CI. Ép docs **tự nhất
  quán** với `pinned-source.json`; cảnh báo mềm (không fail) khi docs pin tụt sau runtime. Chỉ
  kiểm những dạng tham chiếu không thể nhầm với văn xuôi kể chuyện version: SHA trong permalink,
  tag trong link `tree/`, SHA rút gọn dùng làm chữ hiển thị, và danh sách `stalePins` (các pin đã
  bỏ). Nhờ vậy [ADR 0003](./0003-cli-vs-core-version-pin.md) vẫn tự do nhắc tới `@angular/cli@22.x`
  hay Node `22.22.3` mà không bị báo nhầm.
- **`npm run check:permalinks`** (`scripts/check-permalinks.mjs`) — chạy **tay**, trong lúc nâng
  pin. Tải từng file ở SHA cũ và ở ref đích rồi so từng đoạn `#L...`, trả lời đúng một câu hỏi:
  _sed SHA có an toàn không?_ Cố ý không đưa vào CI: nó gọi mạng cho từng file, biến một job lint
  tất định thành một job flaky.
- **`.github/dependabot.yml`** — hai group tách riêng (framework `22.2.2` và tooling `22.2.2` chạy
  trên hai train version khác nhau; gộp một PR thì diff đọc như lỗi đánh máy), cộng hai `ignore`
  bắt buộc: major của `@angular/cli` (ADR 0003 cố ý giữ v21) và major của `typescript`
  (`@angular/compiler-cli@22` peer `>=6.0 <6.1`, mà TypeScript 7 đã ra). Thiếu hai dòng này thì
  mỗi tuần có hai PR đỏ vì lý do không liên quan đến code, và Dependabot mất uy tín.

Lần áp dụng đầu tiên (bump `22.1.1` → `22.1.5`) đã chạy đúng quy trình này: `check:permalinks` báo
**17/17 anchor còn trỏ đúng đoạn code cũ**, nên việc sed SHA là an toàn có bằng chứng, không phải
đoán.

## Đánh đổi chấp nhận

- Docs có thể nói về `v22.2.2` trong khi app đang chạy `22.2.9`. Đây là điều **cố ý**, và
  `README.md` cùng header của `signals-deep-dive.md` nói thẳng ra thay vì giấu đi. Cái mất là lời
  hứa "hai con số luôn bằng nhau"; cái được là cả hai đều thực sự được cập nhật.
- `pinned-source.json` là một khái niệm mới người đóng góp phải biết. Giảm nhẹ bằng mục
  **Upgrade checklist** trong [`CONTRIBUTING.md`](../../CONTRIBUTING.md) và bằng chính thông báo
  của `check:docs` khi nó fail.
- `check:permalinks` phụ thuộc mạng và phụ thuộc việc GitHub giữ nguyên đường dẫn raw. Chấp nhận
  được vì nó là công cụ chạy tay, không phải cổng chặn CI.
- Permalink trỏ về **chính repo này** (`repoSha` trong `pinned-source.json`) vẫn mục nhanh hơn:
  chúng gãy mỗi lần refactor `todo-store.ts`, chứ không chỉ khi nâng Angular. `check:docs` canh
  được việc chúng cùng trỏ về một SHA, nhưng **không** kiểm được số dòng còn đúng hay không —
  đó vẫn là việc phải nhớ khi refactor.
