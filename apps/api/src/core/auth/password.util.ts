import { hash, verify } from '@node-rs/argon2';

/**
 * Thin wrapper around `@node-rs/argon2` (prebuilt native bindings, no
 * C++ toolchain required — see session notes on why plain `argon2` was
 * swapped out). Default cost parameters follow the library's OWASP-aligned
 * defaults for Argon2id.
 */
export function hashPassword(plainPassword: string): Promise<string> {
  return hash(plainPassword);
}

export function verifyPassword(
  passwordHash: string,
  plainPassword: string,
): Promise<boolean> {
  return verify(passwordHash, plainPassword);
}
