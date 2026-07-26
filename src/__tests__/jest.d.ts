// Make jest's globals (describe/test/expect/jest/beforeEach/…) visible to tsc.
// This file is included by the project's "**/*.ts" glob, so the reference applies
// program-wide during typechecking; it has no runtime effect.
/// <reference types="jest" />
