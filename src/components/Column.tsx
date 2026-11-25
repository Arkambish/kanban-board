import type { Task, TaskStatus } from '@/types';
import { TaskCard } from './TaskCard';
import styles from './Column.module.css';

interface ColumnProps {
  status: TaskStatus;
  label: string;
  /** The tasks to show: the ones in this column that match the search. */
  tasks: Task[];
  /** How many tasks are in this column, whether they match the search or not. */
  total: number;
  /** True while a search is hiding some tasks. */
  isFiltering: boolean;
  isLoading: boolean;
  /** Ids of tasks whose move is still being saved. */
  pendingIds: string[];
  onMove: (task: Task, nextStatus: TaskStatus) => void;
  /** Shown between the header and the cards (the add-task form). */
  children?: React.ReactNode;
}

export function Column({
  status,
  label,
  tasks,
  total,
  isFiltering,
  isLoading,
  pendingIds,
  onMove,
  children,
}: ColumnProps) {
  const headingId = `column-${status}`;
  // The count is always the real size of the column. During a search it also
  // says how many of those are showing, e.g. "(2 of 5)".
  const count = isFiltering ? `${tasks.length} of ${total}` : `${total}`;

  return (
    <section className={styles.column} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.heading}>
        {label}
        {/* No count while loading: we don't know it yet, and "0" would be wrong. */}
        {!isLoading && <span className={styles.count}> ({count})</span>}
      </h2>

      {children}

      {isLoading ? (
        <LoadingCards />
      ) : tasks.length === 0 ? (
        <p className={styles.empty}>{total === 0 ? 'No tasks' : 'No tasks match your search'}</p>
      ) : (
        <ul className={styles.list}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isPending={pendingIds.includes(task.id)}
              onMove={onMove}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

/** Grey placeholder cards. Hidden from screen readers: the board announces "Loading tasks" once. */
function LoadingCards() {
  return (
    <div className={styles.list} aria-hidden="true">
      <div className={styles.placeholder} />
      <div className={styles.placeholder} />
      <div className={styles.placeholder} />
    </div>
  );
}
