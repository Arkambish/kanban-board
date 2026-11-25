import type { Task } from '@/types';
import styles from './TaskCard.module.css';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  return (
    <li className={styles.card}>
      <h3 className={styles.title}>{task.title}</h3>

      {task.description && <p className={styles.description}>{task.description}</p>}

      {task.dueDate && (
        <p className={styles.due}>
          Due <time dateTime={task.dueDate}>{task.dueDate}</time>
        </p>
      )}
    </li>
  );
}
