# 0003 — Ghim `@angular/cli@^21` trong khi framework là `22.2.2`

## Bối cảnh

`package.json` của repo này khai báo `@angular/cli@^21.2.20` trong khi mọi package framework
(`@angular/core`, `common`, `compiler`, `platform-browser`, `compiler-cli`, `@angular/build`) đều
ghim đúng `22.2.2`. Nhìn thoáng qua trông như nhầm lẫn version — không phải.

Môi trường build container đi kèm Node `v22.22.2`. `@angular/cli@22.x` (và `@angular/build@22.x`)
tự kiểm tra Node version lúc khởi động và **từ chối chạy** nếu thấp hơn `22.22.3` — đọc trực tiếp
từ `node_modules/@angular/cli/bin/ng.js` khi thử scaffold bằng CLI 22 thật. Đây không phải giới
hạn của framework Angular (`@angular/core`), chỉ là guard cứng trong binary `ng`.

## Phương án đã cân nhắc

1. **Nâng Node lên ≥ 22.22.3** để dùng `@angular/cli@^22` đồng bộ với framework — không khả thi
   trong môi trường container cụ thể đang build repo này (Node version cố định ở mức container
   cung cấp).
2. **Hạ toàn bộ framework xuống một version tương thích CLI 21** — mất quyền dùng các API v22
   (`resource()` ổn định từ `@publicApi 22.0` — xem
   [`docs/signals-deep-dive.md` §7](../signals-deep-dive.md)), đi ngược mục tiêu demo là dùng
   Angular v22 thật.
3. **Ghim `@angular/cli@^21.2.20`** (thoả điều kiện Node của CLI 21: `^20.19.0 || ^22.12.0 ||
   > =24`) làm công cụ chạy lệnh, giữ nguyên mọi package framework ở `22.2.2`.

Phương án 3 hợp lệ về mặt kỹ thuật vì `@angular/build` chỉ tự kiểm tra _tương thích với
`@angular/core`_ (`assertCompatibleAngularVersion` trong `@angular/build/src/utils/version.js`, so
`@angular/core/package.json` với range hỗ trợ), không kiểm tra lại Node version của riêng nó —
guard Node chỉ nằm ở `ng.js` của CLI, không nằm ở `@angular/build`.

## Quyết định

Chọn phương án 3. Kết quả: build, test, serve đều chạy bằng đúng runtime `@angular/core@22.2.2`,
chỉ mượn "vỏ" điều phối lệnh (`ng build`, `ng test`, `ng serve`) từ CLI 21.

## Ràng buộc này hẹp hơn vẻ ngoài của nó (bổ sung)

Kiểm lại con số cụ thể: container build chạy Node **`v22.22.2`**, CLI 22 yêu cầu
`^22.22.3 || ^24.15.0 || >=26.0.0`. Thiếu **đúng một bản patch**.

Trong khi đó Node 22 mới nhất là **`v22.23.2`** — thoả điều kiện. Và CI của repo này khai báo
`node-version: '22'` (`.github/workflows/pipeline.yml`), tức là runner nhận bản 22 mới nhất và
**đã đủ điều kiện chạy CLI 22 từ lâu**.

Nói cách khác: đây không phải một quyết định kiến trúc dài hạn, mà là di sản của **một** máy thấp
hơn ngưỡng 0.0.1 phiên bản. Nó sẽ tự biến mất khi image container được cập nhật. Ai đọc ADR này
mà không gặp đúng ràng buộc Node đó thì **không nên** lặp lại cách làm ở đây — ghim
`@angular/cli@^22` cho khớp framework là xong.

Một điểm nữa nên biết: `@angular/build@22` cũng khai báo `engines.node` y hệt (`^22.22.3 || ...`),
và repo này vẫn đang chạy nó trên `v22.22.2`. npm coi `engines` là khuyến nghị (chỉ cảnh báo, trừ
khi bật `engine-strict`), nên điều đó hợp lệ — guard cứng duy nhất nằm ở `ng.js` của CLI. Tức là
setup hiện tại đang cố ý sống chung với một cảnh báo `engines` bị bỏ qua.

`package.json` khai báo `engines.node: "^22.22.0 || >=24.13.0"` và `.nvmrc` ghi `22` để người đóng
góp mới rơi vào đúng vùng đã kiểm chứng.

## Đánh đổi chấp nhận

- `ng update`/`ng generate` chạy qua CLI 21 có thể thiếu vài schematic/flag mới chỉ có ở CLI 22 —
  là rủi ro cần biết trước khi mở rộng. **Đã có một điểm dữ liệu thực tế:** schematic
  `service-migration` của `@angular/core@22.2.2` chạy trót lọt qua `@angular/cli@21.2.23`
  (xem [ADR 0006](./0006-service-decorator.md)). Một mẫu không chứng minh được điều gì tổng quát,
  nhưng ít nhất rủi ro này chưa hiện thực hoá.
- Vì CLI 21 đã rời **active support** từ 2026-06-03 (nay chỉ còn nhận critical fix và security
  patch cho tới ~06/2027), toolchain của repo đang nằm trên một nhánh chỉ được vá tối thiểu. Chưa
  ảnh hưởng gì, nhưng đây là cái đồng hồ đếm ngược thật của ADR này — xem
  [ADR 0007](./0007-version-upgrade-policy.md).
- Đây là một giải pháp **tạm thời cho môi trường build cụ thể**, không phải khuyến nghị chung: nếu
  môi trường của bạn có Node ≥ 22.22.3, ghim luôn `@angular/cli@^22` là đủ và đơn giản hơn quyết
  định này — không cần lặp lại cách làm ở đây trừ khi gặp đúng giới hạn Node tương tự.
