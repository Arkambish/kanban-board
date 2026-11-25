import { describe, expect, it } from 'vitest';
import type { Task } from '@/types';
import { MAX_TITLE_LENGTH, matchesTitle, statusLabel, validateTitle, withStatus } from './board';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Set up CI pipeline',
    status: 'TODO',
    createdAt: '2026-11-02T09:15:00.000Z',
    ...overrides,
  };
}

describe('statusLabel', () => {
  it('returns the column name for a status', () => {
    expect(statusLabel('TODO')).toBe('To do');
    expect(statusLabel('IN_PROGRESS')).toBe('In progress');
    expect(statusLabel('DONE')).toBe('Done');
  });
});

describe('validateTitle', () => {
  it('accepts a normal title', () => {
    expect(validateTitle('Write docs')).toBeNull();
  });

  it('rejects an empty title', () => {
    expect(validateTitle('')).toBe('Title is required');
  });

  it('rejects a title that is only spaces', () => {
    expect(validateTitle('   ')).toBe('Title is required');
  });

  it('accepts a title of exactly the maximum length', () => {
    expect(validateTitle('a'.repeat(MAX_TITLE_LENGTH))).toBeNull();
  });

  it('rejects a title one character over the maximum', () => {
    expect(validateTitle('a'.repeat(MAX_TITLE_LENGTH + 1))).toBe(
      'Title must be 80 characters or fewer',
    );
  });

  it('does not count spaces around the title towards the maximum', () => {
    expect(validateTitle(`  ${'a'.repeat(MAX_TITLE_LENGTH)}  `)).toBeNull();
  });
});

describe('matchesTitle', () => {
  const task = makeTask({ title: 'Set up CI pipeline' });

  it('matches every task when the search is empty', () => {
    expect(matchesTitle(task, '')).toBe(true);
    expect(matchesTitle(task, '   ')).toBe(true);
  });

  it('matches part of the title', () => {
    expect(matchesTitle(task, 'pipe')).toBe(true);
  });

  it('ignores upper and lower case', () => {
    expect(matchesTitle(task, 'ci PIPE')).toBe(true);
  });

  it('ignores spaces around the search text', () => {
    expect(matchesTitle(task, '  pipeline ')).toBe(true);
  });

  it('does not match text that is not in the title', () => {
    expect(matchesTitle(task, 'invoice')).toBe(false);
  });

  it('only looks at the title, not the description', () => {
    const withDescription = makeTask({ title: 'Fix typo', description: 'On the pricing page' });
    expect(matchesTitle(withDescription, 'pricing')).toBe(false);
  });
});

describe('withStatus', () => {
  const tasks = [
    makeTask({ id: 'a', status: 'TODO' }),
    makeTask({ id: 'b', status: 'TODO' }),
    makeTask({ id: 'c', status: 'DONE' }),
  ];

  it('changes the status of the matching task only', () => {
    const result = withStatus(tasks, 'b', 'IN_PROGRESS');
    expect(result.map((t) => t.status)).toEqual(['TODO', 'IN_PROGRESS', 'DONE']);
  });

  it('keeps the tasks in the same order', () => {
    const result = withStatus(tasks, 'a', 'DONE');
    expect(result.map((t) => t.id)).toEqual(['a', 'b', 'c']);
  });

  it('does not change the original list', () => {
    withStatus(tasks, 'a', 'DONE');
    expect(tasks[0].status).toBe('TODO');
  });

  it('returns the same tasks when the id is unknown', () => {
    expect(withStatus(tasks, 'missing', 'DONE')).toEqual(tasks);
  });
});
