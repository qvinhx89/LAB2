/** @jsx createElement */
import { createElement, createFragment } from './jsx-runtime';

interface CardProps {
  title?: string;
  subtitle?: string;
  footer?: unknown;
  className?: string;
  onClick?: (event: MouseEvent) => void;
  children?: unknown;
}

const Card = ({ title, subtitle, footer, className = '', onClick, children }: CardProps) => {
  const classes = ['card', className].filter(Boolean).join(' ');
  return (
    <div className={classes} onClick={onClick}>
      {(title || subtitle) && (
        <header>
          {title && <h3>{title}</h3>}
          {subtitle && <p>{subtitle}</p>}
        </header>
      )}
      <div className="card-body">{children}</div>
      {footer && <footer>{footer}</footer>}
    </div>
  );
};

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children?: unknown;
  footer?: unknown;
}

const Modal = ({ isOpen, onClose, title, children, footer }: ModalProps) => {
  if (!isOpen) {
    return createFragment(null);
  }

  const handleOverlayClick = (event: MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          {title && <h3 style={{ margin: 0 }}>{title}</h3>}
          <button onClick={() => onClose?.()} aria-label="Close modal">
            ×
          </button>
        </header>
        <div>{children}</div>
        {footer && <footer style={{ marginTop: 16 }}>{footer}</footer>}
      </div>
    </div>
  );
};

interface FormProps {
  onSubmit?: (event: SubmitEvent) => void;
  className?: string;
  children?: unknown;
}

const Form = ({ onSubmit, className = '', children }: FormProps) => {
  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    onSubmit?.(event);
  };

  return (
    <form className={['form', className].filter(Boolean).join(' ')} onSubmit={handleSubmit}>
      {children}
    </form>
  );
};

interface InputProps {
  type?: string;
  value?: string;
  name?: string;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  ref?: any;
  onChange?: (value: string, event: Event) => void;
}

const Input = ({
  type = 'text',
  value,
  name,
  placeholder,
  className = '',
  autoFocus = false,
  ref,
  onChange,
}: InputProps) => {
  const handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    onChange?.(target.value, event);
  };

  return (
    <input
      className={['input', className].filter(Boolean).join(' ')}
      type={type}
      value={value}
      name={name}
      placeholder={placeholder}
      autoFocus={autoFocus}
      ref={ref}
      onInput={handleInput}
    />
  );
};

export { Card, Modal, Form, Input };
