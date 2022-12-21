---
title: Dexie Cross - Usage - Client
---
# Client

In order to make request to a `Dexie` database on another domain, there's a little more you need to do:

- Make sure the host domain accepts to be embedded as an `iframe`. You should have correct <Anchor href="https://content-security-policy.com/">Content Security Policy</Anchor> header set.
- Create a really simple `html` file that only instantiate <Anchor href="/usage/host">the host database.</Anchor>
- Use the snippet bellow to connect to it.

Here is how to use it:

``` typescript
// Helpers
import Dexie from 'dexie';
import { DexieCrossClient, DexieCrossClientTable } from 'dexie-cross';

interface Todo {
  id?: number;
  title: string;
  completed: boolean;
}
// Create a class that defines the host tables
class TodoDatabase extends DexieCrossClient {
  public todos!: DexieCrossClientTable<Todo>;
  constructor () {
    super('TodoDatabase', {
      // The host url should be defined here (best is to create a single html file that only instantiate your db)
      hostUrl: 'https://dexie-cross.cadgerfeast.dev/usage/host'
    });
    this.addTable<Todo>('todos');
  }
}
const db = new TodoDatabase();

// Then, in order to make queries:
const todos = await db.todos.query((todos) => todos.toArray());
await db.todos.query((todos) => todos.add({
  title: 'new todo',
  completed: false
}));
```

## Playground

Here is an implementation of the `Todo MVC` application, using our database hosted on other domain.

<Anchor href="/usage/host">You can see the host view here.</Anchor>

<Client/>
