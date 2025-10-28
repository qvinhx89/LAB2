type Child = VNode | string | number;

type ComponentReturn = VNode | string | number | null | undefined;

export interface ComponentProps {
  children?: Child[];
  [key: string]: unknown;
}

export type ComponentFunction = (props: ComponentProps) => ComponentReturn;

export interface VNode {
  type: string | ComponentFunction;
  props: ComponentProps;
  children: Child[];
  key?: string | number;
}

type Renderable = VNode | string | number;

interface ComponentStateRecord {
  hooks: unknown[];
  lastUsedRender: number;
}

interface ComponentContext {
  path: string;
  record: ComponentStateRecord;
  hookIndex: number;
}

const FRAGMENT_TYPE = 'fragment';
const componentState = new Map<string, ComponentStateRecord>();
let currentContext: ComponentContext | null = null;
let renderVersion = 0;
let rootVNode: VNode | null = null;
let rootContainer: HTMLElement | null = null;
let rerenderQueued = false;

const delegatedEvents = new Map<string, Map<string, EventListener>>();
const attachedDelegatedListeners = new Set<string>();
let usedEventHandlerIds = new Set<string>();

export function createElement(
  type: string | ComponentFunction,
  props: Record<string, unknown> | null,
  ...children: (Renderable | Renderable[] | null | undefined | boolean)[]
): VNode {
  const resolvedProps: ComponentProps = props ? { ...props } : {};
  const flatChildren: Child[] = [];

  const pushChild = (value: Renderable | Renderable[] | null | undefined | boolean) => {
    if (value === null || value === undefined || typeof value === 'boolean') {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(pushChild as any);
      return;
    }
    flatChildren.push(value as Child);
  };

  children.forEach(pushChild);

  if (!resolvedProps.children) {
    resolvedProps.children = flatChildren;
  }

  const vnode: VNode = {
    type: (type as any) ?? FRAGMENT_TYPE,
    props: resolvedProps,
    children: flatChildren,
  };

  if ('key' in resolvedProps) {
    vnode.key = resolvedProps.key as string | number;
    delete resolvedProps.key;
  }

  return vnode;
}

export function createFragment(
  props: Record<string, unknown> | null,
  ...children: (Renderable | Renderable[] | null | undefined | boolean)[]
): VNode {
  return createElement(FRAGMENT_TYPE, props, ...children);
}

export function mount(vnode: VNode, container: HTMLElement): void {
  rootVNode = vnode;
  rootContainer = container;
  renderRoot();
}

export function renderToDOM(vnode: Renderable, path = '0'): Node {
  if (typeof vnode === 'string' || typeof vnode === 'number') {
    return document.createTextNode(String(vnode));
  }

  if (vnode.type === FRAGMENT_TYPE) {
    const fragment = document.createDocumentFragment();
    vnode.children.forEach((child, index) => {
      const childNode = renderToDOM(child, `${path}.${index}`);
      fragment.appendChild(childNode);
    });
    return fragment;
  }

  if (typeof vnode.type === 'function') {
    return renderComponent(vnode, path);
  }

  return renderElement(vnode, path);
}

export function useState<T>(initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  if (!currentContext) {
    throw new Error('useState must be called within a component.');
  }

  const { record } = currentContext;
  const hookIndex = currentContext.hookIndex++;

  if (hookIndex >= record.hooks.length) {
    record.hooks.push(initialValue);
  }

  const setState = (value: T | ((prev: T) => T)) => {
    const current = record.hooks[hookIndex] as T;
    record.hooks[hookIndex] =
      typeof value === 'function' ? (value as (prev: T) => T)(current) : value;
    scheduleRender();
  };

  return [record.hooks[hookIndex] as T, setState];
}

function renderRoot(): void {
  if (!rootVNode || !rootContainer) {
    return;
  }

  renderVersion += 1;
  usedEventHandlerIds = new Set();
  rerenderQueued = false;

  const dom = renderToDOM(rootVNode, '0');
  rootContainer.replaceChildren(dom);

  cleanupComponentState();
  cleanupDelegatedHandlers();
}

function scheduleRender(): void {
  if (!rootVNode || !rootContainer) {
    return;
  }
  if (rerenderQueued) {
    return;
  }
  rerenderQueued = true;
  setTimeout(() => renderRoot(), 0);
}

function renderComponent(vnode: VNode, path: string): Node {
  const existingRecord = componentState.get(path) ?? {
    hooks: [],
    lastUsedRender: 0,
  };

  existingRecord.lastUsedRender = renderVersion;
  componentState.set(path, existingRecord);

  const prevContext = currentContext;
  currentContext = {
    path,
    record: existingRecord,
    hookIndex: 0,
  };

  const component = vnode.type as ComponentFunction;
  const result = component({ ...vnode.props, children: vnode.children });

  currentContext = prevContext;

  if (result === null || result === undefined || typeof result === 'boolean') {
    return document.createComment('empty');
  }

  return renderToDOM(result as Renderable, path);
}

function renderElement(vnode: VNode, path: string): Node {
  const element = document.createElement(vnode.type as string);

  applyPropsToElement(element, vnode.props, path);

  vnode.children.forEach((child, index) => {
    const childNode = renderToDOM(child, `${path}.${index}`);
    element.appendChild(childNode);
  });

  return element;
}

function applyPropsToElement(element: HTMLElement, props: ComponentProps, path: string): void {
  Object.entries(props).forEach(([key, value]) => {
    if (key === 'children' || value === undefined || value === null) {
      return;
    }

    if (key === 'ref') {
      applyRef(value, element);
      return;
    }

    if (key === 'className') {
      element.setAttribute('class', String(value));
      return;
    }

    if (key === 'style') {
      applyStyle(element, value);
      return;
    }

    if (key.startsWith('on') && typeof value === 'function') {
      const eventType = key.slice(2).toLowerCase();
      registerDelegatedEvent(element, eventType, path, value as EventListener);
      return;
    }

    if (typeof value === 'boolean') {
      if (value) {
        element.setAttribute(key, '');
        if (key in element) {
          (element as any)[key] = true;
        }
      } else {
        element.removeAttribute(key);
        if (key in element) {
          (element as any)[key] = false;
        }
      }
      return;
    }

    if (
      key === 'dangerouslySetInnerHTML' &&
      typeof value === 'object' &&
      value &&
      '__html' in (value as Record<string, unknown>)
    ) {
      element.innerHTML = (value as { __html: string }).__html;
      return;
    }

    if (key in element) {
      try {
        (element as any)[key] = value;
        return;
      } catch {
        // Ignore assignment errors, fallback to attribute
      }
    }

    element.setAttribute(key, String(value));
  });
}

function applyRef(ref: unknown, element: HTMLElement): void {
  if (typeof ref === 'function') {
    ref(element);
    return;
  }
  if (ref && typeof ref === 'object' && 'current' in (ref as Record<string, unknown>)) {
    (ref as { current: HTMLElement | null }).current = element;
  }
}

function applyStyle(element: HTMLElement, value: unknown): void {
  if (typeof value === 'string') {
    element.setAttribute('style', value);
    return;
  }

  if (typeof value === 'object' && value !== null) {
    const styleObject = value as Record<string, string | number>;
    const styleEntries = Object.entries(styleObject)
      .map(([prop, propValue]) => `${camelToKebab(prop)}:${formatStyleValue(propValue)}`);
    element.setAttribute('style', styleEntries.join(';'));
  }
}

function camelToKebab(value: string): string {
  return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function formatStyleValue(value: string | number): string {
  if (typeof value === 'number') {
    return `${value}px`;
  }
  return value;
}

function registerDelegatedEvent(
  element: HTMLElement,
  eventType: string,
  path: string,
  handler: EventListener
): void {
  const handlerId = `${path}:${eventType}`;
  usedEventHandlerIds.add(handlerId);

  let handlers = delegatedEvents.get(eventType);
  if (!handlers) {
    handlers = new Map();
    delegatedEvents.set(eventType, handlers);
  }
  handlers.set(handlerId, handler);

  ensureDelegatedListener(eventType);
  element.setAttribute(`data-event-${eventType}`, handlerId);
}

function ensureDelegatedListener(eventType: string): void {
  if (attachedDelegatedListeners.has(eventType)) {
    return;
  }

  document.addEventListener(eventType, delegatedEventProxy);
  attachedDelegatedListeners.add(eventType);
}

function cleanupDelegatedHandlers(): void {
  const eventsToRemove: string[] = [];

  delegatedEvents.forEach((handlers, eventType) => {
    handlers.forEach((_, handlerId) => {
      if (!usedEventHandlerIds.has(handlerId)) {
        handlers.delete(handlerId);
      }
    });

    if (handlers.size === 0) {
      eventsToRemove.push(eventType);
    }
  });

  eventsToRemove.forEach((eventType) => {
    delegatedEvents.delete(eventType);
    if (attachedDelegatedListeners.has(eventType)) {
      document.removeEventListener(eventType, delegatedEventProxy);
      attachedDelegatedListeners.delete(eventType);
    }
  });

  usedEventHandlerIds.clear();
}

function delegatedEventProxy(event: Event): void {
  const eventType = event.type;
  let target = event.target as HTMLElement | null;
  while (target) {
    const handlerId = target.getAttribute(`data-event-${eventType}`);
    if (handlerId) {
      const handler = delegatedEvents.get(eventType)?.get(handlerId);
      if (handler) {
        handler.call(target, event);
      }
      break;
    }
    target = target.parentElement;
  }
}

function cleanupComponentState(): void {
  componentState.forEach((record, path) => {
    if (record.lastUsedRender !== renderVersion) {
      componentState.delete(path);
    }
  });
}

declare global {
  namespace JSX {
    type Element = VNode;
    interface ElementChildrenAttribute {
      children: {};
    }
    interface IntrinsicAttributes {
      key?: string | number;
    }
    interface IntrinsicElements {
      [elemName: string]: Record<string, unknown>;
    }
  }
}
