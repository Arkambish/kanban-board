import { useEffect, useState } from 'react';
import { createTask, getTasks, updateTaskStatus } from '@/api/tasks';
import { statusLabel, withStatus } from '@/lib/board';
import type { Task, TaskStatus } from '@/types';

export type LoadState = 'loading' | 'ready' | 'error';

/** Shown when a move failed and the card was put back. At most one per task. */
export interface MoveError {
  taskId: string;
  message: string;
}

/**
 * Owns the list of tasks. The board reads everything it shows (cards and
 * counts) from this one list, so they can never disagree with each other.
 */
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  // Changing this number makes the loading effect run again ("Try again").
  const [loadAttempt, setLoadAttempt] = useState(0);
  // Ids of tasks whose move is still being saved.
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [moveErrors, setMoveErrors] = useState<MoveError[]>([]);
  // Latest change in words, read out by screen readers.
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    // If the component goes away (or the effect re-runs) before the request
    // finishes, `ignore` stops the old response from being used.
    let ignore = false;

    getTasks()
      .then((loaded) => {
        if (ignore) return;
        setTasks(loaded);
        setLoadState('ready');
      })
      .catch(() => {
        if (ignore) return;
        setLoadState('error');
      });

    return () => {
      ignore = true;
    };
  }, [loadAttempt]);

  function reload() {
    setLoadState('loading');
    setLoadAttempt((attempt) => attempt + 1);
  }

  /**
   * Moves a task to another column optimistically: the card moves now, the
   * API is called afterwards, and the card goes back if the call fails.
   */
  async function moveTask(task: Task, nextStatus: TaskStatus) {
    // Only one move per task at a time. With a single request in flight we
    // always know which status to go back to if it fails.
    if (pendingIds.includes(task.id)) return;

    const previousStatus = task.status;
    const from = statusLabel(previousStatus);
    const to = statusLabel(nextStatus);

    // 1. Move the card straight away, before the API answers.
    setTasks((current) => withStatus(current, task.id, nextStatus));
    setPendingIds((ids) => [...ids, task.id]);
    // An older error about this task no longer describes where it is.
    setMoveErrors((errors) => errors.filter((error) => error.taskId !== task.id));
    setAnnouncement(`Moved “${task.title}” to ${to}.`);

    try {
      // 2. Tell the API.
      await updateTaskStatus(task.id, nextStatus);
    } catch {
      // 3. It failed: put this one task back. Using the latest list (`current`)
      //    keeps any other change that happened while we were waiting.
      setTasks((current) => withStatus(current, task.id, previousStatus));
      setMoveErrors((errors) => [
        ...errors,
        {
          taskId: task.id,
          message: `Could not move “${task.title}” to ${to}. It is back in ${from}.`,
        },
      ]);
    } finally {
      setPendingIds((ids) => ids.filter((id) => id !== task.id));
    }
  }

  /**
   * Creates a task. Not optimistic: the card appears once the API has
   * answered, because the API is what gives the task its id. If the API
   * rejects the title, the error goes to the caller (the form shows it).
   */
  async function addTask(title: string) {
    const created = await createTask({ title });
    setTasks((current) => [...current, created]);
    setAnnouncement(`Added “${created.title}” to ${statusLabel(created.status)}.`);
  }

  function dismissMoveError(taskId: string) {
    setMoveErrors((errors) => errors.filter((error) => error.taskId !== taskId));
  }

  return {
    tasks,
    loadState,
    reload,
    pendingIds,
    moveTask,
    moveErrors,
    dismissMoveError,
    addTask,
    announcement,
  };
}
