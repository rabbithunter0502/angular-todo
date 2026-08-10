import { Component } from '@angular/core';
import { TodoShellComponent } from './features/todo/todo-shell/todo-shell';

@Component({
  selector: 'app-root',
  imports: [TodoShellComponent],
  templateUrl: './app.html',
})
export class App {}
