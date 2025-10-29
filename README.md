# Lab 2 – JSX + TypeScript Runtime (Without React)

This project follows the requirements from **Lab 2: JSX, TypeScript** (MSc. Trần Vĩnh Khiêm). It demonstrates how to configure TypeScript to compile JSX into a fully custom runtime, render virtual nodes into the DOM, implement basic hooks, and build a small dashboard application with reusable components.

## 📁 Project Structure


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

