# Using

![GitHub Workflow Status (branch)](https://img.shields.io/github/workflow/status/keawade/using/npm-publish/master)
![npm](https://img.shields.io/npm/v/@keawade/using)
![NPM](https://img.shields.io/npm/l/@keawade/using)
![Snyk Vulnerabilities for npm package version](https://img.shields.io/snyk/vulnerabilities/npm/@keawade/using)

Provides a convenient syntax that ensures the correct use of Disposable or
Destroyable objects. That is, objects with either a `dispose()` or `destroy()`
methods on them.

This pattern is used primarily to clean up connections to remote resources. For
example, the AWS SDK provides `.destroy()` methods on many of their client
classes.

## Usage

Call `using` and for its first argument, pass it a resource or dictionary of
resources to be disposed or destroyed after the use context closes. For its
second argument, pass a function that will use the provided resources. When this
function's scope closes, the `using` function will automatically call the
disposal methods on each resource.

Finally, a third argument can be optionally passed to either change the target
disposal method from `.dispose()` to `.destroy()` or to enable throwing on
errors.

### Dispose

By default, `using` will attempt to call `.dispose()`:

```typescript
const createCustomer = async (customer: ICustomer) => {
  // Value returned from provided function is returned 
  const createdCustomer = await using(
    new Repository<Customer>(),
    // Type is inferred
    (customerRepository) => {
      return customerRepository.create(customer);
      // customerRepository.dispose() will be automatically called when the scope closes
    },
  );

  return createdCustomer;
};
```

### Destroy

You can optionally specify to call `.destroy()` instead:

```typescript
const createCustomer = async (customer: ICustomer) => {
  // Value returned from provided function is returned 
  const createdCustomer = await using(
    new DynamoDBClient(dynamoDbConfig),
    // Type is inferred
    (dynamoDbClient) => {
      const command = new DynamoDbPutCommand({
        TableName: 'customer',
        ... // data, etc
      })
      return dynamoDbClient.send(command);
      // dynamoDbClient.destroy() will be automatically called when the scope closes
    },
    // Must specify key to override default value of 'dispose'
    { key: 'destroy' },
  );

  return createdCustomer;
};
```

### Dictionary

Instead of passing a single resource, you can pass a dictionary of resources and
they will all be disposed or destroyed when the function closure exits.

```typescript
const getUsersFavoriteRecipe = async (userId: string) => {
  // Value returned from provided function is returned
  const favoriteRecipe = await using(
    {
      userRepository: new Repository<User>(),
      recipeRepository: new Repository<Recipe>(),
    },
    async ({
      // Dictionary item types are inferred
      userRepository,
      recipeRepository,
    }) => {
      const user = await userRepository.get(userId);
      return recipeRepository.get(user.favoriteRecipeId);
      // userRepository.dispose() and recipeRepository.dispose() will be automatically called when the scope closes
    }
  );

  return favoriteRecipe;
};
```

Same as earlier, you can override the `key` to call `.destroy()`
instead.

### `throwOnError`

You can provide the option `throwOnError` to throw if the disposing method was
not found. This is intended for debugging during development and its use is
discouraged in production environments as it will throw immediately and will not
dispose remaining items in a dictionary.
