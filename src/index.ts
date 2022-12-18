// Helpers
import Dexie from 'dexie';
// Types
type DexieEventData<T = unknown> = {
  type: 'dexie-cross';
  event: 'host-handshake';
} | {
  type: 'dexie-cross';
  event: 'client-handshake';
} | {
  id: string;
  type: 'dexie-cross';
  event: 'request';
  table: string;
  method: string;
} | {
  id: string;
  type: 'dexie-cross';
  event: 'response';
  table: string;
  data: T;
};
type ConnectionState = 'disconnected'|'connected';

export function DexieCrossHost (db: Dexie) {
  async function _handleMessage (target: MessageEventSource, e: DexieEventData) {
    switch (e.event) {
      case 'client-handshake': {
        target.postMessage(JSON.stringify({
          type: 'dexie-cross',
          event: 'host-handshake'
        }));
        break;
      }
      case 'request': {
        const data = await db[e.table][e.method]();
        target.postMessage(JSON.stringify({
          id: e.id,
          type: 'dexie-cross',
          event: 'response',
          table: e.table,
          data
        }));
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
}
interface ClientManifest {
  hostUrl: string;
}
export class DexieCrossClient {
  // Attributes
  public name: string;
  public hostUrl: string;
  public state: ConnectionState;
  public iframe: HTMLIFrameElement;
  private _tables: Record<string, DexieCrossClientTable>;
  private _awaiters: (() => void)[];
  // Constructor
  constructor (name: string, manifest: ClientManifest) {
    this.name = name;
    this.hostUrl = manifest.hostUrl;
    this.state = 'disconnected';
    this.iframe = this._initializeIframe();
    this._tables = {};
    this._awaiters = [];
  }
  // Methods
  public isReady (): Promise<void> {
    if (this.state === 'connected') {
      return Promise.resolve();
    } else {
      return new Promise((resolve) => {
        this._awaiters.push(() => { resolve(); });
      });
    }
  }
  private _setState (state: ConnectionState) {
    this.state = state;
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
    iframe.addEventListener('load', () => {
      iframe.contentWindow?.postMessage(JSON.stringify({
        type: 'dexie-cross',
        event: 'client-handshake'
      }), '*');
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
      case 'response': {
        this._tables[e.table].response(e.id, e.data);
        break;
      }
    }
  }
  public addTable<T = unknown> (key: string) {
    const table = new DexieCrossClientTable<T>(this, key);
    this._tables[key] = table;
    Object.defineProperty(this, key, { value: table });
  }
}
export class DexieCrossClientTable<T = unknown> {
  private _db: DexieCrossClient;
  private _key: string;
  private _awaiters: Record<string, Function>;
  // Constructor
  constructor (db: DexieCrossClient, key: string) {
    this._db = db;
    this._key = key;
    this._awaiters = {};
  }
  // Methods
  public response <T> (id: string, res: T) {
    this._awaiters[id](res);
  }
  private async _request<T = unknown> (method: string) {
    return new Promise<T>((resolve) => {
      const id = Date.now().toString();
      this._awaiters[id] = (res: T) => { resolve(res); };
      this._db.iframe.contentWindow?.postMessage(JSON.stringify({
        id,
        type: 'dexie-cross',
        event: 'request',
        table: this._key,
        method
      }), '*');
    });
  }
  public async toArray (): Promise<Array<T>> {
    await this._db.isReady();
    return this._request('toArray');
  }
  // public async add(item: T, key?: TKey): Promise<TKey> {
  // }
}