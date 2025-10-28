/** @jsx createElement */
import { createElement, mount } from './jsx-runtime';
import { Dashboard } from './dashboard';
import './styles.css';

declare global {
  interface Window {
    __APP_ROOT__?: HTMLElement;
  }
}

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element #root not found in DOM.');
}

window.__APP_ROOT__ = container;

mount(<Dashboard />, container as HTMLElement);
