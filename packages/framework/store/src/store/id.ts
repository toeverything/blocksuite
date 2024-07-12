import {
  type IdGenerator,
  createAutoIncrementIdGenerator,
  createAutoIncrementIdGeneratorByClientId,
  nanoid,
  uuidv4,
} from '../utils/id-generator.js';

export enum Generator {
  /**
   * **Warning**: This generator mode will crash the collaborative feature
   *  if multiple clients are adding new blocks.
   * Use this mode only if you know what you're doing.
   */
  AutoIncrement = 'autoIncrement',

  /**
   * This generator is trying to fix the real-time collaboration on debug mode.
   * This will make generator predictable and won't make conflict
   * @link https://docs.yjs.dev/api/faq#i-get-a-new-clientid-for-every-session-is-there-a-way-to-make-it-static-for-a-peer-accessing-the-doc
   */
  AutoIncrementByClientId = 'autoIncrementByClientId',

  /**
   * Default mode, generator for the unpredictable id
   */
  NanoID = 'nanoID',
  UUIDv4 = 'uuidV4',
}

export function pickIdGenerator(
  idGenerator: Generator | IdGenerator | undefined,
  clientId: number
) {
  if (typeof idGenerator === 'function') {
    return idGenerator;
  }

  switch (idGenerator) {
    case Generator.AutoIncrement: {
      return createAutoIncrementIdGenerator();
    }
    case Generator.AutoIncrementByClientId: {
      return createAutoIncrementIdGeneratorByClientId(clientId);
    }
    case Generator.UUIDv4: {
      return uuidv4;
    }
    case Generator.NanoID:
    default: {
      return nanoid;
    }
  }
}
