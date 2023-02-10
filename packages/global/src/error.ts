export const kInternalError = Symbol('internal_error');
export const isInternalError = <Err extends InternalError>(error: Err) =>
  error[kInternalError] === true;

class InternalError extends Error {
  [kInternalError] = true;
}

export class MigrationError extends InternalError {
  constructor(description: string) {
    super(
      `Migration ${description} error. Please report to https://github.com/toeverything/blocksuite/issues`
    );
  }
}
