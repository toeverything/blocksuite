import { minimatch } from 'minimatch';

import { SCHEMA_NOT_FOUND_MESSAGE } from '../consts.js';
import { BlockSchema, type BlockSchemaType } from '../model/index.js';
import { SchemaValidateError } from './error.js';

export class Schema {
  readonly flavourSchemaMap = new Map<string, BlockSchemaType>();

  safeValidate = (
    flavour: string,
    parentFlavour?: string,
    childFlavours?: string[]
  ): boolean => {
    try {
      this.validate(flavour, parentFlavour, childFlavours);
      return true;
    } catch {
      return false;
    }
  };

  get(flavour: string) {
    return this.flavourSchemaMap.get(flavour);
  }

  validate = (
    flavour: string,
    parentFlavour?: string,
    childFlavours?: string[]
  ): void => {
    const schema = this.flavourSchemaMap.get(flavour);
    if (!schema) {
      throw new SchemaValidateError(flavour, SCHEMA_NOT_FOUND_MESSAGE);
    }

    const validateChildren = () => {
      childFlavours?.forEach(childFlavour => {
        const childSchema = this.flavourSchemaMap.get(childFlavour);
        if (!childSchema) {
          throw new SchemaValidateError(childFlavour, SCHEMA_NOT_FOUND_MESSAGE);
        }
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
    if (!parentSchema) {
      throw new SchemaValidateError(parentFlavour, SCHEMA_NOT_FOUND_MESSAGE);
    }
    this.validateSchema(schema, parentSchema);
    validateChildren();
  };

  get versions() {
    return Object.fromEntries(
      Array.from(this.flavourSchemaMap.values()).map(
        (schema): [string, number] => [schema.model.flavour, schema.version]
      )
    );
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

  isValid(child: string, parent: string) {
    const childSchema = this.flavourSchemaMap.get(child);
    const parentSchema = this.flavourSchemaMap.get(parent);
    if (!childSchema || !parentSchema) {
      return false;
    }
    try {
      this.validateSchema(childSchema, parentSchema);
      return true;
    } catch {
      return false;
    }
  }

  register(blockSchema: BlockSchemaType[]) {
    blockSchema.forEach(schema => {
      BlockSchema.parse(schema);
      this.flavourSchemaMap.set(schema.model.flavour, schema);
    });
    return this;
  }

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
}
