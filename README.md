# Lab 2 – JSX + TypeScript Runtime (Without React)

This project follows the requirements from **Lab 2: JSX, TypeScript** (MSc. Trần Vĩnh Khiêm). It demonstrates how to configure TypeScript to compile JSX into a fully custom runtime, render virtual nodes into the DOM, implement basic hooks, and build a small dashboard application with reusable components.

## 📁 Project Structure

```
src/
├── jsx-runtime.ts     # Custom JSX runtime: VNode, createElement, fragments, rendering, hooks
├── counter.tsx        # Example stateful counter component
├── todo-app.tsx       # Todo list application using the runtime
├── components.tsx     # Reusable Card, Modal, Form, Input components
├── data-service.ts    # Mock data source with realtime updates and filtering helpers
├── chart.tsx          # Canvas-based chart component (bar, line, pie)
├── dashboard.tsx      # Dashboard page combining everything together
├── main.tsx           # App entry point that mounts the dashboard
└── styles.css         # Minimal styling used across the demo
```

## 🚀 Getting Started

Install dependencies and launch the Vite dev server:

```bash
npm install
npm run dev
```

Open the printed localhost URL (default `http://localhost:5173`) to interact with the dashboard.

## 🧠 Key Concepts Implemented

- **Custom JSX Runtime** – `createElement`, `createFragment`, a `VNode` interface, and a renderer that converts VNodes into real DOM nodes.
- **Fragments** – Uses a sentinel string (`"fragment"`) to group elements without additional wrappers.
- **Rendering System** – Converts virtual nodes (including function components) into DOM nodes, handles text nodes, DOM attributes, events, styles, refs, and fragments.
- **Event Delegation** – Event handlers (`onClick`, `onChange`, etc.) are delegated at the document level to reduce listener churn.
- **Refs Support** – Functional and object refs receive DOM nodes during rendering.
- **Basic Hook (`useState`)** – Stores hook state by component path and triggers a full re-render of the root vnode.
- **Reusable Component Library** – Card, Modal, Form, and Input components with strong TypeScript typings.
- **Example Apps** – Counter and Todo applications showcase state management and composition.
- **Dashboard Application** – Real-time data updates, chart rendering with Canvas (bar/line/pie), interactive tooltips, and modal details.

## 🧪 Suggested Experiments

1. Extend `jsx-runtime.ts` with more hooks (`useEffect`, `useRef`) or reconciliation strategies.
2. Add memoization/diffing so updating a single component doesn’t re-render the entire tree.
3. Improve the chart component with axis labels or responsive sizing.
4. Replace the mock data service with real API calls.

## 🛠 Commands

```bash
npm run type-check   # TypeScript diagnostics
npm run build        # Production build via Vite
npm run preview      # Preview the production bundle
```

Feel free to iterate further—this lab is a great stepping stone toward understanding how modern JSX frameworks work under the hood.
