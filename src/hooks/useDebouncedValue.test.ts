// @vitest-environment jsdom
// Hooks only run inside a component, so these tests render a tiny one into a simulated browser.

import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebouncedValue } from './useDebouncedValue';

// Tells React it is running in a test, so `act` works without warnings.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** Shows the debounced value as text so the tests can read it. */
function Probe({ value }: { value: string }) {
  return useDebouncedValue(value, 300);
}

let container: HTMLDivElement;
let root: Root;

function render(value: string) {
  act(() => root.render(createElement(Probe, { value })));
}

function wait(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  container = document.createElement('div');
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  vi.useRealTimers();
});

describe('useDebouncedValue', () => {
  it('returns the first value straight away', () => {
    render('a');
    expect(container.textContent).toBe('a');
  });

  it('keeps the old value until the delay has passed', () => {
    render('a');
    render('ab');

    wait(299);
    expect(container.textContent).toBe('a');

    wait(1);
    expect(container.textContent).toBe('ab');
  });

  it('starts the wait again every time the value changes', () => {
    render('a');
    render('ab');
    wait(200);
    render('abc');
    wait(200);

    // 400 ms since "ab", but only 200 ms since "abc": nothing has updated yet.
    expect(container.textContent).toBe('a');

    wait(100);
    expect(container.textContent).toBe('abc');
  });
});
