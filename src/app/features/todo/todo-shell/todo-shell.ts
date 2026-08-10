import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TodoStore } from '../../../core/state/todo-store';
import { TodoListComponent } from '../todo-list/todo-list';
import { TodoStatsComponent } from '../todo-stats/todo-stats';
import { TodoToolbar } from '../todo-toolbar/todo-toolbar';

@Component({
  selector: 'app-todo-shell',
  imports: [TodoToolbar, TodoStatsComponent, TodoListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './todo-shell.html',
  styleUrl: './todo-shell.css',
})
export class TodoShellComponent {
  protected readonly store = inject(TodoStore);
}
