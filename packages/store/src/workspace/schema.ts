import { SchemaValidateError } from '@blocksuite/global/error';
import { assertExists } from '@blocksuite/global/utils';

import type { BlockSchemaType } from '../base.js';
import type { Workspace } from './workspace.js';

const SCHEMA_NOT_FOUND_MESSAGE =
  'Schema not found. The block flavour may not be registered.';

export class Schema {
  workspace: Workspace;

  flavourSchemaMap = new Map<string, BlockSchemaType>();

  constructor(workspace: Workspace) {
    this.workspace = workspace;
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

  _validateRole(child: BlockSchemaType, parent: BlockSchemaType) {
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

  _matchFlavour(childFlavour: string, parentFlavour: string) {
    // TODO: support glob match here, ex: database-* should match database-col and database-row
    return childFlavour === parentFlavour;
  }

  _validateParent(child: BlockSchemaType, parent: BlockSchemaType): boolean {
    const _childFlavour = child.model.flavour;
    const _parentFlavour = parent.model.flavour;

    const parentValidFlavours = parent.model.children || ['*'];
    const childValidFlavours = child.model.parent || ['*'];

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

        return this._matchFlavour(childValidFlavour, parentValidFlavour);
      });
    });
  }
}
