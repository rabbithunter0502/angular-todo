import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TodoStore } from './todo-store';

describe('TodoStore', () => {
  let store: TodoStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    store = TestBed.inject(TodoStore);
  });

  it('starts empty when nothing is cached', () => {
    expect(store.todos()).toEqual([]);
    expect(store.stats()).toEqual({ total: 0, completed: 0, remaining: 0 });
  });

  it('adds a trimmed todo and the computed()s derive from it immediately', () => {
    store.addTodo('  Viết unit test cho TodoStore  ');

    expect(store.todos()).toHaveLength(1);
    expect(store.todos()[0].title).toBe('Viết unit test cho TodoStore');
    expect(store.stats()).toEqual({ total: 1, completed: 0, remaining: 1 });
    expect(store.filteredTodos()).toEqual(store.todos());
  });

  it('ignores blank titles', () => {
    store.addTodo('   ');
    expect(store.todos()).toEqual([]);
  });

  it('toggling replaces the array (signals compare by identity, not deep equality)', () => {
    store.addTodo('A');
    const [{ id }] = store.todos();
    const before = store.todos();

    store.toggleTodo(id);

    expect(store.todos()).not.toBe(before);
    expect(store.todos()[0].completed).toBe(true);
    expect(store.stats()).toEqual({ total: 1, completed: 1, remaining: 0 });

    store.setFilter('active');
    expect(store.filteredTodos()).toEqual([]);
    store.setFilter('completed');
    expect(store.filteredTodos()).toHaveLength(1);
  });

  it('emits a completionEvents pulse only on a false→true transition, and again on repeats', () => {
    store.addTodo('A');
    const [{ id }] = store.todos();
    expect(store.completionEvents()).toBeNull();

    store.toggleTodo(id); // false -> true: a completion
    const firstEvent = store.completionEvents();
    expect(firstEvent?.id).toBe(id);

    store.toggleTodo(id); // true -> false: not a completion, event signal untouched
    expect(store.completionEvents()).toBe(firstEvent);

    store.toggleTodo(id); // false -> true again
    expect(store.completionEvents()).not.toBe(firstEvent);
  });

  it('draftTitle (linkedSignal) tracks manual edits, then resets when editingId changes again', () => {
    store.addTodo('First');
    store.addTodo('Second');
    const [first, second] = store.todos();

    store.startEditing(first.id);
    expect(store.draftTitle()).toBe('First');

    store.updateDraft('First (đang gõ dở...)');
    expect(store.draftTitle()).toBe('First (đang gõ dở...)');

    store.startEditing(second.id); // source signal changed -> linkedSignal recomputes
    expect(store.draftTitle()).toBe('Second');

    store.commitEdit();
    expect(store.todos()[1].title).toBe('Second');
    expect(store.editingId()).toBeNull();
  });

  it('clearCompleted keeps only the still-active todos', () => {
    store.addTodo('A');
    store.addTodo('B');
    const [a, b] = store.todos();
    store.toggleTodo(a.id);

    store.clearCompleted();

    expect(store.todos()).toEqual([b]);
  });
});
