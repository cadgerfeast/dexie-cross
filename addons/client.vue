<template>
  <div class="client">
    Client
  </div>
</template>

<script lang="ts">
  // Helpers
  import { defineComponent } from 'vue';
  import { DexieCrossClient, DexieCrossClientTable } from '../src';
  import { Todo } from './index';
  // Constants
  class TodoDatabase extends DexieCrossClient {
    public todos: DexieCrossClientTable<Todo>;
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
        todos: []
      };
    },
    methods: {
      async getTodos () {
        this.todos = await db.todos.toArray();
        console.info(this.todos);
      },
      async addTodo (title: string) {
        // await db.todos.add({
        //   title,
        //   completed: false
        // });
      }
    },
    mounted () {
      this.getTodos();
    }
  });
</script>

<style lang="scss" scoped>
  div.client {
  }
</style>
