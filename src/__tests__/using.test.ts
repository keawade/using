import { Disposable } from '../Disposable';
import { Destroyable } from '../Destroyable';
import { using } from '../using';

describe('using', () => {
  const mockedResourceSync = jest.fn<string, never[]>();
  const mockedResourceAsync = jest.fn<Promise<string>, never[]>();

  describe('dispose', () => {
    const mockedDispose = jest.fn();

    interface DoThing extends Disposable {
      doThing: () => string;
    }
    interface DoThingAsync extends Disposable {
      doThingAsync: () => Promise<string>;
    }

    it('should dispose of sync resource', async () => {
      const exampleResource: DoThing = {
        doThing: mockedResourceSync,
        dispose: () => {
          mockedDispose();
        },
      };

      mockedResourceSync.mockReturnValueOnce('howdy');

      const actual = await using(exampleResource, async (resource) => {
        return resource.doThing();
      });

      expect(actual).toBe('howdy');
      expect(mockedResourceSync).toBeCalledTimes(1);
      expect(mockedDispose).toBeCalledTimes(1);
    });

    it('should dispose of async resource', async () => {
      const exampleResource: DoThingAsync = {
        doThingAsync: mockedResourceAsync,
        dispose: async () => {
          mockedDispose();
        },
      };

      mockedResourceAsync.mockResolvedValueOnce('howdy');

      const actual = await using(exampleResource, (resource) => {
        return resource.doThingAsync();
      });

      expect(actual).toBe('howdy');
      expect(mockedResourceAsync).toBeCalledTimes(1);
      expect(mockedDispose).toBeCalledTimes(1);
    });

    it('should dispose dictionary of sync resources', async () => {
      const exampleResourceOne: DoThing = {
        doThing: mockedResourceSync,
        dispose: () => {
          mockedDispose();
        },
      };
      const exampleResourceTwo: DoThing = {
        doThing: mockedResourceSync,
        dispose: () => {
          mockedDispose();
        },
      };

      mockedResourceSync.mockReturnValueOnce('one');
      mockedResourceSync.mockReturnValueOnce('two');

      const actual = await using(
        { exampleResourceOne, exampleResourceTwo },
        async ({ exampleResourceOne, exampleResourceTwo }) => {
          return {
            exampleOne: exampleResourceOne.doThing(),
            exampleTwo: exampleResourceTwo.doThing(),
          };
        },
      );

      expect(actual).toStrictEqual({ exampleOne: 'one', exampleTwo: 'two' });
      expect(mockedResourceSync).toBeCalledTimes(2);
      expect(mockedDispose).toBeCalledTimes(2);
    });

    it('should dispose dictionary of async resources', async () => {
      const exampleResourceOne: DoThingAsync = {
        doThingAsync: mockedResourceAsync,
        dispose: async () => {
          mockedDispose();
        },
      };
      const exampleResourceTwo: DoThingAsync = {
        doThingAsync: mockedResourceAsync,
        dispose: async () => {
          mockedDispose();
        },
      };

      mockedResourceAsync.mockResolvedValueOnce('one');
      mockedResourceAsync.mockResolvedValueOnce('two');

      const actual = await using(
        { exampleResourceOne, exampleResourceTwo },
        async ({ exampleResourceOne, exampleResourceTwo }) => {
          return {
            exampleOne: await exampleResourceOne.doThingAsync(),
            exampleTwo: await exampleResourceTwo.doThingAsync(),
          };
        },
      );

      expect(actual).toStrictEqual({ exampleOne: 'one', exampleTwo: 'two' });
      expect(mockedResourceAsync).toBeCalledTimes(2);
      expect(mockedDispose).toBeCalledTimes(2);
    });

    it('should dispose dictionary of mixed async and sync resources', async () => {
      const exampleResourceOne: DoThing = {
        doThing: mockedResourceSync,
        dispose: () => {
          mockedDispose();
        },
      };
      const exampleResourceTwo: DoThingAsync = {
        doThingAsync: mockedResourceAsync,
        dispose: async () => {
          mockedDispose();
        },
      };

      mockedResourceSync.mockReturnValueOnce('one');
      mockedResourceAsync.mockResolvedValueOnce('two');

      const actual = await using(
        { exampleResourceOne, exampleResourceTwo },
        async ({ exampleResourceOne, exampleResourceTwo }) => {
          return {
            exampleOne: exampleResourceOne.doThing(),
            exampleTwo: await exampleResourceTwo.doThingAsync(),
          };
        },
      );

      expect(actual).toStrictEqual({ exampleOne: 'one', exampleTwo: 'two' });
      expect(mockedResourceSync).toBeCalledTimes(1);
      expect(mockedResourceAsync).toBeCalledTimes(1);
      expect(mockedDispose).toBeCalledTimes(2);
    });

    it('should throw on error if option is enabled', async () => {
      const exampleResource = {
        doThing: mockedResourceSync,
      };

      mockedResourceSync.mockReturnValueOnce('howdy');

      try {
        await using(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          exampleResource as any,
          async (resource) => {
            return resource.doThing();
          },
          { throwOnError: true },
        );
        fail('should have thrown an error');
      } catch (err) {
        expect(err).toBeDefined();
        expect(err).toEqual(
          new Error(`Unable to dispose resource '{ doThing: [Function] }'`),
        );

        expect(mockedResourceSync).toBeCalledTimes(1);
        expect(mockedDispose).toBeCalledTimes(0);
      }
    });
  });

  describe('destroy', () => {
    const mockedDestroy = jest.fn();

    interface DoThingDestroy extends Destroyable {
      doThingDestroy: () => string;
    }
    interface DoThingDestroyAsync extends Destroyable {
      doThingDestroyAsync: () => Promise<string>;
    }

    it('should destroy of sync resource', async () => {
      const exampleResource: DoThingDestroy = {
        doThingDestroy: mockedResourceSync,
        destroy: () => {
          mockedDestroy();
        },
      };

      mockedResourceSync.mockReturnValueOnce('howdy');

      const actual = await using(
        exampleResource,
        async (resource) => {
          return resource.doThingDestroy();
        },
        { key: 'destroy' },
      );

      expect(actual).toBe('howdy');
      expect(mockedResourceSync).toBeCalledTimes(1);
      expect(mockedDestroy).toBeCalledTimes(1);
    });

    it('should destroy of async resource', async () => {
      const exampleResource: DoThingDestroyAsync = {
        doThingDestroyAsync: mockedResourceAsync,
        destroy: async () => {
          mockedDestroy();
        },
      };

      mockedResourceAsync.mockResolvedValueOnce('howdy');

      const actual = await using(
        exampleResource,
        (resource) => {
          return resource.doThingDestroyAsync();
        },
        { key: 'destroy' },
      );

      expect(actual).toBe('howdy');
      expect(mockedResourceAsync).toBeCalledTimes(1);
      expect(mockedDestroy).toBeCalledTimes(1);
    });

    it('should destroy dictionary of sync resources', async () => {
      const exampleResourceOne: DoThingDestroy = {
        doThingDestroy: mockedResourceSync,
        destroy: () => {
          mockedDestroy();
        },
      };
      const exampleResourceTwo: DoThingDestroy = {
        doThingDestroy: mockedResourceSync,
        destroy: () => {
          mockedDestroy();
        },
      };

      mockedResourceSync.mockReturnValueOnce('one');
      mockedResourceSync.mockReturnValueOnce('two');

      const actual = await using(
        { exampleResourceOne, exampleResourceTwo },
        async ({ exampleResourceOne, exampleResourceTwo }) => {
          return {
            exampleOne: exampleResourceOne.doThingDestroy(),
            exampleTwo: exampleResourceTwo.doThingDestroy(),
          };
        },
        { key: 'destroy' },
      );

      expect(actual).toStrictEqual({ exampleOne: 'one', exampleTwo: 'two' });
      expect(mockedResourceSync).toBeCalledTimes(2);
      expect(mockedDestroy).toBeCalledTimes(2);
    });

    it('should destroy dictionary of async resources', async () => {
      const exampleResourceOne: DoThingDestroyAsync = {
        doThingDestroyAsync: mockedResourceAsync,
        destroy: async () => {
          mockedDestroy();
        },
      };
      const exampleResourceTwo: DoThingDestroyAsync = {
        doThingDestroyAsync: mockedResourceAsync,
        destroy: async () => {
          mockedDestroy();
        },
      };

      mockedResourceAsync.mockResolvedValueOnce('one');
      mockedResourceAsync.mockResolvedValueOnce('two');

      const actual = await using(
        { exampleResourceOne, exampleResourceTwo },
        async ({ exampleResourceOne, exampleResourceTwo }) => {
          return {
            exampleOne: await exampleResourceOne.doThingDestroyAsync(),
            exampleTwo: await exampleResourceTwo.doThingDestroyAsync(),
          };
        },
        { key: 'destroy' },
      );

      expect(actual).toStrictEqual({ exampleOne: 'one', exampleTwo: 'two' });
      expect(mockedResourceAsync).toBeCalledTimes(2);
      expect(mockedDestroy).toBeCalledTimes(2);
    });

    it('should destroy dictionary of mixed async and sync resources', async () => {
      const exampleResourceOne: DoThingDestroy = {
        doThingDestroy: mockedResourceSync,
        destroy: () => {
          mockedDestroy();
        },
      };
      const exampleResourceTwo: DoThingDestroyAsync = {
        doThingDestroyAsync: mockedResourceAsync,
        destroy: async () => {
          mockedDestroy();
        },
      };

      mockedResourceSync.mockReturnValueOnce('one');
      mockedResourceAsync.mockResolvedValueOnce('two');

      const actual = await using(
        { exampleResourceOne, exampleResourceTwo },
        async ({ exampleResourceOne, exampleResourceTwo }) => {
          return {
            exampleOne: exampleResourceOne.doThingDestroy(),
            exampleTwo: await exampleResourceTwo.doThingDestroyAsync(),
          };
        },
        { key: 'destroy' },
      );

      expect(actual).toStrictEqual({ exampleOne: 'one', exampleTwo: 'two' });
      expect(mockedResourceSync).toBeCalledTimes(1);
      expect(mockedResourceAsync).toBeCalledTimes(1);
      expect(mockedDestroy).toBeCalledTimes(2);
    });

    it('should throw on error if option is enabled', async () => {
      const exampleResource = {
        doThing: mockedResourceSync,
      };

      mockedResourceSync.mockReturnValueOnce('howdy');

      try {
        await using(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          exampleResource as any,
          async (resource) => {
            return resource.doThing();
          },
          { key: 'destroy', throwOnError: true },
        );
        fail('should have thrown an error');
      } catch (err) {
        expect(err).toBeDefined();
        expect(err).toEqual(
          new Error(`Unable to destroy resource '{ doThing: [Function] }'`),
        );

        expect(mockedResourceSync).toBeCalledTimes(1);
        expect(mockedDestroy).toBeCalledTimes(0);
      }
    });
  });
});
