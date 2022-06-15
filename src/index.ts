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

function override <T extends Function> (originalFunction: T, factory: (orig: Function) => T): T {
  return factory(originalFunction);
}

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
  private async _hostRequest <T> (iframe: HTMLIFrameElement, name: string, method: string): Promise<T> {
    await this._isReady();
    return new Promise((resolve) => {
      const id = Date.now().toString();
      this._callbacks[id] = (params: T) => {
        resolve(params);
      }
      iframe.contentWindow?.postMessage(JSON.stringify({
        type: 'dexie',
        event: 'request',
        id,
        name,
        method
      }), '*');
    });
  }
  private _overrideTablePrototype (iframe: HTMLIFrameElement) {
    const cross = this;
    // toArray()
    this._db.Table.prototype.toArray = override(this._db.Table.prototype.toArray, function (orig) {
      return function (this: Dexie.Table) {
        var returnValue = orig.apply(this, arguments);
        // TODO do not use original but send params to frame
        cross._hostRequest(iframe, this.name, 'toArray');
        return returnValue;
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
              console.info('SNETCH: request');
              console.info(data);
              // TODO do request and send response
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
            }
            // TODO do call registered callback when receiving response
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
