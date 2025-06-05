import 'react';

declare module 'react' {
  interface FormEvent<T = Element> {
    preventDefault(): void;
    target: EventTarget & T;
  }

  interface ChangeEvent<T = Element> {
    target: EventTarget & T;
  }

  type ReactNode = React.ReactElement | string | number | boolean | null | undefined;
} 
