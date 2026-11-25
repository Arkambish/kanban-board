import type { Task, TaskStatus } from '@/types';
import { TaskCard } from './TaskCard';
import styles from './Column.module.css';

interface ColumnProps {
  status: TaskStatus;
  label: string;
  /** The tasks in this column. */
  tasks: Task[];
  isLoading: boolean;
}

export function Column({ status, label, tasks, isLoading }: ColumnProps) {
  const headingId = `column-${status}`;

  return (
    <section className={styles.column} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.heading}>
        {label}
        {/* No count while loading: we don't know it yet, and "0" would be wrong. */}
        {!isLoading && <span className={styles.count}> ({tasks.length})</span>}
      </h2>

      {isLoading ? (
        <LoadingCards />
      ) : tasks.length === 0 ? (
        <p className={styles.empty}>No tasks</p>
      ) : (
        <ul className={styles.list}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
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
