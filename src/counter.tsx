/** @jsx createElement */
import { createElement, useState } from './jsx-runtime';

interface ButtonProps {
  onClick?: (event: MouseEvent) => void;
  className?: string;
  title?: string;
  children?: unknown;
}

const Button = ({ onClick, className = '', title, children }: ButtonProps) => (
  <button className={['counter-button', className].filter(Boolean).join(' ')} onClick={onClick} title={title}>
    {children}
  </button>
);

interface CounterProps {
  initialCount?: number;
  step?: number;
}

const Counter = ({ initialCount = 0, step = 1 }: CounterProps) => {
  const [count, setCount] = useState<number>(initialCount);

  const increment = () => setCount((current) => current + step);
  const decrement = () => setCount((current) => current - step);
  const reset = () => setCount(initialCount);

  return (
    <div className="counter">
      <h2>Team Productivity</h2>
      <div className="count">{count}</div>
      <div className="buttons">
        <Button onClick={increment} title={`Increase by ${step}`}>
          +
        </Button>
        <Button onClick={decrement} title={`Decrease by ${step}`}>
          -
        </Button>
        <Button onClick={reset} title="Reset counter">
          Reset
        </Button>
      </div>
    </div>
  );
};

export { Counter };
