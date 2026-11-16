/**
 * The cross-platform contract.
 *
 * Bump `CONTRACT_VERSION` only when a change requires every platform port to
 * react — a new trait field, changed geometry, a different seeding rule. Never
 * for a refactor, and never for something a serialiser can absorb on its own.
 *
 * The conformance fixtures in `fixtures/avatar-conformance.json` record this
 * version alongside the engine version, so a port can detect a mismatch loudly
 * instead of rendering a quietly wrong face.
 */
export const CONTRACT_VERSION = 1;
