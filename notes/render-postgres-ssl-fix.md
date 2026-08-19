# Render Postgres SSL Connection Fix Notes

Render Postgres free/basic tier requires specific SSL handling in `node-postgres` (`pg`):
1. When connecting via external URL or internal URL, Node's `pg` Pool expects either `sslmode=require` query parameter or explicit `ssl: { rejectUnauthorized: false }`.
2. However, when using `drizzle-orm/node-postgres`, sometimes passing an explicit `connectionString` without parsing query params like `sslmode` causes `pg` to ignore custom `ssl` options in the `Pool` constructor if the connection string lacks them or if Render's pooled proxy (PgBouncer) requires explicit query string parameters.
3. Common fix: append `?sslmode=require` or `&sslmode=require` to `process.env.DATABASE_URL` if not present, and configure `ssl: { rejectUnauthorized: false }`.
