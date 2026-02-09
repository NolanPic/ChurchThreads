import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

global.IntersectionObserver = class IntersectionObserver {
  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ) {
    this.callback = callback;
    this.options = options;
  }

  private callback: IntersectionObserverCallback;
  private options?: IntersectionObserverInit;

  readonly root: Element | null = null;
  readonly rootMargin: string = "0px";
  readonly thresholds: ReadonlyArray<number> = [0];

  observe(element: Element): void {}

  unobserve(element: Element): void {}

  disconnect(): void {}

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}; 

// Mock window.scrollTo for motion libraries
Object.defineProperty(window, 'scrollTo', {
  value: () => {},
  writable: true
});

global.TEST_ORG_HOST = `dokimazo.${process.env.HOST}`;
