// Helpers
import Dexie from 'dexie';

class DexieCross {
  public version: string;
  constructor () {
    this.version = 'dev';
  }
}

declare module 'dexie' {
  export interface Dexie {
    cross: DexieCross;
  }
}

export default function DexieCrossAddon (db: Dexie) {
  db.cross = new DexieCross();
}
