import { Component, ElementRef, model, output, viewChildren } from '@angular/core';
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

  private readonly filterButtons = viewChildren<ElementRef<HTMLButtonElement>>('filterButton');

  protected submit(): void {
    this.add.emit(this.newTitle());
    this.newTitle.set('');
  }

  protected selectFilter(filter: TodoFilter): void {
    this.activeFilter.set(filter);
    this.filterChange.emit(filter);
  }

  /**
   * Hành vi bàn phím chuẩn của một `radiogroup`: mũi tên di chuyển *và* chọn luôn (khác `tablist`,
   * nơi mũi tên chỉ di chuyển focus), cuộn vòng ở hai đầu. Không có nó thì roving `tabindex` ở
   * template lại thành lỗi nặng hơn ban đầu — Tab chỉ vào được đúng nút đang chọn, và không có
   * cách nào chọn nút khác bằng bàn phím.
   */
  protected onFilterKeydown(event: KeyboardEvent, filter: TodoFilter): void {
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0;
    if (step === 0) {
      return;
    }
    event.preventDefault();

    const current = this.filters.indexOf(filter);
    const nextIndex = (current + step + this.filters.length) % this.filters.length;
    this.selectFilter(this.filters[nextIndex]);
    this.filterButtons()[nextIndex]?.nativeElement.focus();
  }
}
