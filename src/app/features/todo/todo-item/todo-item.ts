import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Todo } from '../../../core/models/todo.model';

/**
 * `editing`/`draftTitle` are plain `input()`s, not `model()`. The draft's source of truth is
 * `TodoStore.draftTitle` (a `linkedSignal`) — this component only ever reflects it and reports
 * keystrokes back up via `draftTitleChange`. Reaching for `model()` here would tempt this
 * component into owning a second, parallel copy of "what the user is typing", which is exactly
 * the kind of duplicated state signals are meant to make unnecessary.
 */
@Component({
  selector: 'app-todo-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './todo-item.html',
  styleUrl: './todo-item.css',
})
export class TodoItemComponent {
  readonly todo = input.required<Todo>();
  readonly editing = input(false);
  readonly draftTitle = input('');

  readonly toggle = output<string>();
  readonly remove = output<string>();
  readonly startEdit = output<string>();
  readonly draftTitleChange = output<string>();
  readonly commitEdit = output<void>();
  readonly cancelEdit = output<void>();

  protected readonly statusLabel = computed(() => (this.todo().completed ? 'Đã xong' : 'Đang làm'));
}
