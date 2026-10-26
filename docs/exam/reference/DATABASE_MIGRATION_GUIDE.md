# Database migration guide

The executable source of truth is the ordered migration registry in [`backend/src/migrations.js`](../backend/src/migrations.js). The SQL migration files are [`001_initial_schema.sql`](../backend/migrations/001_initial_schema.sql) and [`002_legacy_upgrade.sql`](../backend/migrations/002_legacy_upgrade.sql). [`DATABASE_SCHEMA.sql`](./DATABASE_SCHEMA.sql) is the portable review snapshot of the current relational schema.

## Run or migrate a database

```bash
cd backend
DATABASE_FILE=/absolute/path/exam.sqlite npm run migrate
```

The command is safe to run repeatedly. It creates `schema_migrations`, applies only missing versions, and prints the final schema version.

For the default local database:

```bash
cd backend
npm run migrate
```

## PostgreSQL production backend

SQLite is the zero-setup local fallback. Production uses PostgreSQL:

```env
DATABASE_DRIVER=postgres
DATABASE_URL=postgresql://user:password@host:5432/database
DATABASE_POOL_MAX=10
DATABASE_SSL=require
DATABASE_SSL_REJECT_UNAUTHORIZED=true
```

Run the migration as the release step before starting the application:

```bash
cd backend
DATABASE_DRIVER=postgres DATABASE_URL="$DATABASE_URL" npm run migrate
```

The Node backend uses a pooled PostgreSQL connection and the same versioned migration source. Create a PostgreSQL custom-format backup with `DATABASE_DRIVER=postgres DATABASE_URL="$DATABASE_URL" npm run backup -- --output=/secure/path/exam.dump`; restore it with the provider’s approved `pg_restore` procedure. Use the managed provider’s encrypted backups, point-in-time recovery, and retention policy for production.

## Safe upgrade procedure

1. Stop the application or put it in maintenance mode.
2. Create a backup using `npm run backup -- --output=/absolute/path/exam-before-vN.sqlite`.
3. Run `DATABASE_FILE=/absolute/path/exam.sqlite npm run migrate`.
4. Verify the reported version and run the backend test suite.
5. Start the application and check `/ready`.
6. Keep the backup until the application and business owner approve the upgrade.

Never edit a migration that has already been applied. Add the next integer version with a descriptive name. Each migration must be transactional, forward-only, and safe to retry after a failed transaction.

## Rollback and restore

Migrations do not silently destroy or downgrade data. If a deployment must be rolled back, stop the application, preserve the failed database, restore the approved backup to the configured database path, and deploy the previous application version. Investigate and add a forward migration for the corrected design before retrying.

The application keeps compatibility JSON snapshots while normalized tables are maintained transactionally. This supports staged migration to another relational engine: copy and transform the normalized tables, validate row counts and constraints, then switch the repository/connection adapter without changing exam workflows or API contracts.

## Migration acceptance checks

- `schema_migrations` contains a contiguous applied history.
- Foreign keys and unique constraints are enabled.
- Exam, attempt, answer, result, and audit row counts match the backup.
- No public API exposes `answer_keys_json` or `question_options.is_correct`.
- A fresh database and an existing database both reach the current schema version.
- Backend integration tests and a readiness smoke test pass.
