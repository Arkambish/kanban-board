import { COLUMNS } from '@/lib/board';
import type { Task, TaskStatus } from '@/types';
import styles from './TaskCard.module.css';

interface TaskCardProps {
  task: Task;
  /** True while a move of this task is being saved. */
  isPending: boolean;
  onMove: (task: Task, nextStatus: TaskStatus) => void;
}

export function TaskCard({ task, isPending, onMove }: TaskCardProps) {
  const titleId = `task-title-${task.id}`;
  // A button for every column except the one the task is already in.
  const otherColumns = COLUMNS.filter((column) => column.status !== task.status);

  return (
    <li className={styles.card}>
      <h3 id={titleId} className={styles.title} tabIndex={-1}>
        {task.title}
      </h3>

      {task.description && <p className={styles.description}>{task.description}</p>}

      {task.dueDate && (
        <p className={styles.due}>
          Due <time dateTime={task.dueDate}>{task.dueDate}</time>
        </p>
      )}

      <div className={styles.actions}>
        {otherColumns.map((column) => (
          <button
            key={column.status}
            type="button"
            className="button"
            // Every card has a "Move to Done" button. Pointing at the title
            // tells screen reader users which task this one moves.
            aria-describedby={titleId}
            disabled={isPending}
            onClick={() => onMove(task, column.status)}
          >
            Move to {column.label}
          </button>
        ))}
        {isPending && <span className={styles.saving}>Saving…</span>}
      </div>
    </li>
  );
}
