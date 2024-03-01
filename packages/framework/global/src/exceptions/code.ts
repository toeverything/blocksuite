export enum ErrorCode {
  DefaultRuntimeError = 1,
  ValueNotExists,
  ValueNotInstanceOf,
  ValueNotEqual,
  MIGRATION_ERROR,
  SCHEMA_VALIDATE_ERROR,

  // Fatal error should be greater than 10000
  DefaultFatalError = 10000,
}
