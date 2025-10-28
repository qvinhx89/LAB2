/** @jsx createElement */
import { createElement, useState } from './jsx-runtime';
import { Form, Input } from './components';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: number;
}

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

const TodoItem = ({ todo, onToggle, onDelete }: TodoItemProps) => {
  const handleToggle = () => onToggle(todo.id);
  const handleDelete = () => onDelete(todo.id);

  return (
    <div className={['todo-item', todo.completed ? 'completed' : ''].filter(Boolean).join(' ')}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
        <input type="checkbox" checked={todo.completed} onChange={handleToggle} />
        <span className="todo-text">{todo.text}</span>
      </label>
      <div className="todo-actions">
        <button onClick={handleToggle}>{todo.completed ? 'Undo' : 'Done'}</button>
        <button onClick={handleDelete}>Delete</button>
      </div>
    </div>
  );
};

interface AddTodoFormProps {
  onAdd: (text: string) => void;
}

const AddTodoForm = ({ onAdd }: AddTodoFormProps) => {
  const [inputRef] = useState<{ current: HTMLInputElement | null }>({ current: null });

  const handleSubmit = () => {
    const trimmed = inputRef.current?.value.trim();
    if (!trimmed) {
      return;
    }
    onAdd(trimmed);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <Form
      className="todo-form"
      onSubmit={(event: SubmitEvent) => {
        handleSubmit();
      }}
    >
      <div style={{ display: 'flex', gap: 12 }}>
        <Input
          ref={inputRef}
          placeholder="Add a new task"
          autoFocus
        />
        <button type="submit">Add</button>
      </div>
    </Form>
  );
};

const filterOptions = ['all', 'active', 'completed'] as const;

type Filter = (typeof filterOptions)[number];

const TodoApp = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<Filter>('all');

  const addTodo = (text: string) => {
    const todo: Todo = {
      id: Date.now(),
      text,
      completed: false,
      createdAt: Date.now(),
    };
    setTodos((current) => [...current, todo]);
  };

  const toggleTodo = (id: number) => {
    setTodos((current) =>
      current.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              completed: !todo.completed,
            }
          : todo
      )
    );
  };

  const deleteTodo = (id: number) => {
    setTodos((current) => current.filter((todo) => todo.id !== id));
  };

  const filteredTodos = todos.filter((todo) => {
    if (filter === 'completed') {
      return todo.completed;
    }
    if (filter === 'active') {
      return !todo.completed;
    }
    return true;
  });

  const completedCount = todos.filter((todo) => todo.completed).length;

  return (
    <div className="todo-app">
      <header>
        <h2>Todo List</h2>
        <div className="control-group">
          <select
            value={filter}
            onChange={(event: Event) => {
              const target = event.target as HTMLSelectElement;
              setFilter(target.value as Filter);
            }}
          >
            {filterOptions.map((option) => (
              <option key={option} value={option}>
                {option[0].toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
          <div className="summary" style={{ margin: 0 }}>
            <div className="summary-item">Total: {todos.length}</div>
            <div className="summary-item">Completed: {completedCount}</div>
          </div>
        </div>
      </header>
      <AddTodoForm onAdd={addTodo} />
      <div className="todo-items">
        {filteredTodos.length === 0 && <p>No tasks yet. Add one above!</p>}
        {filteredTodos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} onDelete={deleteTodo} />
        ))}
      </div>
    </div>
  );
};

export { TodoApp, type Todo };
