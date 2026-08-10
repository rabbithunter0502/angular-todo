# 0001 — Zoneless + Signals thay vì Zone.js

## Bối cảnh

App cần một cơ chế change-detection: biết khi nào state đổi để re-render đúng phần UI liên quan.
Angular truyền thống làm việc này bằng Zone.js — monkey-patch `setTimeout`/`addEventListener`/
Promise để "đoán" mọi chỗ có thể có thay đổi, rồi chạy change-detection cho toàn bộ cây component
sau mỗi sự kiện đó. Từ Angular v18+, `provideZonelessChangeDetection()` cho phép bỏ hẳn Zone.js và
dựa hoàn toàn vào signal làm cơ chế thông báo.

## Phương án đã cân nhắc

1. **Zone.js (mặc định lịch sử)** — change-detection chạy trên toàn cây mỗi khi có sự kiện DOM,
   timer, hay Promise resolve, bất kể sự kiện đó có liên quan đến phần UI nào hay không. Chi phí
   tăng theo kích thước cây component, không theo lượng state thực sự đổi. `zone.js` cũng là một
   dependency runtime nặng (monkey-patch toàn cục), khó debug khi stack trace đi qua patched APIs.
2. **Zoneless + Signals** — mỗi write vào signal chỉ đánh dấu dirty đúng những consumer thực sự đọc
   nó (`producerNotifyConsumers` — xem [`docs/signals-deep-dive.md` §8](../signals-deep-dive.md)).
   Không cần Zone.js patch bất cứ API nào; Angular tự lên lịch tick dựa trên `ApplicationRef` khi
   có signal live-consumer nào dirty.

## Quyết định

Chọn zoneless + Signals. App khởi tạo bằng `ng new` schematic hiện tại của Angular v22, vốn không
thêm `zone.js` vào `package.json` nữa — nghĩa là đây không phải một lựa chọn "bật thêm", mà là
baseline mặc định của tooling hiện tại. `provideZonelessChangeDetection()` được khai báo tường
minh trong `app.config.ts` để xác nhận ý định và để Angular cảnh báo dev-mode nếu `zone.js` lỡ bị
kéo vào qua một dependency khác.

## Đánh đổi chấp nhận

- Mọi state phải thực sự đi qua signal (`signal`/`computed`/`input`/`model`...) để được track —
  gán trực tiếp vào một biến class thường (không phải signal) và mong UI tự cập nhật sẽ **im lặng
  không hoạt động**, không có exception hay warning báo lỗi.
- Thư viện bên thứ ba còn phụ thuộc `NgZone.run()` để trigger re-render (thay vì binding qua
  signal/template) có thể không tự cập nhật UI đúng như khi chạy với Zone.js — cần kiểm tra
  compatibility trước khi thêm dependency UI mới vào dự án production thật (ngoài phạm vi demo
  này).
