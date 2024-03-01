import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';

export class MigrationError extends BlockSuiteError {
  constructor(description: string) {
    super(
      ErrorCode.MIGRATION_ERROR,
      `Migration failed. Please report to https://github.com/toeverything/blocksuite/issues
          ${description}`
    );
  }
}

export class SchemaValidateError extends BlockSuiteError {
  constructor(flavour: string, message: string) {
    super(
      ErrorCode.SCHEMA_VALIDATE_ERROR,
      `Invalid schema for ${flavour}: ${message}`
    );
  }
}
