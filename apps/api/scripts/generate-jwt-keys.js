// Generates an RS256 key pair for signing/verifying JWTs and writes them
// to keys/private.pem and keys/public.pem (gitignored). Re-run per
// environment — never reuse the same key pair across dev/staging/prod.
import { generateKeyPairSync } from 'node:crypto';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const keysDir = join(__dirname, '..', 'keys');
const privateKeyPath = join(keysDir, 'private.pem');
const publicKeyPath = join(keysDir, 'public.pem');

if (existsSync(privateKeyPath) || existsSync(publicKeyPath)) {
  console.log(
    'keys/private.pem or keys/public.pem already exist. Delete them first if you want to regenerate.',
  );
  process.exit(0);
}

mkdirSync(keysDir, { recursive: true });

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 4096,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

writeFileSync(privateKeyPath, privateKey, { mode: 0o600 });
writeFileSync(publicKeyPath, publicKey, { mode: 0o644 });

console.log(`RSA key pair generated:\n  ${privateKeyPath}\n  ${publicKeyPath}`);
