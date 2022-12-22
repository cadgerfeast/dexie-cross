<template>
  <div class="client">
    <span class="title">Todos</span>
    <div class="todos">
      <header>
        <input class="check" type="checkbox" v-model="allChecked" @change="onBulkChange"/>
        <input class="new-todo-title" v-model="title" placeholder="What needs to be done?" @keyup.enter="addTodo"/>
      </header>
      <ul>
        <li v-for="todo in todos" :key="todo.id">
          <input class="check" type="checkbox" v-model="todo.completed" @change="onTodoChange(todo)"/>
          <input class="title" v-model="todo.title" @change="onTodoChange(todo)"/>
          <button @click="removeTodo(todo)">
            <Icon :src="'/icons/delete.svg'" size="18px" class="icon"/>
          </button>
        </li>
      </ul>
      <footer>
        <span class="remaining">{{ remaining.length }} items left</span>
      </footer>
    </div>
  </div>
</template>

<script lang="ts">
  // Helpers
  import { defineComponent } from 'vue';
  import { DexieCrossClient, DexieCrossClientTable } from '../src';
  import { Todo } from './index';
  // Constants
  class TodoDatabase extends DexieCrossClient {
    public todos!: DexieCrossClientTable<Todo>;
    constructor () {
      super('TodoDatabase', {
        hostUrl: `${window.location.origin}/usage/host`
      });
      this.addTable<Todo>('todos');
    }
  }
  const db = new TodoDatabase();

  export default defineComponent({
    name: 'Client',
    data () {
      return {
        todos: [] as Todo[],
        allChecked: false,
        title: ''
      };
    },
    computed: {
      remaining () {
        return this.todos.filter((todo) => !todo.completed);
      }
    },
    methods: {
      async getTodos () {
        this.todos = await db.todos.query({
          body: (todos) => todos.toArray()
        });
      },
      async addTodo () {
        const todo = {
          title: this.title,
          completed: false
        };
        await db.todos.query({
          args: {
            todo
          },
          body: (todos) => todos.add(todo)
        });
        this.title = '';
        await this.getTodos();
      },
      async updateTodo (todo: Todo) {
        const title = todo.title;
        const completed = todo.completed;
        await db.todos.query({
          args: {
            todo,
            title,
            completed
          },
          body: (todos) => todos.update(todo, { title, completed })
        });
      },
      async removeTodo (todo: Todo) {
        await db.todos.query({
          args: {
            todo
          },
          body: (todos) => todos.delete(todo.id)
        });
        await this.getTodos();
      },
      async onTodoChange (todo: Todo) {
        if (!todo.title.trim()) {
          await this.removeTodo(todo);
        } else {
          await this.updateTodo(todo);
        }
      },
      async onBulkChange () {
        const completed = this.allChecked;
        await db.todos.query({
          args: {
            completed
          },
          body: (todos) => todos.toCollection().modify({ completed })
        });
        await this.getTodos();
      }
    },
    mounted () {
      this.getTodos();
    }
  });
</script>

<style lang="scss" scoped>
  div.client {
    display: flex;
    flex-direction: column;
    align-items: center;
    > span.title {
      font-weight: bold;
      font-size: 40px;
      margin-bottom: 10px;
    }
    > div.todos {
      box-shadow: var(--madoc-shadow-20);
      width: 500px;
      > header {
        display: flex;
        flex-direction: row;
        align-items: center;
        box-shadow: var(--madoc-shadow-20);
        > input.check {
          margin: 0 10px;
        }
        > input.new-todo-title {
          border: none;
          padding: 16px;
          width: 100%;
        }
      }
      > ul {
        list-style: none;
        margin: 0;
        padding: 0;
        > li {
          border: 1px solid var(--madoc-grey-60);
          display: flex;
          flex-direction: row;
          align-items: center;
          > input.check {
            margin: 0 10px;
          }
          > input.title {
            border: none;
            background: none;
            padding: 16px;
            width: 100%;
          }
          > button {
            cursor: pointer;
            border: none;
            background: none;
            margin: 0 10px;
            color: var(--madoc-grey-30);
          }
        }
      }
      > footer {
        padding: 10px;
        > span.remaining {
          font-size: 12px;
          color: var(--madoc-grey-30);
        }
      }
    }
  }
</style>
