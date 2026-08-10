import { Component, signal } from '@angular/core';
import { DocsViewerComponent, hashPointsAtDocs } from './features/docs/docs-viewer/docs-viewer';
import { TodoShellComponent } from './features/todo/todo-shell/todo-shell';

type AppView = 'todo' | 'docs';

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
