// Helpers
import Dexie from 'dexie';
import { SafeAny } from './utils/types';
// Types
type DexieEventData<T = SafeAny> = {
  type: 'dexie-cross';
  event: 'host-handshake';
} | {
  id: string;
  type: 'dexie-cross';
  event: 'query';
  table: string;
  args: Record<string, SafeAny>;
  query: string;
} | {
  id: string;
  type: 'dexie-cross';
  event: 'response';
  table: string;
  data: T;
};
type ConnectionState = 'disconnected'|'connected';

function postDexieMessage (target: Window|null, message: DexieEventData) {
  if (target) {
    target.postMessage(JSON.stringify(message), '*');
  }
}

export function DexieCrossHost (db: Dexie) {
  async function _handleMessage (target: MessageEventSource, e: DexieEventData) {
    switch (e.event) {
      case 'query': {
        const argKeys = Object.keys(e.args);
        const argValues = Object.values(e.args);
        const query = new Function('...args', `const [db, ${argKeys.join(', ')}] = args; return ((table) => ${decodeURI(e.query)})(db['${e.table}']);`);
        const res = await query(db, ...argValues);
        postDexieMessage(target as Window, {
          id: e.id,
          type: 'dexie-cross',
          event: 'response',
          table: e.table,
          data: res
        });
        break;
      }
    }
  }
  window.addEventListener('message', (e) => {
    const data: DexieEventData = JSON.parse(e.data);
    if (data.type === 'dexie-cross') {
      _handleMessage(e.source as MessageEventSource, data);
    }
  });
  if (window.parent) {
    postDexieMessage(window.parent, {
      type: 'dexie-cross',
      event: 'host-handshake'
    });
  }
}
interface ClientManifest {
  hostUrl: string;
}
export class DexieCrossClient {
  // Attributes
  public name: string;
  public hostUrl: string;
  private _state: ConnectionState;
  private _iframe: HTMLIFrameElement;
  private _awaiters: (() => void)[];
  // Constructor
  constructor (name: string, manifest: ClientManifest) {
    this.name = name;
    this.hostUrl = manifest.hostUrl;
    this._state = 'disconnected';
    this._iframe = this._initializeIframe();
    this._awaiters = [];
  }
  // Methods
  public isReady (): Promise<void> {
    if (this._state === 'connected') {
      return Promise.resolve();
    } else {
      return new Promise((resolve) => {
        this._awaiters.push(() => { resolve(); });
      });
    }
  }
  public postMessage (message: DexieEventData) {
    postDexieMessage(this._iframe.contentWindow, message);
  }
  private _setState (state: ConnectionState) {
    this._state = state;
    if (state === 'connected') {
      for (const _awaiter of this._awaiters) {
        _awaiter();
      }
      this._awaiters = [];
    }
  }
  private _initializeIframe () {
    const frameContainer = document.createElement('div');
    frameContainer.className = 'dexie-cross';
    frameContainer.setAttribute('src', this.hostUrl);
    frameContainer.style.display = 'none';
    const iframe = document.createElement('iframe');
    iframe.src = this.hostUrl;
    window.addEventListener('message', (e) => {
      const data: DexieEventData = JSON.parse(e.data);
      if (data.type === 'dexie-cross') {
        this._handleMessage(data);
      }
    });
    frameContainer.appendChild(iframe);
    document.body.appendChild(frameContainer);
    return iframe;
  }
  private _handleMessage (e: DexieEventData) {
    switch (e.event) {
      case 'host-handshake': {
        this._setState('connected');
        break;
      }
    }
  }
  public addTable <T = SafeAny> (key: string) {
    Object.defineProperty(this, key, { value: new DexieCrossClientTable<T>(this, key) });
  }
}
type Awaiters<K = SafeAny> = Record<string, (res: K) => void>;
interface QueryArgs {
  args?: Record<string, SafeAny>;
  body: string;
}
export class DexieCrossClientTable<T = SafeAny> {
  private _db: DexieCrossClient;
  private _key: string;
  private _awaiters: Awaiters;
  // Constructor
  constructor (db: DexieCrossClient, key: string) {
    this._db = db;
    this._key = key;
    this._awaiters = {};
    window.addEventListener('message', (e) => {
      const data: DexieEventData<T> = JSON.parse(e.data);
      if (data.type === 'dexie-cross') {
        this._handleMessage(data);
      }
    });
  }
  // Methods
  private _handleMessage (e: DexieEventData<T>) {
    switch (e.event) {
      case 'response': {
        if (this._awaiters[e.id]) {
          this._awaiters[e.id](e.data);
        }
        break;
      }
    }
  }
  private async _query <K> (options: QueryArgs): Promise<K> {
    await this._db.isReady();
    return new Promise<K>((resolve) => {
      const id = Date.now().toString();
      this._awaiters[id] = (res: K) => { resolve(res); };
      this._db.postMessage({
        id,
        type: 'dexie-cross',
        event: 'query',
        table: this._key,
        args: options.args || {},
        query: encodeURI(options.body)
      });
    });
  }
  // To Array
  public async toArray (): Promise<T[]> {
    return this._query({
      body: 'table.toArray()'
    });
  }
  // Add
  public async add (el: T): Promise<number> {
    return this._query({
      args: {
        el
      },
      body: 'table.add(el)'
    });
  }
  // Update
  public async update (changes: SafeAny): Promise<number>;
  public async update (el: T, changes: SafeAny): Promise<number>;
  public async update (...args: SafeAny[]) {
    if (args.length > 1) {
      const el = args[0];
      const changes = args[1];
      return this._query({
        args: {
          el,
          changes
        },
        body: 'table.update(el, changes)'
      });
    } else {
      const changes = args[0];
      return this._query({
        args: {
          changes
        },
        body: 'todos.toCollection().modify(changes)'
      });
    }
  }
  // Delete
  public async delete (key: number): Promise<void> {
    return this._query({
      args: {
        key
      },
      body: 'table.delete(key)'
    });
  }
}