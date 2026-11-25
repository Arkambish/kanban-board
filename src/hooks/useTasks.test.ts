// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import * as api from '@/api/tasks';
import { useTasks } from './useTasks';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let board: ReturnType<typeof useTasks>;

function Probe() {
  board = useTasks();
  return null;
}

beforeEach(async () => {
  vi.useFakeTimers();
  api.__resetTasks();
  api.__setFailRate(0);
  root = createRoot(document.createElement('div'));
  await act(async () => root.render(createElement(Probe)));
  await act(async () => { await vi.runAllTimersAsync(); });
});

afterEach(() => {
  act(() => root.unmount());
  vi.restoreAllMocks();
  vi.useRealTimers();
  api.__setFailRate(null);
});

it('blocks duplicate moves before React has rendered and releases the lock after failure', async () => {
  api.__setFailRate(1);
  const update = vi.spyOn(api, 'updateTaskStatus');
  const task = board.tasks[0];
  act(() => {
    void board.moveTask(task, 'DONE');
    void board.moveTask(task, 'IN_PROGRESS');
  });
  expect(update).toHaveBeenCalledTimes(1);
  expect(board.tasks[0].status).toBe('DONE');
  await act(async () => { await vi.runAllTimersAsync(); });
  expect(board.tasks[0].status).toBe(task.status);
  expect(board.pendingIds).toEqual([]);
  expect(board.moveErrors).toHaveLength(1);

  api.__setFailRate(0);
  act(() => { void board.moveTask(board.tasks[0], 'DONE'); });
  expect(board.moveErrors).toEqual([]);
  await act(async () => { await vi.runAllTimersAsync(); });
  expect(board.tasks[0].status).toBe('DONE');
});

it('rolls back only the failed task while preserving another move and a new task', async () => {
  let rejectMove!: (error: Error) => void;
  vi.spyOn(api, 'updateTaskStatus').mockImplementationOnce(
    () => new Promise((_, reject) => { rejectMove = reject; }),
  );
  const [first, second] = board.tasks;
  act(() => {
    void board.moveTask(first, 'DONE');
    void board.moveTask(second, 'IN_PROGRESS');
    void board.addTask('Keep this new task');
  });
  await act(async () => { await vi.runAllTimersAsync(); });
  await act(async () => { rejectMove(new Error('Offline')); });
  expect(board.tasks.find((task) => task.id === first.id)?.status).toBe(first.status);
  expect(board.tasks.find((task) => task.id === second.id)?.status).toBe('IN_PROGRESS');
  expect(board.tasks).toHaveLength(13);
  expect(board.tasks.at(-1)?.title).toBe('Keep this new task');
  expect(board.pendingIds).toEqual([]);
  expect(board.moveErrors.map((error) => error.taskId)).toEqual([first.id]);
});
