import { SchemaValidateError } from '@blocksuite/global/error';
import { assertExists } from '@blocksuite/global/utils';
import { minimatch } from 'minimatch';
import type * as Y from 'yjs';

import { SCHEMA_NOT_FOUND_MESSAGE } from '../consts.js';
import { workspaceMigrations } from '../migration/index.js';
import { ProxyManager } from '../yjs/index.js';
import type { BlockSchemaType } from './base.js';
import { BlockSchema } from './base.js';
import { toBlockMigrationData } from './utils.js';

export class Schema {
  readonly flavourSchemaMap = new Map<string, BlockSchemaType>();
  readonly proxy = new ProxyManager();

  toJSON() {
    return Object.fromEntries(
      Array.from(this.flavourSchemaMap.values()).map(
        (schema): [string, Record<string, unknown>] => [
          schema.model.flavour,
          {
            role: schema.model.role,
            parent: schema.model.parent,
            children: schema.model.children,
          },
        ]
      )
    );
  }

  register(blockSchema: BlockSchemaType[]) {
    blockSchema.forEach(schema => {
      BlockSchema.parse(schema);
      this.flavourSchemaMap.set(schema.model.flavour, schema);
    });
    return this;
  }

  validate = (
    flavour: string,
    parentFlavour?: string,
    childFlavours?: string[]
  ): void => {
    const schema = this.flavourSchemaMap.get(flavour);
    assertExists(
      schema,
      new SchemaValidateError(flavour, SCHEMA_NOT_FOUND_MESSAGE)
    );

    const validateChildren = () => {
      childFlavours?.forEach(childFlavour => {
        const childSchema = this.flavourSchemaMap.get(childFlavour);
        assertExists(
          childSchema,
          new SchemaValidateError(childFlavour, SCHEMA_NOT_FOUND_MESSAGE)
        );
        this.validateSchema(childSchema, schema);
      });
    };

    if (schema.model.role === 'root') {
      if (parentFlavour) {
        throw new SchemaValidateError(
          schema.model.flavour,
          'Root block cannot have parent.'
        );
      }

      validateChildren();
      return;
    }

    if (!parentFlavour) {
      throw new SchemaValidateError(
        schema.model.flavour,
        'Hub/Content must have parent.'
      );
    }

    const parentSchema = this.flavourSchemaMap.get(parentFlavour);
    assertExists(
      parentSchema,
      new SchemaValidateError(parentFlavour, SCHEMA_NOT_FOUND_MESSAGE)
    );

    this.validateSchema(schema, parentSchema);
    validateChildren();
  };

  validateSchema(child: BlockSchemaType, parent: BlockSchemaType) {
    this._validateRole(child, parent);

    const relationCheckSuccess = this._validateParent(child, parent);

    if (!relationCheckSuccess) {
      throw new SchemaValidateError(
        child.model.flavour,
        `Block cannot have parent: ${parent.model.flavour}.`
      );
    }
  }

  upgradeWorkspace = (rootData: Y.Doc) => {
    this._upgradeBlockVersions(rootData);
    workspaceMigrations.forEach(migration => {
      try {
        if (migration.condition(rootData)) {
          migration.migrate(rootData);
        }
      } catch (err) {
        throw new Error(`migrate workspace failed: ${migration.desc}`);
      }
    });
  };

  upgradePage = (oldVersions: Record<string, number>, pageData: Y.Doc) => {
    const blocks = pageData.getMap('blocks');
    Array.from(blocks.values()).forEach(block => {
      const flavour = block.get('sys:flavour') as string;
      const currentVersion = oldVersions?.[flavour] ?? 0;
      assertExists(
        currentVersion,
        `previous version for flavour ${flavour} not found`
      );
      this.upgradeBlock(flavour, currentVersion, block);
    });
  };

  upgradeBlock = (
    flavour: string,
    oldVersion: number,
    blockData: Y.Map<unknown>
  ) => {
    const currentSchema = this.flavourSchemaMap.get(flavour);
    assertExists(currentSchema);
    const { onUpgrade, version } = currentSchema;
    if (!onUpgrade) {
      return;
    }

    const data = toBlockMigrationData(blockData, this.proxy);

    return onUpgrade(data, oldVersion, version);
  };

  private _upgradeBlockVersions = (rootData: Y.Doc) => {
    const meta = rootData.getMap('meta');
    const blockVersions = meta.get('blockVersions') as Y.Map<number>;
    if (!blockVersions) {
      return;
    }
    blockVersions.forEach((origin, flavour) => {
      const currentSchema = this.flavourSchemaMap.get(flavour);
      blockVersions.set(flavour, currentSchema?.version ?? origin);
    });
  };

  private _validateRole(child: BlockSchemaType, parent: BlockSchemaType) {
    const childRole = child.model.role;
    const parentRole = parent.model.role;
    const childFlavour = child.model.flavour;
    const parentFlavour = parent.model.flavour;

    if (childRole === 'root') {
      throw new SchemaValidateError(
        childFlavour,
        `Root block cannot have parent: ${parentFlavour}.`
      );
    }

    if (childRole === 'hub' && parentRole === 'content') {
      throw new SchemaValidateError(
        childFlavour,
        `Hub block cannot be child of content block: ${parentFlavour}.`
      );
    }

    if (childRole === 'content' && parentRole === 'root') {
      throw new SchemaValidateError(
        childFlavour,
        `Content block can only be child of hub block or itself. But get: ${parentFlavour}.`
      );
    }
  }

  private _matchFlavour(childFlavour: string, parentFlavour: string) {
    return (
      minimatch(childFlavour, parentFlavour) ||
      minimatch(parentFlavour, childFlavour)
    );
  }

  private _validateParent(
    child: BlockSchemaType,
    parent: BlockSchemaType
  ): boolean {
    const _childFlavour = child.model.flavour;
    const _parentFlavour = parent.model.flavour;

    const childValidFlavours = child.model.parent || ['*'];
    const parentValidFlavours = parent.model.children || ['*'];

    return parentValidFlavours.some(parentValidFlavour => {
      return childValidFlavours.some(childValidFlavour => {
        if (parentValidFlavour === '*' && childValidFlavour === '*') {
          return true;
        }

        if (parentValidFlavour === '*') {
          return this._matchFlavour(childValidFlavour, _parentFlavour);
        }

        if (childValidFlavour === '*') {
          return this._matchFlavour(_childFlavour, parentValidFlavour);
        }

        return (
          this._matchFlavour(_childFlavour, parentValidFlavour) &&
          this._matchFlavour(childValidFlavour, _parentFlavour)
        );
      });
    });
  }
}
