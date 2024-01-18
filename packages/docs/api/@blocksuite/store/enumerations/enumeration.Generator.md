[API](../../../index.md) > [@blocksuite/store](../index.md) > Generator

# Enumeration: Generator

## Enumeration Members

### AutoIncrement

> **AutoIncrement**: `"autoIncrement"`

**Warning**: This generator mode will crash the collaborative feature
 if multiple clients are adding new blocks.
Use this mode only if you know what you're doing.

#### Defined In

[packages/store/src/workspace/store.ts:41](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/store.ts#L41)

***

### AutoIncrementByClientId

> **AutoIncrementByClientId**: `"autoIncrementByClientId"`

This generator is trying to fix the real-time collaboration on debug mode.
This will make generator predictable and won't make conflict

#### Link

https://docs.yjs.dev/api/faq#i-get-a-new-clientid-for-every-session-is-there-a-way-to-make-it-static-for-a-peer-accessing-the-doc

#### Defined In

[packages/store/src/workspace/store.ts:35](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/store.ts#L35)

***

### NanoID

> **NanoID**: `"nanoID"`

Default mode, generator for the unpredictable id

#### Defined In

[packages/store/src/workspace/store.ts:27](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/store.ts#L27)

***

### UUIDv4

> **UUIDv4**: `"uuidV4"`

#### Defined In

[packages/store/src/workspace/store.ts:29](https://github.com/Saul-Mirone/blocksuite/blob/f2324b82e/packages/store/src/workspace/store.ts#L29)
