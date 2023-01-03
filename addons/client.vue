<template>
  <div class="client">
    <span class="title">Todos</span>
    <div class="todos">
      <header>
        <input class="check" type="checkbox" v-model="bulkChecked" :indeterminate="bulkState === 'partial'" @change="onBulkChange"/>
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
  // Types
  type BulkState = 'empty'|'partial'|'full';
  // Constants
  class TodoDatabase extends DexieCrossClient {
    public todos!: DexieCrossClientTable<Todo>;
    constructor () {
      super('TodoDatabase', {
        hostUrl: `${window.location.origin}/_db.html`
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
        bulkChecked: false,
        bulkState: 'empty' as BulkState,
        title: ''
      };
    },
    computed: {
      remaining () {
        return this.todos.filter((todo) => !todo.completed);
      }
    },
    methods: {
      updateBulkState () {
        const checkedLength = this.todos.filter((t) => t.completed).length;
        if (checkedLength === 0) {
          this.bulkState = 'empty';
          this.bulkChecked = false;
        } else if (checkedLength === this.todos.length) {
          this.bulkState = 'full';
          this.bulkChecked = true;
        } else {
          this.bulkState = 'partial';
          this.bulkChecked = false;
        }
      },
      async getTodos () {
        this.todos = await db.todos.toArray();
        this.updateBulkState();
      },
      async addTodo () {
        await db.todos.add({
          title: this.title,
          completed: false
        });
        this.title = '';
        await this.getTodos();
        this.updateBulkState();
      },
      async updateTodo (todo: Todo) {
        const title = todo.title;
        const completed = todo.completed;
        await db.todos.update(todo, {
          title,
          completed
        });
        this.updateBulkState();
      },
      async removeTodo (todo: Todo) {
        await db.todos.delete(todo.id as number);
        await this.getTodos();
        this.updateBulkState();
      },
      async onTodoChange (todo: Todo) {
        if (!todo.title.trim()) {
          await this.removeTodo(todo);
        } else {
          await this.updateTodo(todo);
        }
      },
      async onBulkChange () {
        this.bulkState = this.bulkChecked ? 'full' : 'empty';
        const completed = this.bulkChecked;
        await db.todos.update({ completed });
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
