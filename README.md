# dexie-cross

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=cadgerfeast_dexie-cross&metric=alert_status)](https://sonarcloud.io/dashboard?id=cadgerfeast_dexie-cross)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=cadgerfeast_dexie-cross&metric=coverage)](https://sonarcloud.io/dashboard?id=cadgerfeast_dexie-cross)
[![Version](https://badge.fury.io/js/%40dexie%2Fcross.svg)](https://www.npmjs.com/package/dexie-cross)
[![Downloads](https://img.shields.io/npm/dt/dexie-cross.svg)](https://www.npmjs.com/package/dexie-cross)
[![License](https://img.shields.io/npm/l/dexie-cross.svg)](https://github.com/cadgerfeast/dexie-cross/blob/master/LICENSE)

<p align="center"><br/><img width="200" src="https://dexie-cross.cadgerfeast.dev/icons/dexie-cross.svg" alt="Dexie Cross Icon"/><br/><br/></p>

> Dexie Cross Domain Addon

**Dexie Cross** allows you to share a [Dexie](https://dexie.org/) database with other domains.

- On host side, it's easy as adding an addon to your database.
- On client side, you should instantiate a specific `DexieCrossClient` class.

Behind the scenes, the client creates a hidden `iframe` pointing to the domain where the host database is located.

Thats means that this URL should have correct [Content Security Policy](https://content-security-policy.com/) header set.

Once it's done, commands will be passed to the host database via `postMessage` API.
