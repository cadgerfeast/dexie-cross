// Helpers
import Dexie from 'dexie';
// Types
enum DexieState {
  DISCONNECTED = 'disconnected',
  CONNECTED = 'connected'
}
interface ClientConfigurationOptions {
  target: string;
}

let frameContainer: HTMLElement;

class DexieCross {
  // Attributes
  private _db: Dexie;
  private _awaiters: Function[];
  private _callbacks: Record<string, Function>;
  public version: string;
  public state: DexieState;
  // Constructor
  constructor (db: Dexie) {
    this._db = db;
    this._awaiters = [];
    this._callbacks = {};
    this.version = 'dev';
    this.state = DexieState.DISCONNECTED;
  }
  // Methods
  private _isReady (): Promise<void> {
    if (this.state === DexieState.CONNECTED) {
      return Promise.resolve();
    } else {
      return new Promise((resolve) => {
        const cb = () => {
          resolve();
        };
        this._awaiters.push(cb);
      });
    }
  }
  private _setState (state: DexieState) {
    this.state = state;
    if (state === DexieState.CONNECTED) {
      for (const _awaiter of this._awaiters) {
        _awaiter();
      }
      this._awaiters = [];
    }
  }
  private _hostRequest <T> (iframe: HTMLIFrameElement, name: string, method: string) {
    return new Dexie.Promise<T>((resolve) => {
      this._isReady().then(() => {
        const id = Date.now().toString();
        this._callbacks[id] = (res: T) => {
          resolve(res);
        }
        iframe.contentWindow?.postMessage(JSON.stringify({
          type: 'dexie',
          event: 'request',
          id,
          name,
          method
        }), '*');
      });
    });
  }
  private async _handleClientRequest (id: string, name: string, method: string) {
    const elements = await ((this._db as any)[name] as any)[method]();
    window.parent.postMessage(JSON.stringify({
      type: 'dexie',
      event: 'response',
      id,
      data: elements
    }), '*');
  }
  private _overrideTablePrototype (iframe: HTMLIFrameElement) {
    const cross = this;
    // toArray()
    this._db.Table.prototype.toArray = Dexie.override(this._db.Table.prototype.toArray, function () {
      return function (this: Dexie.Table) {
        return cross._hostRequest(iframe, this.name, 'toArray');
      };
    });
  }
  public configureHost () {
    window.addEventListener('message', (e) => {
      if (e.origin !== window.origin) {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'dexie') {
            if (data.event === 'handshake') {
              this._setState(DexieState.CONNECTED);
            } else if (data.event === 'request') {
              this._handleClientRequest(data.id, data.name, data.method);
            }
          }
        } catch {}
      }
    });
    window.parent.postMessage(JSON.stringify({
      type: 'dexie',
      event: 'handshake'
    }), '*');
  }
  public configureClient (options: ClientConfigurationOptions) {
    if (!frameContainer) {
      frameContainer = document.createElement('div');
      frameContainer.className = 'dexie-cross';
      frameContainer.style.display = 'none';
      document.body.appendChild(frameContainer);
    }
    const iframe = document.createElement('iframe');
    iframe.src = options.target;
    window.addEventListener('message', (e) => {
      if (e.origin !== window.origin) {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'dexie') {
            if (data.event === 'handshake') {
              this._setState(DexieState.CONNECTED);
              iframe.contentWindow?.postMessage(JSON.stringify({
                type: 'dexie',
                event: 'handshake'
              }), '*');
            } else if (data.event === 'response') {
              this._callbacks[data.id](data.data);
            }
          }
        } catch {}
      }
    });
    frameContainer.appendChild(iframe);
    this._overrideTablePrototype(iframe);
  }
}

declare module 'dexie' {
  export interface Dexie {
    cross: DexieCross;
  }
}

export default function DexieCrossAddon (db: Dexie) {
  db.cross = new DexieCross(db);
}
