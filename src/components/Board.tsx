'use client';

import { useTasks } from '@/hooks/useTasks';
import { COLUMNS } from '@/lib/board';
import { Column } from './Column';
import styles from './Board.module.css';

export function Board() {
  const { tasks, loadState, reload } = useTasks();
  const isLoading = loadState === 'loading';

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Task Board</h1>

      {/* Read out by screen readers; sighted users see the placeholder cards instead. */}
      <p role="status" className="visually-hidden">
        {isLoading ? 'Loading tasks…' : ''}
      </p>

      {loadState === 'error' ? (
        <div role="alert" className={styles.loadError}>
          <p>Could not load the tasks.</p>
          <button type="button" className="button" onClick={reload}>
            Try again
          </button>
        </div>
      ) : (
        <div className={styles.columns} aria-busy={isLoading}>
          {COLUMNS.map((column) => (
            <Column
              key={column.status}
              status={column.status}
              label={column.label}
              tasks={tasks.filter((task) => task.status === column.status)}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}
    </main>
  );
}
