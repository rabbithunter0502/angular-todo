import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface TodoStats {
  readonly total: number;
  readonly completed: number;
  readonly remaining: number;
}

/**
 * Dumb/presentational component: every input is a `Signal`-backed `input()`, there's no local
 * state and no injected store. `stats` is a `computed()`, which is lazy about *recomputing*
 * (`producerUpdateValueVersion` skips the body entirely while its producers — `_todos` — haven't
 * changed) but not lazy about *equality*: it returns a fresh object literal every time it does
 * recompute, and `computed`'s default `equal` is `Object.is`, so two structurally-identical
 * `{ total, completed, remaining }` objects still count as "changed" and this input still
 * re-renders. That's fine here (todos changing is exactly when stats should redraw); if this
 * were hotter code, `computed(..., { equal: (a, b) => a.total === b.total && ... })` would let
 * `computed` suppress the version bump — and this OnPush input — when the numbers coincide.
 */
@Component({
  selector: 'app-todo-stats',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './todo-stats.html',
  styleUrl: './todo-stats.css',
})
export class TodoStatsComponent {
  readonly stats = input.required<TodoStats>();
  readonly isSeeding = input(false);
}
