import type { BlockSuiteError } from './error.js';
import { kInternalError } from './error.js';

export const isInternalError = (error: Error): error is BlockSuiteError =>
  kInternalError in error && error[kInternalError] === true;
