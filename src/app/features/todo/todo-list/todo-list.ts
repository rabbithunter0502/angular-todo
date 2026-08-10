import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { TodoStore } from '../../../core/state/todo-store';
import { TodoItemComponent } from '../todo-item/todo-item';

/**
 * Container component: injects `TodoStore` directly (no `@Input` prop-drilling for the list
 * itself — only `TodoItemComponent` stays presentational). Because this `effect()` is created
 * inside a component's constructor, `effect()` finds a `ViewContext` via DI and wires it up as a
 * *view effect* rather than a *root effect* — it runs as part of this component's own
 * change-detection pass and is torn down automatically when the component is destroyed, with no
 * manual `EffectRef.destroy()` needed (compare with the root effects in `TodoStore`, which live
 * for the app's lifetime because they're created in a `providedIn: 'root'` service).
 *
 * This effect reacts to `TodoStore.completionEvents` rather than diffing `stats().completed`
 * across runs. An earlier version of this component *did* diff the aggregate count, and it broke
 * in an instructive way: `TodoStore`'s own `resource()`-hydration effect also changes
 * `stats().completed` (the seed data ships with one item already done), so a naive "did the
 * completed count go up?" check fired the toast on page load, not just on a real user toggle —
 * confirmed with a Playwright run before this was rewritten. Reacting to an explicit event signal
 * that only `toggleTodo()` ever writes to sidesteps the ambiguity entirely, and matches Angular's
 * own guidance: effects are for synchronizing with something outside the reactive graph (a toast
 * timer, in this case), not for re-deriving "what just happened" from state snapshots.
 */
@Component({
  selector: 'app-todo-list',
  imports: [TodoItemComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './todo-list.html',
  styleUrl: './todo-list.css',
})
export class TodoListComponent {
  protected readonly store = inject(TodoStore);
  protected readonly toast = signal<string | null>(null);

  constructor() {
    effect((onCleanup) => {
      if (this.store.completionEvents() === null) {
        return;
      }
      this.toast.set('✔ Đã hoàn tất một việc!');
      const timer = setTimeout(() => this.toast.set(null), 2000);
      // Runs before the *next* execution of this effect (or on destroy) — without it, rapidly
      // toggling two todos would leave stale timers racing to clear a toast that isn't theirs.
      onCleanup(() => clearTimeout(timer));
    });
  }
}
