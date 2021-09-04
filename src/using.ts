import { inspect } from 'util';
import { Destroyable, DestroyableDictionary } from './Destroyable';
import { Disposable, DisposableDictionary } from './Disposable';

/**
 * Provides a convenient syntax that ensures the correct use of Disposable objects
 *
 * @param resource - Resource to dispose or destroy after using
 * @param usingFunction - Resource use context
 * @param options.key - Key of disposing function
 * @param options.throwOnError - Enable throw on error
 */
export const using = async <
  Resource extends
    | Disposable
    | DisposableDictionary
    | Destroyable
    | DestroyableDictionary,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ReturnType = any,
>(
  resource: Resource,
  usingFunction: (resource: Resource) => Promise<ReturnType>,
  options: { key?: 'dispose' | 'destroy'; throwOnError?: boolean } = {},
): Promise<ReturnType> => {
  try {
    return await usingFunction(resource);
  } finally {
    const key = options.key ?? 'dispose';

    switch (key) {
      case 'dispose':
        if (isDisposable(resource)) {
          await resource.dispose();
        } else {
          await Promise.all(
            Object.values(resource).map((resourceKey) => {
              if (isDisposable(resourceKey)) {
                return resourceKey.dispose();
              }

              if (options.throwOnError) {
                throwError(resource, key);
              }
            }),
          );
        }
        break;

      case 'destroy':
        if (isDestroyable(resource)) {
          await resource.destroy();
        } else {
          await Promise.all(
            Object.values(resource).map((resourceKey) => {
              if (isDestroyable(resourceKey)) {
                return resourceKey.destroy();
              }

              if (options.throwOnError) {
                throwError(resource, key);
              }
            }),
          );
        }
    }
  }
};

const isDisposable = (resource: {
  destroy?: unknown;
  dispose?: unknown;
}): resource is Disposable => {
  return (
    typeof resource.dispose !== 'undefined' &&
    typeof resource.dispose === 'function'
  );
};

const isDestroyable = (resource: {
  destroy?: unknown;
  dispose?: unknown;
}): resource is Destroyable => {
  return (
    typeof resource.destroy !== 'undefined' &&
    typeof resource.destroy === 'function'
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const throwError = (resource: any, action: 'dispose' | 'destroy'): never => {
  throw new Error(
    `Unable to ${action} resource '${inspect(resource, { depth: 0 })}'`,
  );
};
