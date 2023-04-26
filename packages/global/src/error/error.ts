import { ErrorCode } from './code.js';

export const kInternalError = Symbol('internal_error');

export abstract class BlockSuiteError extends Error {
  [kInternalError] = true;

  code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export class MigrationError extends BlockSuiteError {
  constructor(description: string) {
    super(
      ErrorCode.MIGRATION_ERROR,
      `Migration ${description} error. Please report to https://github.com/toeverything/blocksuite/issues`
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
