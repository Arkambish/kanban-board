import { useEffect, useState } from 'react';
import { getTasks } from '@/api/tasks';
import type { Task } from '@/types';

export type LoadState = 'loading' | 'ready' | 'error';

/**
 * Owns the list of tasks. The board reads everything it shows (cards and
 * counts) from this one list, so they can never disagree with each other.
 */
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  // Changing this number makes the loading effect run again ("Try again").
  const [loadAttempt, setLoadAttempt] = useState(0);

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

  return { tasks, loadState, reload };
}
