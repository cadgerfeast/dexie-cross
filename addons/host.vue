<template>
  <div class="host">
    Host
  </div>
</template>

<script lang="ts">
  // Helpers
  import { defineComponent } from 'vue';
  import Dexie from 'dexie';
  import { DexieCrossHost } from '../src';
  import { Todo } from './index';
  // Constants
  class TodoDatabase extends Dexie {
    public todos!: Dexie.Table<Todo>;
    constructor () {
      super('TodoDatabase', { addons: [DexieCrossHost] });
      this.version(1).stores({
        todos: '++id, title, completed'
      });
    }
  }
  const db = new TodoDatabase();

  export default defineComponent({
    name: 'Host',
    data () {
      return {
        todos: []
      };
    },
    methods: {
      async getTodos () {
        this.todos = await db.todos.toArray();
      },
      async addTodo (title: string) {
        await db.todos.add({
          title,
          completed: false
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
  }
</style>
