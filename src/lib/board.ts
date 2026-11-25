import type { Task, TaskStatus } from '@/types';

/** The board's columns, in the order they are shown. */
export const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'TODO', label: 'To do' },
  { status: 'IN_PROGRESS', label: 'In progress' },
  { status: 'DONE', label: 'Done' },
];

/** Same limit the API enforces in `createTask`. */
export const MAX_TITLE_LENGTH = 80;

/** Turns a status into the name shown to the user, e.g. IN_PROGRESS -> "In progress". */
export function statusLabel(status: TaskStatus): string {
  const column = COLUMNS.find((c) => c.status === status);
  return column ? column.label : status;
}

/**
 * Checks a new task title. Returns the error message to show, or null if the
 * title is fine. Spaces at the start and end don't count, same as in the API.
 */
export function validateTitle(title: string): string | null {
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    return 'Title is required';
  }
  if (trimmed.length > MAX_TITLE_LENGTH) {
    return `Title must be ${MAX_TITLE_LENGTH} characters or fewer`;
  }
  return null;
}

/** True if the task's title contains the search text. Ignores case and outer spaces. */
export function matchesTitle(task: Task, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (needle === '') return true;
  return task.title.toLowerCase().includes(needle);
}

/**
 * Returns a new list where one task has a new status. Every other task, and
 * the order of the list, stays the same.
 */
export function withStatus(tasks: Task[], id: string, status: TaskStatus): Task[] {
  return tasks.map((task) => (task.id === id ? { ...task, status } : task));
}
