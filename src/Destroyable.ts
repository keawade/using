export interface Destroyable {
  destroy(): void | Promise<void>;
}

export interface DestroyableDictionary {
  [key: string]: Destroyable;
}
