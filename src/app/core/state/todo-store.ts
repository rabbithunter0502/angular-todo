import {
  Injectable,
  computed,
  effect,
  linkedSignal,
  resource,
  signal,
  untracked,
} from '@angular/core';
import { fetchInitialTodos } from '../data/todo-api';
import { Todo, TodoFilter } from '../models/todo.model';

const STORAGE_KEY = 'angular-todo::v1';

/**
 * Single source of truth for the todo feature, built entirely from Angular's signal primitives —
 * no NgRx/Akita, no RxJS `BehaviorSubject`. This is the "service with signals" pattern from the
 * Angular style guide: components inject this and only ever read `Signal`s (never the private
 * `WritableSignal`s), so every write funnels through the methods below.
 */
@Injectable({ providedIn: 'root' })
export class TodoStore {
  // ── Source signals ────────────────────────────────────────────────────────────────────────
  // These are the only "producers" that don't derive from something else. Every other signal in
  // this store is a `computed`/`linkedSignal` built on top of them.
  private readonly _todos = signal<Todo[]>(this.readCache());
  private readonly _filter = signal<TodoFilter>('all');
  private readonly _editingId = signal<string | null>(null);
  // Not "state" in the usual sense — nothing ever reads its current value as a fact about the
  // world, only its *changes*. See `toggleTodo()` and `TodoListComponent`'s toast effect.
  private readonly _completionEvents = signal<{ id: string; at: number } | null>(null);

  readonly todos = this._todos.asReadonly();
  readonly filter = this._filter.asReadonly();
  readonly editingId = this._editingId.asReadonly();
  readonly completionEvents = this._completionEvents.asReadonly();

  // ── resource(): reactive, cancellable async loading ─────────────────────────────────────────
  // `resource()` re-runs `loader` whenever the signals read inside `params` change (there are
  // none here, so it runs exactly once — see `guide/signals/resource`). It exposes `status`,
  // `value`, `error` and `isLoading` as plain signals, so the rest of the graph can just read
  // them like any other producer.
  private readonly seed = resource({
    loader: ({ abortSignal }) => fetchInitialTodos(abortSignal),
    defaultValue: [] as Todo[],
  });

  readonly isSeeding = this.seed.isLoading;

  // ── computed(): pure derivations, memoized and lazily recomputed ───────────────────────────
  // `computed` never runs eagerly on write. A source signal.set() only flips a `dirty` bit on
  // live consumers (`producerNotifyConsumers` in graph.ts); the derivation body only actually
  // re-executes the next time something *reads* the computed, in `producerUpdateValueVersion`.
  readonly filteredTodos = computed(() => {
    const todos = this._todos();
    switch (this._filter()) {
      case 'active':
        return todos.filter((todo) => !todo.completed);
      case 'completed':
        return todos.filter((todo) => todo.completed);
      case 'all':
        return todos;
    }
  });

  readonly stats = computed(() => {
    const todos = this._todos();
    const completed = todos.filter((todo) => todo.completed).length;
    return { total: todos.length, completed, remaining: todos.length - completed };
  });

  readonly allDone = computed(() => this.stats().total > 0 && this.stats().remaining === 0);

  // ── linkedSignal(): writable state that resets itself when its source changes ──────────────
  // The edit textbox needs to be *writable* (the user types into it) but also needs to snap back
  // to the todo's current title every time `editingId` points at a different todo. A plain
  // `computed` can't be written to; a plain `signal` wouldn't know when to reset. `linkedSignal`
  // is exactly this: `computation` re-derives the value whenever `source` changes, but between
  // those resets the signal behaves like a normal `WritableSignal`.
  readonly draftTitle = linkedSignal<string | null, string>({
    source: this._editingId,
    computation: (editingId, previous) => {
      if (editingId === null) {
        return '';
      }
      // `previous` is the linkedSignal's own value before this recomputation, which we only
      // want as a fallback if the todo already disappeared (e.g. removed while being edited).
      return this._todos().find((todo) => todo.id === editingId)?.title ?? previous?.value ?? '';
    },
  });

  constructor() {
    // ── effect(): scheduled side effects, not part of the pure computation graph ──────────────
    // Effects run as microtasks (`RootEffectNode`, since this one is created in `providedIn:
    // 'root'`, outside any component view) after signals settle, not synchronously inside
    // `.set()`. Angular batches: three writes in the same tick still only re-run this once.
    effect(() => {
      const snapshot = this._todos();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      } catch {
        // Storage can throw in private-browsing mode or when the quota is exceeded — persistence
        // is a nice-to-have here, not a correctness requirement, so we swallow it.
      }
    });

    // Hydrate from the (simulated) backend once it resolves, but only if there was nothing in
    // local storage to begin with. `untracked()` reads `_todos()` without subscribing this
    // effect to it — otherwise every `addTodo`/`toggleTodo` call would re-trigger this effect
    // and it would fight the user by re-seeding the list on every edit.
    effect(() => {
      if (this.seed.status() !== 'resolved') {
        return;
      }
      const shouldHydrate = untracked(() => this._todos().length === 0);
      if (shouldHydrate) {
        this._todos.set(this.seed.value());
      }
    });
  }

  // ── Mutations: the only way the outside world is allowed to touch state ────────────────────
  addTodo(rawTitle: string): void {
    const title = rawTitle.trim();
    if (!title) {
      return;
    }
    const todo: Todo = { id: crypto.randomUUID(), title, completed: false, createdAt: Date.now() };
    this._todos.update((todos) => [...todos, todo]);
  }

  toggleTodo(id: string): void {
    let justCompleted = false;
    this._todos.update((todos) =>
      todos.map((todo) => {
        if (todo.id !== id) {
          return todo;
        }
        justCompleted = !todo.completed;
        return { ...todo, completed: justCompleted };
      }),
    );
    if (justCompleted) {
      // A fresh object, not just the id, so this is always a distinct value by the default
      // `Object.is` equality — re-completing the *same* todo twice in a row (complete → undo →
      // complete again) must still notify `completionEvents`' consumers each time. This is the
      // signal-as-event-bus pattern: `completionEvents` isn't "current state" like `todos` is,
      // it's a one-shot pulse that only ever originates from this call site.
      this._completionEvents.set({ id, at: Date.now() });
    }
  }

  removeTodo(id: string): void {
    this._todos.update((todos) => todos.filter((todo) => todo.id !== id));
    if (this._editingId() === id) {
      this._editingId.set(null);
    }
  }

  clearCompleted(): void {
    this._todos.update((todos) => todos.filter((todo) => !todo.completed));
  }

  setFilter(filter: TodoFilter): void {
    this._filter.set(filter);
  }

  startEditing(id: string): void {
    this._editingId.set(id);
  }

  updateDraft(title: string): void {
    this.draftTitle.set(title);
  }

  commitEdit(): void {
    const id = this._editingId();
    if (id === null) {
      return;
    }
    const title = this.draftTitle().trim();
    if (title) {
      this._todos.update((todos) =>
        todos.map((todo) => (todo.id === id ? { ...todo, title } : todo)),
      );
    }
    this._editingId.set(null);
  }

  cancelEditing(): void {
    this._editingId.set(null);
  }

  private readCache(): Todo[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Todo[]) : [];
    } catch {
      return [];
    }
  }
}
