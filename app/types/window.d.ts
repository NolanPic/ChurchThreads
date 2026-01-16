export {};

declare global {
  interface Window {
    __churchthreads?: {
      showNotification?: (title: string, body: string) => Promise<void>;
    };
  }
}
