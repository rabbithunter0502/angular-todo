/**
 * A single todo item.
 *
 * `id` and `createdAt` are `readonly` at the type level: once a todo is created neither
 * should be reassigned — updates always go through `TodoStore`, which replaces the whole
 * object (`{ ...todo, completed: true }`) rather than mutating it in place. Signals compare
 * by reference (see `defaultEquals` in Angular's `equality.ts`), so in-place mutation of an
 * object held by a signal would silently fail to notify consumers.
 */
export interface Todo {
  readonly id: string;
  readonly createdAt: number;
  title: string;
  completed: boolean;
}

export type TodoFilter = 'all' | 'active' | 'completed';
