---
title: Dexie Cross - Usage - Host
---
# Host

Here is the current host data for the domain. You can modify directly on this table.

<Anchor href="/usage/client">You can see the client view here.</Anchor>

<Host/>

In order to accept queries from other domains, a db should be using the `DexieCrossHost` addon.

Here is how to use it:

``` typescript
// Helpers
import Dexie from 'dexie';
import { DexieCrossHost } from 'dexie-cross';

interface Todo {
  id?: number;
  title: string;
  completed: boolean;
}
class TodoDatabase extends Dexie {
  public todos!: Dexie.Table<Todo, number>;
  constructor () {
    // It's as simple as adding this to your addons
    super('TodoDatabase', { addons: [DexieCrossHost] });
    this.version(1).stores({
      todos: '++id, title, completed'
    });
  }
}
const db = new TodoDatabase();
// Then you can use your database as you would normally
```