<template>
  <div class="client">
    <span class="title">Todos</span>
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
        todos: [] as Todo[]
      };
    },
    methods: {
      async getTodos () {
        this.todos = await db.todos.query((todos) => todos.toArray());
      },
      async addTodo (title: string) {
        await db.todos.query((todos) => todos.add({
          title,
          completed: false
        }));
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
    }
  }
</style>
