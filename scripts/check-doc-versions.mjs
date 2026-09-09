#!/usr/bin/env node
/**
 * Bắt "pin đã cũ" trong docs — thứ luôn mục ra trong im lặng vì không có gì compile nó.
 *
 * Repo này ghim HAI version tách biệt, cố ý (xem `docs/adr/0007-version-upgrade-policy.md`):
 *
 *   1. Version RUNTIME  — `package.json`, chạy theo patch mới nhất, Dependabot bump hàng tuần.
 *   2. Version DOCS PIN — `docs/pinned-source.json`, chỉ đổi khi có người kiểm tra lại anchor
 *      `#L...` trong từng permalink (xem `npm run check:permalinks`).
 *
 * Script này KHÔNG ép hai cái đó bằng nhau — ép là cách chắc chắn nhất để mọi PR bump patch đỏ
 * CI, và rồi không ai bump nữa. Nó chỉ đảm bảo docs **tự nhất quán** với (2), và cảnh báo mềm
 * khi (2) tụt lại sau (1).
 *
 * Ba luật, chọn riêng vì cả ba đều KHÔNG THỂ false-positive trên văn xuôi kể chuyện version
 * (ADR 0003 nhắc tới `@angular/cli@22.x`, Node `22.22.3`... mà không hề nói về pin):
 *
 *   A. Mọi permalink `angular/angular/blob/<sha>` phải đúng `angularSha`.
 *   B. Mọi permalink `angular/angular/tree/<ref>` phải đúng `angularTag`; permalink về chính repo
 *      này phải đúng `repoSha`.
 *   C. Không file nào được còn chứa chuỗi trong `stalePins` — danh sách các pin ĐÃ bỏ.
 *
 * Exit code: 1 nếu vi phạm A/B/C. Cảnh báo drift (2) vs (1) không làm fail — nó là việc cần lên
 * lịch, không phải lỗi build.
 */
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(ROOT + p, 'utf8');

const pin = JSON.parse(read('docs/pinned-source.json'));
const runtime = JSON.parse(read('package.json')).dependencies['@angular/core'];

// `docs-registry.ts` nằm trong danh sách vì nó cũng nhắc tới pin (mô tả của ADR 0003 hiện trong
// sidebar tài liệu) — là source chứ không phải markdown, nên không có gì khác canh nó.
const FILES = globSync(
  [
    'README.md',
    'EXERCISES.md',
    'CONTRIBUTING.md',
    'docs/**/*.md',
    'src/app/core/data/docs-registry.ts',
  ],
  { cwd: ROOT },
);

const problems = [];

for (const file of FILES.sort()) {
  const lines = read(file).split('\n');

  lines.forEach((line, i) => {
    const at = `${file}:${i + 1}`;

    // A — SHA của permalink vào source Angular. Bắt cả `/commit/` chứ không chỉ `/blob/`: header
    // của signals-deep-dive.md trỏ tới commit chứ không tới file.
    for (const m of line.matchAll(
      /github\.com\/angular\/angular\/(?:blob|commit)\/([0-9a-f]{7,40})/g,
    )) {
      if (!pin.angularSha.startsWith(m[1])) {
        problems.push(
          `${at}  permalink Angular trỏ ${m[1].slice(0, 12)}…, pin là ${pin.angularSha.slice(0, 12)}…`,
        );
      }
    }

    // A' — SHA rút gọn dùng làm *chữ hiển thị* của link. Đây là chỗ `sed` luôn bỏ sót: URL đổi
    // sang SHA mới nhưng text trong ngoặc vuông vẫn là SHA cũ, và link trông vẫn hoàn toàn bình
    // thường. Chỉ soi text dạng `` `abcdef1` `` (7–12 hex trong backtick) để không đụng văn xuôi.
    for (const m of line.matchAll(/`([0-9a-f]{7,12})`/g)) {
      const looksLikeThisRepo = pin.repoSha.startsWith(m[1]);
      const looksLikeAngular = pin.angularSha.startsWith(m[1]);
      if (!looksLikeThisRepo && !looksLikeAngular) {
        problems.push(
          `${at}  SHA rút gọn \`${m[1]}\` không khớp pin nào ` +
            `(Angular ${pin.angularSha.slice(0, 7)}, repo ${pin.repoSha.slice(0, 7)})`,
        );
      }
    }

    // B — tag của link `tree/`, và SHA của permalink về chính repo này.
    for (const m of line.matchAll(/github\.com\/angular\/angular\/tree\/([^)\s/]+)/g)) {
      if (m[1] !== pin.angularTag) {
        problems.push(`${at}  link tree/ trỏ ${m[1]}, pin là ${pin.angularTag}`);
      }
    }
    for (const m of line.matchAll(
      /github\.com\/rabbithunter0502\/angular-todo\/(?:blob|commit)\/([0-9a-f]{7,40})/g,
    )) {
      if (!pin.repoSha.startsWith(m[1])) {
        problems.push(
          `${at}  permalink repo trỏ ${m[1].slice(0, 12)}…, pin là ${pin.repoSha.slice(0, 12)}…`,
        );
      }
    }

    // C — tàn dư của pin cũ. Trừ những file mà việc *kể lại lịch sử pin* chính là nội dung của
    // chúng (ADR 0007 dẫn nguyên hai SHA cũ/mới để giải thích chi phí của một lần nâng pin).
    // Miễn trừ khai báo tường minh trong pinned-source.json, không đoán bằng regex.
    if (!(pin.stalePinsAllowedIn ?? []).includes(file)) {
      for (const stale of pin.stalePins ?? []) {
        if (line.includes(stale)) {
          problems.push(`${at}  còn nhắc pin cũ "${stale}" → phải là "${pin.angularVersion}"`);
        }
      }
    }
  });
}

if (problems.length > 0) {
  console.error(`✗ ${problems.length} tham chiếu version/permalink đã cũ:\n`);
  for (const p of problems) console.error(`  ${p}`);
  console.error(`\nSửa: xem mục "Upgrade checklist" trong CONTRIBUTING.md.`);
  process.exit(1);
}

console.log(`✓ docs nhất quán với pin ${pin.angularVersion} (${pin.angularSha.slice(0, 12)}…)`);

// Drift mềm — có chủ đích KHÔNG fail. Docs pin được phép tụt sau runtime.
if (pin.angularVersion !== runtime) {
  console.log(
    `\n⚠ docs pin (${pin.angularVersion}) đang tụt sau runtime (@angular/core@${runtime}).\n` +
      `  Không phải lỗi — nhưng khi muốn kéo pin lên, chạy:\n\n` +
      `    npm run check:permalinks -- v${runtime}   # kiểm tra anchor #L... còn trỏ đúng chỗ\n` +
      `    # rồi cập nhật docs/pinned-source.json + sed theo CONTRIBUTING.md\n`,
  );
}
