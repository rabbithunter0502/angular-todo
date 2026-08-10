import { Todo } from '../models/todo.model';

/**
 * Stand-in for a real HTTP call. Kept dependency-free (no HttpClient) so the demo focuses on
 * `resource()` itself rather than on networking — swap this for `firstValueFrom(http.get(...))`
 * or a `fetch()` call in a real app; the `resource()` call site in `TodoStore` doesn't change.
 *
 * It honors `AbortSignal`, because `resource()` aborts the in-flight loader run whenever its
 * `params` change again before the previous run settles (see `resource.ts`: it derives an
 * `AbortController` per run and calls `.abort()` on the stale one). A loader that ignores the
 * signal just wastes the network round trip; it doesn't corrupt state, since `resource()` also
 * discards results that resolve after they've been superseded.
 */
export function fetchInitialTodos(abortSignal?: AbortSignal): Promise<Todo[]> {
  const seed: ReadonlyArray<Pick<Todo, 'title' | 'completed'>> = [
    {
      title: 'Đọc source code Angular Signals (packages/core/primitives/signals)',
      completed: true,
    },
    { title: 'Viết TodoStore bằng signal/computed/effect/linkedSignal/resource', completed: false },
    { title: 'Tổng hợp checklist tư duy senior về reactivity graph', completed: false },
  ];

  return new Promise((resolve, reject) => {
    const latencyMs = 500;
    const timer = setTimeout(() => {
      resolve(
        seed.map((item, index) => ({
          ...item,
          id: `seed-${index}`,
          createdAt: Date.now() - (seed.length - index) * 1000,
        })),
      );
    }, latencyMs);

    abortSignal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(abortSignal.reason ?? new DOMException('Aborted', 'AbortError'));
    });
  });
}
