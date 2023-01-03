<template>
  <div class="host">
    <header>
      <div class="actions">
        <button @click="addTodo">
          <Icon :src="'/icons/add.svg'" size="18px" class="icon"/>
        </button>
      </div>
    </header>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Title</th>
          <th>Completed</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="todo in todos" :key="todo.id">
          <td>{{ todo.id }}</td>
          <td class="editable">
            <input class="title" v-model="todo.title" @change="onChangeTitle(todo)"/>
          </td>
          <td>
            <input type="checkbox" v-model="todo.completed" @change="onChangeCompleted($event, todo)"/>
          </td>
        </tr>
      </tbody>
    </table>
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
        hostUrl: `${window.location.origin}/_db.html`
      });
      this.addTable<Todo>('todos');
    }
  }
  const db = new TodoDatabase();

  export default defineComponent({
    name: 'Host',
    data () {
      return {
        todos: [] as Todo[]
      };
    },
    methods: {
      async getTodos () {
        this.todos = await db.todos.toArray();
      },
      async addTodo () {
        await db.todos.add({
          title: 'My new Todo',
          completed: false
        });
      },
      async onChangeTitle (todo: Todo) {
        const newTitle = todo.title.trim();
        if (newTitle) {
          await db.todos.update(todo, {
            title: newTitle
          });
        } else {
          await db.todos.delete(todo.id as number);
        }
        await this.getTodos();
      },
      async onChangeCompleted (e: Event, todo: Todo) {
        await db.todos.update(todo, {
          completed: (e.target as HTMLInputElement).checked
        });
      }
    },
    mounted () {
      this.getTodos();
    }
  });
</script>

<style lang="scss" scoped>
  div.host {
    > header {
      display: flex;
      flex-direction: row;
      margin-bottom: 20px;
      > div.actions {
        margin-left: auto;
        > button {
          background-color: var(--madoc-grey-100);
          border: 1px solid #999;
          font-size: 14px;
          border-radius: 5px;
          cursor: pointer;
        }
      }
    }
    > table {
      width: 100%;
      > tbody {
        > tr {
          > td.editable {
            padding: 0;
            > input {
              box-sizing: border-box;
              padding: 6px 13px;
              border: none;
              width: 100%;
              background: none;
            }
          }
        }
      }
    }
  }
</style>
