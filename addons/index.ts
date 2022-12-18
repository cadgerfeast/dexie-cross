// Components
import Host from './host.vue';
import Client from './client.vue';

export interface Todo {
  id?: number;
  title: string;
  completed: boolean;
}

export default [
  {
    components: [
      Host,
      Client
    ]
  }
];
