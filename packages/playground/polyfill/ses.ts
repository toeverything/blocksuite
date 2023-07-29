import 'ses';

// Production build might have code coverage enabled which will break lockdown.
// Refs: https://github.com/istanbuljs/istanbuljs/pull/734
if (import.meta.env.DEV) {
  lockdown({
    evalTaming: 'unsafeEval',
    overrideTaming: 'severe',
    consoleTaming: 'unsafe',
    errorTaming: 'unsafe',
    errorTrapping: 'platform',
    unhandledRejectionTrapping: 'report',
  });
}
