import { useRef, useState } from 'react';
import { MAX_TITLE_LENGTH, validateTitle } from '@/lib/board';
import styles from './AddTaskForm.module.css';

interface AddTaskFormProps {
  /** Saves the task. Rejects with an Error if the API refuses it. */
  onAdd: (title: string) => Promise<void>;
}

export function AddTaskForm({ onAdd }: AddTaskFormProps) {
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const length = title.trim().length;

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextTitle = event.target.value;
    setTitle(nextTitle);
    // Once an error is showing, check again on every key press so it goes
    // away as soon as the title is fixed.
    if (error !== null) {
      setError(validateTitle(nextTitle));
    }
  }

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    // Stop the browser from reloading the page, which is what a form does by default.
    event.preventDefault();
    if (isSaving) return;

    const problem = validateTitle(title);
    if (problem !== null) {
      setError(problem);
      inputRef.current?.focus();
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await onAdd(title.trim());
      setTitle('');
    } catch (caught) {
      // The API has its own checks. Show what it said under the field too.
      setError(caught instanceof Error ? caught.message : 'Could not add the task');
    } finally {
      setIsSaving(false);
      // Back to the field: ready for the next task, or to fix this one.
      inputRef.current?.focus();
    }
  }

  return (
    // noValidate turns off the browser's own pop-up messages; ours go under the field.
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <label htmlFor="new-task-title" className={styles.label}>
        New task
      </label>

      <div className={styles.row}>
        <input
          id="new-task-title"
          ref={inputRef}
          type="text"
          className="input"
          autoComplete="off"
          value={title}
          onChange={handleChange}
          // Read-only (not disabled) while saving, so the field keeps focus.
          readOnly={isSaving}
          aria-required="true"
          aria-invalid={error !== null}
          aria-describedby={error !== null ? 'new-task-error' : undefined}
        />
        <button type="submit" className="button" aria-disabled={isSaving}>
          {isSaving ? 'Adding…' : 'Add task'}
        </button>
      </div>

      <div className={styles.below}>
        {error !== null && (
          <p id="new-task-error" className={styles.error}>
            {error}
          </p>
        )}
        <p className={length > MAX_TITLE_LENGTH ? styles.counterOver : styles.counter}>
          {length}/{MAX_TITLE_LENGTH}
        </p>
      </div>
    </form>
  );
}
