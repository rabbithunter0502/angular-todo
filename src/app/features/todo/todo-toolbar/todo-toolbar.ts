import { ChangeDetectionStrategy, Component, model, output } from '@angular/core';
import { TodoFilter } from '../../../core/models/todo.model';

/**
 * Add-todo form + filter switch.
 *
 * `newTitle` uses `model()` rather than `input()` + `output()`. `model()` is sugar for exactly
 * that pair (a settable input plus a matching `<name>Change` output) generated for you, meant
 * for state the *component* owns but a parent may want to bind to with `[(newTitle)]`. Here no
 * parent binds it — it's simply the cleanest way to get a two-way-bindable local draft signal
 * without hand-rolling the getter/setter pair.
 */
@Component({
  selector: 'app-todo-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './todo-toolbar.html',
  styleUrl: './todo-toolbar.css',
})
export class TodoToolbar {
  readonly newTitle = model('');
  readonly activeFilter = model<TodoFilter>('all');

  readonly add = output<string>();
  readonly filterChange = output<TodoFilter>();
  readonly clearCompleted = output<void>();

  protected readonly filters: readonly TodoFilter[] = ['all', 'active', 'completed'];

  protected submit(): void {
    this.add.emit(this.newTitle());
    this.newTitle.set('');
  }

  protected selectFilter(filter: TodoFilter): void {
    this.activeFilter.set(filter);
    this.filterChange.emit(filter);
  }
}
