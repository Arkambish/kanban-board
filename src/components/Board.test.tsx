// @vitest-environment jsdom
import { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import * as api from '@/api/tasks';
import { seedTasks } from '@/api/seed';
import { Board } from './Board';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.useFakeTimers();
  api.__resetTasks();
  api.__setFailRate(null);
  window.history.replaceState(null, '', '/?failRate=0');
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(<StrictMode><Board /></StrictMode>));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

async function settle() {
  await act(async () => { await vi.runAllTimersAsync(); });
}

function input(id: string) {
  return container.querySelector<HTMLInputElement>(`#${id}`)!;
}

function type(id: string, value: string) {
  const field = input(id);
  act(() => {
    // Bypass React's tracker, just as a native browser edit would.
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(field, value);
    field.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function column(status: string) {
  return container.querySelector<HTMLElement>(`section[aria-labelledby="column-${status}"]`)!;
}

function card(id: string) {
  return container.querySelector<HTMLElement>(`#task-title-${id}`)!.closest('li')!;
}

function move(id: string, label: string) {
  const button = Array.from(card(id).querySelectorAll('button')).find(
    (candidate) => candidate.textContent === `Move to ${label}`,
  )!;
  button.focus();
  act(() => button.click());
}

function submit() {
  container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

function expectCounts() {
  for (const status of ['TODO', 'IN_PROGRESS', 'DONE']) {
    const section = column(status);
    expect(section.querySelector('h2')!.textContent).toContain(`(${section.querySelectorAll('li').length})`);
  }
}

it('shows loading placeholders before rendering the 12 tasks and correct counts', async () => {
  expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
  expect(container.querySelector('[role="status"]')!.textContent).toBe('Loading tasks…');
  expect(container.querySelector('form')).toBeNull();
  expect(container.querySelectorAll('li')).toHaveLength(0);
  await settle();
  expect(container.querySelectorAll('li')).toHaveLength(12);
  expectCounts();
  expect(container.querySelectorAll('label')).toHaveLength(2);
});

it('moves immediately, rolls back at failRate=1, and preserves focus and counts', async () => {
  window.history.replaceState(null, '', '/?failRate=1');
  await settle();
  const task = seedTasks[0];
  move(task.id, 'Done');
  expect(column('DONE').contains(card(task.id))).toBe(true);
  expect(Array.from(card(task.id).querySelectorAll('button')).every((button) => button.disabled)).toBe(true);
  expect(document.activeElement?.id).toBe(`task-title-${task.id}`);
  expectCounts();
  await settle();
  expect(column('TODO').contains(card(task.id))).toBe(true);
  expect(document.activeElement?.id).toBe(`task-title-${task.id}`);
  expect(container.querySelector('[role="alert"]')!.textContent).toContain(`Could not move “${task.title}”`);
  expectCounts();
  const dismiss = Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Dismiss')!;
  act(() => dismiss.click());
  expect(container.querySelector('[role="alert"]')!.textContent).toBe('');
});

it('saves moves to every column at failRate=0 and keeps counts in sync', async () => {
  await settle();
  const task = seedTasks[0];
  for (const [status, label] of [['IN_PROGRESS', 'In progress'], ['DONE', 'Done'], ['TODO', 'To do']]) {
    move(task.id, label);
    expect(column(status).contains(card(task.id))).toBe(true);
    expectCounts();
    await settle();
    expect(column(status).contains(card(task.id))).toBe(true);
    expect(card(task.id).textContent).not.toContain('Saving…');
    expectCounts();
  }
  expect(container.querySelector('[role="alert"]')!.textContent).toBe('');
});

it('does not steal focus if the user leaves a moving task before rollback', async () => {
  window.history.replaceState(null, '', '/?failRate=1');
  await settle();
  move(seedTasks[0].id, 'Done');
  input('task-search').focus();
  await settle();
  expect(document.activeElement).toBe(input('task-search'));
});

it('debounces title search for 300 ms and shows matching and total counts', async () => {
  await settle();
  type('task-search', 'no match');
  await act(async () => { await vi.advanceTimersByTimeAsync(200); });
  type('task-search', seedTasks[0].title.toUpperCase());
  await act(async () => { await vi.advanceTimersByTimeAsync(299); });
  expect(container.querySelectorAll('li')).toHaveLength(12);
  await act(async () => { await vi.advanceTimersByTimeAsync(1); });
  expect(container.querySelectorAll('li')).toHaveLength(1);
  expect(column('TODO').querySelector('h2')!.textContent).toContain(
    `(1 of ${seedTasks.filter((task) => task.status === 'TODO').length})`,
  );
  move(seedTasks[0].id, 'Done');
  expect(column('DONE').querySelector('h2')!.textContent).toContain('(1 of ');
  expect(column('TODO').querySelector('h2')!.textContent).toContain('(0 of ');
  await settle();
  type('task-search', '');
  await settle();
  expect(container.querySelectorAll('li')).toHaveLength(12);
  expectCounts();
});

it('validates titles under the field and creates exactly one task from repeated submissions', async () => {
  await settle();
  const create = vi.spyOn(api, 'createTask');
  for (const [title, message] of [['   ', 'Title is required'], ['x'.repeat(81), 'Title must be 80 characters or fewer']]) {
    type('new-task-title', title);
    act(submit);
    expect(container.querySelector('#new-task-error')!.textContent).toBe(message);
    expect(input('new-task-title').getAttribute('aria-describedby')).toBe('new-task-error');
    expect(document.activeElement).toBe(input('new-task-title'));
  }
  expect(create).not.toHaveBeenCalled();
  type('new-task-title', `  ${'x'.repeat(80)}  `);
  act(() => { submit(); submit(); });
  expect(create).toHaveBeenCalledTimes(1);
  expect(create).toHaveBeenCalledWith({ title: 'x'.repeat(80) });
  expect(input('new-task-title').readOnly).toBe(true);
  await settle();
  expect(input('new-task-title').value).toBe('');
  expect(container.querySelectorAll('li')).toHaveLength(13);
  expectCounts();
});

it('returns focus after adding but leaves another focused control alone', async () => {
  await settle();
  type('new-task-title', 'First task');
  const button = container.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  button.focus();
  act(() => button.click());
  await settle();
  expect(document.activeElement).toBe(input('new-task-title'));
  type('new-task-title', 'Second task');
  act(submit);
  input('task-search').focus();
  await settle();
  expect(document.activeElement).toBe(input('task-search'));
});

it('shows create errors under the field and preserves the entered title for retry', async () => {
  await settle();
  vi.spyOn(api, 'createTask').mockRejectedValueOnce(new Error('Could not save task'));
  type('new-task-title', 'Retry this task');
  await act(async () => { submit(); });
  expect(container.querySelector('#new-task-error')!.textContent).toBe('Could not save task');
  expect(input('new-task-title').value).toBe('Retry this task');
  expect(input('new-task-title').readOnly).toBe(false);
  act(submit);
  await settle();
  expect(container.querySelectorAll('li')).toHaveLength(13);
  expectCounts();
});
