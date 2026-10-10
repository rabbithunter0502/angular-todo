# 0006 — `@Service()` thay `@Injectable({ providedIn: 'root' })`

## Bối cảnh

`TodoStore` là service duy nhất của repo, trước đây khai báo bằng cách kinh điển:

```ts
@Injectable({ providedIn: 'root' })
export class TodoStore {
  /* ... */
}
```

Angular v22.0 giới thiệu decorator `@Service` (`feat: introduce @Service decorator`) kèm một
migration chính chủ (`ng generate @angular/core:service-migration` — _"Converts @Injectable to
@Service where applicable"_). Chữ ký của nó:

```ts
interface Service {
  autoProvided?: boolean; // mặc định true
  factory?: () => unknown;
}
```

`autoProvided: true` (mặc định) chính là hành vi của `providedIn: 'root'`: service tự có mặt trong
root injector, không cần khai báo lại trong bất kỳ `providers` nào. Muốn ngược lại — tự tay đưa
vào một `providers` list — thì `@Service({ autoProvided: false })`.

Nói cách khác: `providedIn: 'root'` là thứ ~95% service thực tế đều viết, và v22 biến nó thành mặc
định thay vì một tham số phải lặp lại ở mọi file.

## Phương án đã cân nhắc

1. **Giữ `@Injectable({ providedIn: 'root' })`** — vẫn chạy tốt, chưa deprecated, và quen mắt với
   mọi người đã dùng Angular từ trước. Nhưng repo này tồn tại để cho thấy Angular v22 hiện tại
   trông ra sao; giữ dạng cũ là bỏ qua đúng thứ đáng chỉ ra.
2. **Đổi tay** — chỉ vài ký tự, nhưng bỏ lỡ cơ hội kiểm chứng một rủi ro đã ghi trong
   [ADR 0003](./0003-cli-vs-core-version-pin.md): _"`ng generate` chạy qua CLI 21 có thể thiếu vài
   schematic/flag mới chỉ có ở CLI 22 — chưa gặp vấn đề thực tế nào, nhưng là rủi ro cần biết"_.
3. **Đổi bằng chính migration của Angular** — vừa ra kết quả đúng, vừa là một phép thử thật cho
   rủi ro nói trên.

## Quyết định

Chọn phương án 3:

```bash
npx ng generate @angular/core:service-migration
# UPDATE src/app/core/state/todo-store.ts
```

**Kết quả đáng ghi lại cho ADR 0003:** schematic của `@angular/core@22.2.2` chạy trót lọt qua
`@angular/cli@21.2.23`, đổi đúng cả decorator lẫn import. Rủi ro "CLI 21 không chạy được schematic
của core 22" là có thật về mặt lý thuyết nhưng **chưa hiện thực hoá** ở trường hợp cụ thể này —
đúng như ADR 0003 dự đoán, và giờ đã có một điểm dữ liệu thay vì chỉ là phỏng đoán.

(Migration đặt `Service` xuống cuối danh sách import; đã sắp lại tay cho khớp quy ước của file —
tên viết hoa trước, rồi tới các hàm chữ thường theo alphabet.)

## Đánh đổi chấp nhận

- `@Service` mới có từ v22, nên mọi ví dụ, câu trả lời StackOverflow và bài blog Angular hiện có
  trên mạng đều đang viết `@Injectable`. Người đọc repo này sẽ thấy một dạng chưa phổ biến —
  đổi lại, đó chính là điều đáng học, và docstring của `TodoStore` giải thích tại chỗ.
- Nếu có lúc cần hạ version framework xuống < 22 (không nằm trong kế hoạch), đây là một trong
  những chỗ phải sửa ngược lại.
- `@Injectable` **không** bị deprecated — đây là lựa chọn theo hướng "dùng API mới nhất cho mục
  đích giảng dạy", không phải một bản vá bắt buộc. Project production đang chạy ổn không có lý do
  gấp nào để đổi theo.
