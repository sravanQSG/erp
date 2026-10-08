# JWT Signing Keys

This directory holds the RS256 key pair used to sign and verify access/refresh
tokens. Files here (`*.pem`) are **gitignored** — never commit real keys.

Generate a local dev key pair:

```
npm run keys:generate
```

This creates:
- `private.pem` — used only by the API server to **sign** tokens. Keep secret.
- `public.pem` — used to **verify** tokens. Safe to share with other services
  that need to validate tokens without being able to mint them.

In staging/production, generate a separate key pair per environment and
provide the key material via your secrets manager (mounted file or env var),
not by committing it to the repo.
