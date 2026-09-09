import { Component, signal } from '@angular/core';
import { DocsViewerComponent, hashPointsAtDocs } from './features/docs/docs-viewer/docs-viewer';
import { TodoShellComponent } from './features/todo/todo-shell/todo-shell';

type AppView = 'todo' | 'docs';

/**
 * Không component nào trong repo này khai báo `changeDetection` — và đó là chủ đích, không phải
 * bỏ sót. Từ v22, component không set `changeDetection` mặc định là `OnPush` (breaking change
 * của v22.0: "Component with undefined `changeDetection` property are now `OnPush` by default";
 * muốn hành vi cũ phải viết rõ `ChangeDetectionStrategy.Eager`). Giữ lại dòng
 * `changeDetection: ChangeDetectionStrategy.OnPush` ở mỗi component chỉ là boilerplate thời v21
 * — và trong một repo lấy "đây là Angular hiện tại trông như thế nào" làm luận điểm chính, nó dạy
 * sai. Xem [ADR 0005](../../docs/adr/0005-onpush-mac-dinh-v22.md).
 */
@Component({
  selector: 'app-root',
  imports: [TodoShellComponent, DocsViewerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  // Whoever opens a `#/docs/...` link (shared from the docs viewer itself, see its own
  // `location.hash` sync) should land straight on the Docs tab, not the todo app.
  protected readonly view = signal<AppView>(hashPointsAtDocs() ? 'docs' : 'todo');

  protected showTodo(): void {
    this.view.set('todo');
    // Otherwise a stale `#/docs/...` (left behind by `DocsViewerComponent`'s own hash sync)
    // would reopen the Docs tab on the next reload even though Todo is what's showing now.
    history.replaceState(null, '', location.pathname + location.search);
  }

  protected showDocs(): void {
    this.view.set('docs');
  }
}
