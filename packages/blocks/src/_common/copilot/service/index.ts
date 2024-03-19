import './open-ai.js';
import './fal.js';
import './llama2.js';

import { falVendor } from './fal.js';
import { llama2Vendor } from './llama2.js';
import { openaiVendor } from './open-ai.js';
import { type Vendor } from './service-base.js';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const allVendor: Vendor<any>[] = [openaiVendor, falVendor, llama2Vendor];
