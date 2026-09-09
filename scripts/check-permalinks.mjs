#!/usr/bin/env node
/**
 * Kiểm tra các anchor `#L...` trong permalink vào source Angular có còn trỏ đúng đoạn code cũ
 * hay không, TRƯỚC khi kéo `docs/pinned-source.json` lên version mới.
 *
 * Vì sao cần: đổi pin chỉ là `sed` một SHA thành SHA khác, và nó luôn "thành công" — link vẫn
 * mở được, vẫn ra file đúng. Nhưng số dòng trong `graph.ts`/`signal.ts` có thể đã dịch chuyển
 * giữa hai bản patch, và lúc đó `#L120-L207` trỏ vào một đoạn code hoàn toàn khác mà không có
 * gì báo. Đây là dạng rot tệ nhất trong repo này: docs vẫn *trông* đúng, chỉ là dẫn sai chỗ.
 *
 * Cách dùng:
 *   npm run check:permalinks              # so pin hiện tại với version runtime trong package.json
 *   npm run check:permalinks -- v22.2.0   # so pin hiện tại với một ref bất kỳ
 *
 * Chạy THỦ CÔNG trong lúc nâng pin, cố ý không đưa vào CI: nó gọi mạng ra GitHub cho từng file,
 * biến một job lint tất định thành một job flaky phụ thuộc mạng.
 *
 * Exit code: 1 nếu có anchor lệch (hoặc file bị đổi tên/xoá) — tức là cần đọc lại và sửa tay,
 * không được sed mù.
 */
import { readFileSync, globSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname;
const read = (p) => readFileSync(ROOT + p, 'utf8');

const pin = JSON.parse(read('docs/pinned-source.json'));
const runtime = JSON.parse(read('package.json')).dependencies['@angular/core'];
const target = process.argv[2] ?? `v${runtime}`;

if (target === pin.angularTag) {
  console.log(`Pin (${pin.angularTag}) đã bằng target (${target}) — không có gì để so.`);
  process.exit(0);
}

// ── Gom permalink có anchor dòng ────────────────────────────────────────────────────────────
const LINK = /github\.com\/angular\/angular\/blob\/([0-9a-f]{40})\/([^)#\s]+)#L(\d+)(?:-L(\d+))?/g;
/** @type {Map<string, Array<{from: string, start: number, end: number}>>} */
const byPath = new Map();

for (const file of globSync(['README.md', 'EXERCISES.md', 'CONTRIBUTING.md', 'docs/**/*.md'], {
  cwd: ROOT,
})) {
  read(file)
    .split('\n')
    .forEach((line, i) => {
      for (const [, sha, path, start, end] of line.matchAll(LINK)) {
        if (sha !== pin.angularSha) continue; // luật A của check-doc-versions lo việc này
        if (!byPath.has(path)) byPath.set(path, []);
        byPath.get(path).push({
          from: `${file}:${i + 1}`,
          start: Number(start),
          end: Number(end ?? start),
        });
      }
    });
}

if (byPath.size === 0) {
  console.log('Không tìm thấy permalink nào có anchor dòng.');
  process.exit(0);
}

// ── So từng anchor ở hai ref ────────────────────────────────────────────────────────────────
const raw = (ref, path) => `https://raw.githubusercontent.com/angular/angular/${ref}/${path}`;

async function fetchLines(ref, path) {
  const res = await fetch(raw(ref, path));
  if (!res.ok) return null;
  return (await res.text()).split('\n');
}

console.log(`So anchor: ${pin.angularTag} (${pin.angularSha.slice(0, 12)}…) → ${target}\n`);

let drifted = 0;
let checked = 0;

for (const [path, anchors] of [...byPath].sort()) {
  const [before, after] = await Promise.all([
    fetchLines(pin.angularSha, path),
    fetchLines(target, path),
  ]);

  if (!before) {
    console.error(`✗ ${path} — không đọc được ở pin hiện tại (${pin.angularSha.slice(0, 12)}…)`);
    drifted += anchors.length;
    continue;
  }
  if (!after) {
    console.error(`✗ ${path} — không tồn tại ở ${target} (bị đổi tên/xoá?)`);
    for (const a of anchors) console.error(`    ${a.from}  #L${a.start}-L${a.end}`);
    drifted += anchors.length;
    continue;
  }

  for (const a of anchors) {
    checked++;
    const slice = (lines) => lines.slice(a.start - 1, a.end).join('\n');
    const anchor = `#L${a.start}${a.end !== a.start ? `-L${a.end}` : ''}`;

    if (slice(before) === slice(after)) {
      console.log(`  ✓ ${path}${anchor}`);
    } else {
      drifted++;
      const head = slice(after).split('\n')[0]?.trim().slice(0, 72) ?? '';
      console.error(`  ✗ ${path}${anchor}  (${a.from})`);
      console.error(`      ở ${target}, dòng ${a.start} là: ${head || '(dòng trống)'}`);
    }
  }
}

console.log(`\n${checked - drifted}/${checked} anchor còn trỏ đúng đoạn code cũ.`);

if (drifted > 0) {
  console.error(
    `\n✗ ${drifted} anchor đã lệch. ĐỪNG sed SHA — mở từng link ở ${target}, tìm lại đúng đoạn,\n` +
      `  sửa số dòng, rồi mới cập nhật docs/pinned-source.json.`,
  );
  process.exit(1);
}

console.log(`\n✓ An toàn để nâng pin lên ${target}: sed SHA + cập nhật docs/pinned-source.json.`);
