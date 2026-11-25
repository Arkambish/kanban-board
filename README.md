# Task Board (Section 2)

In this section you'll build a small Kanban board in **plain React and CSS**, without any AI tools.

This repo gives you a working Next.js setup, the TypeScript types and a mock API. Everything else is up to you.

---

## 1. Getting started

**You need:** Node.js **24** (the exact version is in `.nvmrc`) and npm.

If you use [nvm](https://github.com/nvm-sh/nvm), run `nvm use` in this folder to switch to the right version.

```bash
npm install
npm run dev
```

Then open http://localhost:3000. You should see a "Task Board" heading and a short message.

Other useful commands:

| Command | What it does |
|---|---|
| `npm run dev` | Starts the app in development mode |
| `npm run build` | Builds the app for production (also checks types) |
| `npm run lint` | Runs ESLint |
| `npm test` | Runs the tests for the mock API |
| `npm run check-deps` | Checks you haven't added any packages that aren't allowed |

---

## 2. What's provided

```
src/
├── app/
│   ├── layout.tsx     # root layout
│   ├── page.tsx       # placeholder page: start here
│   └── globals.css    # a small CSS reset
├── types.ts           # Task, TaskStatus and CreateTaskInput types
└── api/
    ├── tasks.ts       # the mock API (do not edit)
    ├── seed.ts        # the 12 tasks the board starts with
    └── tasks.test.ts  # tests for the mock API
```

### Types (`src/types.ts`)

```ts
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate?: string;   // e.g. "2026-12-31"
  createdAt: string;  // e.g. "2026-11-20T09:30:00.000Z"
}
```

### The mock API (`src/api/tasks.ts`)

The mock API pretends to be a real server. All functions return Promises.

| Function | What it does |
|---|---|
| `getTasks()` | Returns all tasks. Never fails. |
| `createTask(input)` | Creates a task and returns it. Rejects if the input is invalid (see below). Never fails randomly. |
| `updateTaskStatus(id, status)` | Moves a task to another column and returns the updated task. **Fails randomly about 20% of the time.** |

Things to know:

- **It's slow on purpose.** Every call takes between 300 and 800 ms.
- **Moving a task can fail.** `updateTaskStatus` sometimes rejects with the message `"Network error: could not move task"`. Your UI needs to handle this.
- **Errors are `ApiError`s.** Each one has a `message` and a `status`:
  - `400`: the input was invalid
  - `404`: no task with that id
  - `503`: random network error
- **`createTask` validation.** It rejects with status `400` if:
  - the title is empty (spaces don't count)
  - the title is longer than 80 characters
  - the status isn't `TODO`, `IN_PROGRESS` or `DONE`
  - the due date isn't a real date in `YYYY-MM-DD` format

  If you don't pass a status, the new task goes into `TODO`.
- **You always get copies.** Changing a task object you got from the API doesn't change the API's data. Only the API functions do.
- **Data resets on reload.** It's all kept in memory.
- **Browser only.** The data lives in the browser, so you must call these functions from a **Client Component** (a file that starts with `'use client'`). If you call them on the server, you'll get an error telling you so.
- **Do not modify `src/api/tasks.ts`.** Treat it like an external API owned by another team. (Ignore the functions starting with `__`. They exist only for the tests.)

---

## 3. The task

Replace the placeholder page with a Kanban board that meets these requirements:

- **Three columns** (TODO / IN_PROGRESS / DONE) using a responsive layout that stacks into one column on screens under 768 px.
- **Move a task between columns** using buttons. Drag-and-drop is optional.
- **A search box** that filters tasks by title, with a **debounce of 300 ms** that you implement yourself.
- **Optimistic moves:** the card moves immediately; if the API call fails, it moves back and an error message is shown.
- **An inline "Add task" form:** title required, max 80 characters, error shown under the field.
- **Each column header shows the number of tasks** in that column, and it must always be correct.
- **Basic accessibility:** real `<button>` elements, labelled inputs, visible focus styles.
- **A loading state** while tasks are first fetched.

How you structure your components, state and CSS is up to you. We're more interested in clear, working code than in fancy design.

---

## 4. Rules

- **No AI tools of any kind.** This includes Copilot, Cursor autocomplete and chat assistants. Please switch off any AI features in your editor before you start.
- **Docs and web search are fine.** Use official docs ([MDN](https://developer.mozilla.org), [react.dev](https://react.dev), [nextjs.org/docs](https://nextjs.org/docs)) and normal web search as much as you like.
- **No new dependencies.** No UI libraries, no utility libraries (like lodash) and no drag-and-drop libraries. `npm run check-deps` must pass.
- **Plain CSS or CSS Modules only.** No Tailwind, no CSS-in-JS.
- **Commit as you work.** Make at least 5 commits, and don't squash them. We'd like to see how you got there.
- **Expected time: 90–120 minutes.** If you run out of time, leave a short note at the end of this README about what you'd do next.

---

## 5. In the interview

You'll be asked to make some changes to this code **live**, without AI, while sharing your screen. Make sure you understand every line you wrote.

---

## 6. Tips

- Add `?failRate=0` to the URL (http://localhost:3000/?failRate=0) to turn off random failures while you build.
- Use `?failRate=1` to make every move fail, so you can test your error handling.
- Any value from `0` to `1` works, e.g. `?failRate=0.5`.
- Read `src/api/tasks.ts` if you want to see exactly how the API behaves.

---

## 7. Solution notes

### Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. Node.js 24 is needed (see `.nvmrc`).

| To check | Do this |
|---|---|
| Moves that always work | http://localhost:3000/?failRate=0 |
| Rollback and the error message | http://localhost:3000/?failRate=1, then move any card |
| Loading state | Reload the page: the columns show grey placeholder cards for up to a second |
| Stacked layout | Make the window narrower than 768 px |
| Everything else | `npm run lint`, `npm test`, `npm run build`, `npm run check-deps` |

### Where things are

```
src/
├── app/
│   ├── page.tsx              # renders <Board />
│   └── globals.css           # colours, focus ring, shared .button and .input
├── components/
│   ├── Board.tsx             # the page: search box, three columns, move errors
│   ├── Column.tsx            # header with count, then the cards (or placeholders)
│   ├── TaskCard.tsx          # one task and its "Move to ..." buttons
│   └── AddTaskForm.tsx       # the inline form in the To do column
├── hooks/
│   ├── useTasks.ts           # the task list: load, optimistic move, add
│   └── useDebouncedValue.ts  # the hand-written 300 ms debounce
└── lib/
    └── board.ts              # column list, title rules, search match (pure functions)
```

Each component has a CSS Module next to it. `src/api` is unchanged.

### How each requirement is met

- **Counts are always correct.** There is one list of tasks, in `useTasks`. On every render `Board` works out each column's tasks from that list, and the header count is the length of that same array. Nothing stores a count, so a count has no way to be out of date. During a search the header reads `(2 of 5)`: 5 is still the real size of the column, 2 is how many cards are showing.
- **Optimistic moves.** `moveTask` in `useTasks.ts` changes the task's status in state first, then calls `updateTaskStatus`. If the call rejects, it sets that one task back to its old status and adds an error message. The rollback changes only that task in the latest list; it does not restore an old copy of the whole list, because that would undo anything else that happened while the request was running (another move, a new task).
- **One move per task at a time.** A synchronous ref lock blocks duplicate requests even before React renders. A card's buttons are disabled, and it shows "Saving…", until its request finishes. Without this, two quick moves of the same task could finish in either order (the API's delay is random), and a failed first move would roll back over a second one that worked.
- **Debounce.** `useDebouncedValue` starts a 300 ms timer in an effect every time the value changes; the effect's cleanup cancels the timer that was waiting. The input itself is bound to the un-debounced value, so typing never lags.
- **Add task.** The title is trimmed, then checked: required, at most 80 characters. The error appears under the field and is linked to it with `aria-describedby`. The field has no `maxLength`, on purpose: with it, a long paste would be cut off silently and the "too long" error could never be shown. The API runs the same checks, and anything it rejects is shown in the same place. Adding is not optimistic, because the card needs the id the API creates. A synchronous lock also prevents duplicate form submissions. When saving finishes, focus returns to the title only if the user is still in the form.
- **Loading.** Placeholder cards, no counts (the count is not known yet, and "0" would be wrong), and "Loading tasks…" for screen readers. The add form appears once the list has loaded.
- **Accessibility.** Real `<button>`s, `<label>`s tied to their inputs, one `:focus-visible` ring style for everything. Each move button points at its task's title with `aria-describedby`, so a screen reader says which task "Move to Done" belongs to. Moves and new tasks are announced through a `role="status"` region; failed moves through `role="alert"`. Focus follows the task heading when a move or rollback remounts the card, unless the user has moved to another control. Validation errors are also announced. Multiple move errors scroll within a panel limited to 40% of the viewport height.

### Tests

`npm test` runs 50 tests across five files: the unchanged API tests, board helpers, debounce timing, task-state concurrency, and board interactions. The interaction tests use React DOM and the existing jsdom dependency, with the real mock API at `?failRate=0` and `?failRate=1`. They cover loading, moves, rollback, counts, search, validation, duplicate submissions, create failures, and keyboard focus. The concurrency tests ensure a failed move cannot undo a different move or a newly added task.

Review verification: `npm run lint`, `npm test`, `npm run build`, and `npm run check-deps` pass. Chrome layout checks passed at 320, 375, 767, 768, and 1280 px, including an 80-character unbroken title and multiple rollback errors. No dependencies were added and `src/api` remains unchanged. The existing implementation history exceeds five commits; review fixes are separate, unsquashed commits.

### What I'd do next

- **A "Try again" button on a failed move**, instead of finding the card and pressing the button again.
- **Drag and drop**, on top of the buttons (the buttons stay as the keyboard path).

### How AI was used

This solution was written with Claude Code (Anthropic's coding agent, model Claude Fable 5.2): the code, the tests, the commits and these notes. This goes against rule 4 above ("No AI tools of any kind"), and is stated here so the history is not misleading.
