'use client';

import { useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useTasks } from '@/hooks/useTasks';
import { COLUMNS, matchesTitle } from '@/lib/board';
import { AddTaskForm } from './AddTaskForm';
import { Column } from './Column';
import styles from './Board.module.css';

export function Board() {
  const {
    tasks,
    loadState,
    reload,
    pendingIds,
    moveTask,
    moveErrors,
    dismissMoveError,
    addTask,
    announcement,
  } = useTasks();
  const isLoading = loadState === 'loading';

  // `query` is what the input shows and changes on every key press.
  // `debouncedQuery` follows 300 ms after the typing stops, and is what filters the board.
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  const isFiltering = debouncedQuery.trim() !== '';

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Task Board</h1>

      <div className={styles.search}>
        <label htmlFor="task-search" className={styles.searchLabel}>
          Search tasks
        </label>
        <input
          id="task-search"
          type="search"
          className="input"
          placeholder="Filter by title"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {/* Read out by screen readers; sighted users see the placeholder cards instead. */}
      <p role="status" className="visually-hidden">
        {isLoading ? 'Loading tasks…' : announcement}
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
          {COLUMNS.map((column) => {
            // Both lists are worked out from `tasks` on every render, so the
            // count and the cards always come from the same data.
            const inColumn = tasks.filter((task) => task.status === column.status);
            const visible = inColumn.filter((task) => matchesTitle(task, debouncedQuery));

            return (
              <Column
                key={column.status}
                status={column.status}
                label={column.label}
                tasks={visible}
                total={inColumn.length}
                isFiltering={isFiltering}
                isLoading={isLoading}
                pendingIds={pendingIds}
                onMove={moveTask}
              >
                {/* New tasks start in To do, so the form lives there. It waits for
                    the first load, so a new task can't be lost when the list arrives. */}
                {column.status === 'TODO' && !isLoading && <AddTaskForm onAdd={addTask} />}
              </Column>
            );
          })}
        </div>
      )}

      {/* Always on the page so screen readers announce an error the moment it is added. */}
      <div role="alert" className={styles.errors}>
        {moveErrors.map((error) => (
          <div key={error.taskId} className={styles.error}>
            <p>{error.message}</p>
            <button
              type="button"
              className="button"
              onClick={() => dismissMoveError(error.taskId)}
            >
              Dismiss
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
