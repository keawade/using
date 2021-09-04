export interface Disposable {
  dispose(): void | Promise<void>;
}

export interface DisposableDictionary {
  [key: string]: Disposable;
}
