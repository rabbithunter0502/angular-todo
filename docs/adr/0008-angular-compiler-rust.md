# 0008 — Compiler Angular viết bằng Rust: theo dõi, chưa áp dụng

## Bối cảnh

Khi nâng repo lên `22.2.2` (bản mới nhất lúc viết, 2026-10), câu hỏi tự nhiên là: _compiler Rust của
Angular có dùng được chưa?_ Cần tách bạch **hai** dự án khác nhau, hay bị gộp làm một trong các
bài viết:

|                            | Ai làm                                             | Cách tiếp cận                                                                                    | Trạng thái (theo nguồn)                                        |
| -------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| **Oxc Angular Compiler**   | VoidZero (nhóm Vite/Oxc), công bố 2026-04-10       | Viết lại bước compile **từng file** hoàn toàn bằng Rust (NAPI-RS), phát hành dạng Vite plugin    | Thử nghiệm; README ghi rõ "đang tìm maintainer"                |
| **Hướng của Angular team** | Angular team (Alex Rickabaugh phát biểu công khai) | **Hybrid**: dùng `oxc` (Rust) thay _frontend_ của compiler; nối với _backend_ TypeScript hiện có | Đang thử nghiệm nội bộ, **chưa có API công khai** trong 22.2.x |

Chi tiết từng bên, theo các nguồn đã đọc:

- **Oxc Angular Compiler** (`@oxc-angular/vite`): README liệt kê template, directive, pipe,
  injectable, NgModule; style encapsulation Emulated/None/ShadowDom; trích xuất i18n (XLIFF 1.2/2.0,
  XMB, XTB); HMR cho template và style. Benchmark do chính VoidZero công bố: nhanh hơn Angular CLI
  khoảng 6.4 lần (codebase Super Productivity) và 20.7 lần so với webpack +
  `@ngtools/webpack` (cold production build của Bitwarden, 4.55s so với 1m34s) — đo trên **một máy**,
  nên chỉ mang tính tham khảo. Option `angularVersion` trong README chỉ nhắc tới Angular **19–21**;
  không có ma trận hỗ trợ cho v22. Yêu cầu Node `20.19+`/`22.12+` và Vite `6+`.
- **Hướng của Angular team**: chiến lược "hybrid" nói trên, gắn với việc thử `tsgo`
  (TypeScript 7 viết bằng Go). Mục tiêu dài hạn là thay cả chuỗi compile bằng code native, nhưng
  phần template pipeline viết bằng TypeScript cần nhiều thời gian hơn nên chưa nằm trong bước đầu.
- **Trong `22.2.0` → `22.2.2`**: `CHANGELOG.md` của Angular **không có** dòng nào nhắc tới Rust hay
  `oxc`. Các `feat` liên quan tới compiler ở 22.2 vẫn là TypeScript: cho phép template truy cập
  thành viên `private`, option `strictUnclaimedEventNames`, type-check phạm vi hẹp hơn cho
  `@defer` có key, và CSS lồng nhau được scope đúng.

> **Chưa kiểm chứng được:** `angular.dev`, `voidzero.dev` và `infoq.com` không truy cập được từ môi
> trường viết ADR này. Phần Oxc dựa trên README GitHub; phần hướng của Angular team dựa trên bài
> đăng công khai của thành viên team và tóm tắt tìm kiếm. Tên gọi nội bộ "Angular Preprocessor
> (ngp)" chỉ xuất hiện ở nguồn thứ cấp. Trước khi trích dẫn ADR này ở nơi khác, hãy đối chiếu lại
> với blog chính thức của Angular.

Điểm ràng buộc cụ thể của **repo này**:

- Build đi qua `@angular/build:application` (esbuild), không phải Vite plugin tự cấu hình — xem
  `angular.json`. Oxc Angular Compiler không cắm vào được builder này.
- Test chạy qua `@angular/build:unit-test` (vitest); type-check chạy bằng `tsc` với
  `@angular/compiler-cli`, mà bản `22.2.2` peer `typescript >=6.0 <6.1`.
- Toàn bộ app dùng API mới của v22 (`@Service()`, `resource()`, `linkedSignal` với `set`,
  zoneless) — những thứ mà một compiler bên thứ ba ghi "hỗ trợ 19–21" chưa chắc xử lý đúng.

## Phương án đã cân nhắc

1. **Thử `@oxc-angular/vite` ngay** — loại. Dự án tự nhận là thử nghiệm, tìm maintainer, không
   công bố hỗ trợ v22, và buộc phải bỏ `@angular/build`. Mà `@angular/build` lại là thứ chạy cả
   build, test lẫn dev-server ở đây, nên đổi nó là đổi toàn bộ toolchain chứ không phải thêm một
   tối ưu hoá.
2. **Chạy song song trong một nhánh thử nghiệm, chỉ để đo** — hợp lý về lâu dài, nhưng app này
   chỉ bundle ~222 kB (build thật: `main` 222.04 kB raw / 64.21 kB transfer), build mất vài giây.
   Con số "nhanh hơn 20 lần" trên codebase khổng lồ **không chuyển được** sang một app cỡ này, nên
   đo ở đây sẽ không cho tín hiệu có nghĩa.
3. **Không làm gì, cũng không ghi lại** — loại. Mất đúng thứ repo này tồn tại để giữ: lý do _vì
   sao_ chưa theo một xu hướng lớn.

## Quyết định

Chọn **không áp dụng, có ghi lại và có điều kiện xem lại**. `package.json` giữ nguyên toolchain
chính thức (`@angular/build`, `@angular/compiler-cli`). ADR này là bản ghi để lần sau không phải
điều tra lại từ đầu.

Xem lại ADR này khi **một trong** các điều kiện sau xảy ra:

- Changelog Angular xuất hiện `feat` nhắc tới `oxc`, native hay Rust cho `compiler-cli`
  (kiểm bằng lệnh `grep -i 'oxc\|rust\|native'` trên `CHANGELOG.md` ở bước "Mỗi minor" của
  [`CONTRIBUTING.md`](../../CONTRIBUTING.md)).
- `@angular/build` hoặc `@angular/cli` công bố tuỳ chọn builder dùng compiler native.
- `@angular/compiler-cli` đổi dải peer `typescript` để nhận TypeScript 7 — khi đó chặn `typescript`
  major trong `.github/dependabot.yml` cũng phải gỡ ([ADR 0007](./0007-version-upgrade-policy.md)).
- Một compiler Rust bên thứ ba công bố hỗ trợ Angular 22 trở lên **và** có maintainer.

## Đánh đổi chấp nhận

- Không hưởng được tốc độ build của compiler Rust. Với app ~222 kB và build vài giây, thiệt hại
  thực tế gần như bằng không; nó sẽ lớn dần theo kích thước codebase, không phải ở quy mô này.
- Phần "hướng của Angular team" có thể thay đổi nhanh. ADR này là ảnh chụp tại 22.2.2, và
  checklist mỗi minor ở `CONTRIBUTING.md` là cơ chế canh nó chứ không phải trí nhớ của người đọc.
- Một số dữ kiện (xem khối "Chưa kiểm chứng") dựa trên nguồn thứ cấp; chấp nhận có ý thức vì ADR
  này không dẫn tới thay đổi code, chỉ dẫn tới một quyết định chưa làm.
