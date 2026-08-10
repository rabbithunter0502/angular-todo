# 0003 — Ghim `@angular/cli@^21` trong khi framework là `22.1.1`

## Bối cảnh

`package.json` của repo này khai báo `@angular/cli@^21.2.20` trong khi mọi package framework
(`@angular/core`, `common`, `compiler`, `platform-browser`, `compiler-cli`, `@angular/build`) đều
ghim đúng `22.1.1`. Nhìn thoáng qua trông như nhầm lẫn version — không phải.

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
   > =24`) làm công cụ chạy lệnh, giữ nguyên mọi package framework ở `22.1.1`.

Phương án 3 hợp lệ về mặt kỹ thuật vì `@angular/build` chỉ tự kiểm tra _tương thích với
`@angular/core`_ (`assertCompatibleAngularVersion` trong `@angular/build/src/utils/version.js`, so
`@angular/core/package.json` với range hỗ trợ), không kiểm tra lại Node version của riêng nó —
guard Node chỉ nằm ở `ng.js` của CLI, không nằm ở `@angular/build`.

## Quyết định

Chọn phương án 3. Kết quả: build, test, serve đều chạy bằng đúng runtime `@angular/core@22.1.1`,
chỉ mượn "vỏ" điều phối lệnh (`ng build`, `ng test`, `ng serve`) từ CLI 21.

## Đánh đổi chấp nhận

- `ng update`/`ng generate` chạy qua CLI 21 có thể thiếu vài schematic/flag mới chỉ có ở CLI 22 —
  chưa gặp vấn đề thực tế nào trong phạm vi demo này, nhưng là rủi ro cần biết trước khi mở rộng.
- Đây là một giải pháp **tạm thời cho môi trường build cụ thể**, không phải khuyến nghị chung: nếu
  môi trường của bạn có Node ≥ 22.22.3, ghim luôn `@angular/cli@^22` là đủ và đơn giản hơn quyết
  định này — không cần lặp lại cách làm ở đây trừ khi gặp đúng giới hạn Node tương tự.
