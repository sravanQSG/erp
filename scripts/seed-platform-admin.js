// One-time bootstrap: creates the first platform admin (tenant-less,
// isPlatformAdmin=true). There's no HTTP endpoint for this deliberately —
// creating a platform admin requires already being one. Run once per
// environment: `npm run seed:platform-admin -- admin@example.com "a strong password"`
import 'dotenv/config';
import pg from 'pg';
import { hash } from '@node-rs/argon2';

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error(
    'Usage: npm run seed:platform-admin -- <email> <password>',
  );
  process.exit(1);
}

const client = new pg.Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

await client.connect();
try {
  const existing = await client.query('SELECT id FROM users WHERE email = $1', [
    email,
  ]);
  if (existing.rowCount > 0) {
    console.error(`A user with email "${email}" already exists.`);
    process.exit(1);
  }

  const passwordHash = await hash(password);
  const result = await client.query(
    `INSERT INTO users (email, password_hash, tenant_id, is_platform_admin, status)
     VALUES ($1, $2, NULL, true, 'active')
     RETURNING id`,
    [email, passwordHash],
  );

  console.log(`Platform admin created: ${email} (id: ${result.rows[0].id})`);
} finally {
  await client.end();
}
