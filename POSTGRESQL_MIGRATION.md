# MySQL to PostgreSQL Migration Guide

This document outlines all changes made to convert the GolfGive backend from MySQL to PostgreSQL.

## Overview

The entire backend has been converted from MySQL (`mysql2/promise`) to PostgreSQL (`pg` driver). All queries have been updated to use PostgreSQL syntax.

## Installation & Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

This will remove `mysql2` and install `pg` module instead.

### 2. Install PostgreSQL

#### On Windows:
- Download from: https://www.postgresql.org/download/windows/
- Run the installer
- Remember your superuser password
- Default port is 5432

#### On macOS:
```bash
brew install postgresql
brew services start postgresql
```

#### On Linux:
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 3. Create Database

```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Create database and user
CREATE DATABASE golfgive;
CREATE USER golfgive_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE golfgive TO golfgive_user;

# Exit psql
\q
```

### 4. Update Environment Variables

Update `backend/.env`:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_USER=golfgive_user
DB_PASS=your_secure_password
DB_NAME=golfgive

JWT_SECRET=replace_with_a_strong_random_secret
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### 5. Create Database Schema

You should have a schema migration script (SQL file) to create all tables. This depends on your specific schema setup:

- Tables: `users`, `scores`, `draws`, `draw_entries`, `winners`, `subscriptions`, `payments`, `charities`
- Ensure all table names are lowercase (PostgreSQL convention)
- Use `SERIAL` for auto-incrementing primary keys
- Use `TIMESTAMP` for datetime fields

Example table structure:
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  charity_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE scores (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  score INTEGER NOT NULL,
  played_at DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ... and so on for other tables
```

### 6. Start the Backend

```bash
npm run dev
```

## Key Changes Made

### 1. Package Dependencies
- ❌ Removed: `mysql2` v3.20.0
- ✅ Added: `pg` v8.11.0

### 2. Database Connection (`src/config/db.js`)
- Changed from `mysql.createPool()` to `pg.Pool()`
- Added `DB_PORT` environment variable (default: 5432)
- Exported both `query()` function and `connect()` for transactions
- Proper error handling on idle connections

### 3. Query Parameter Syntax
All queries converted from `?` placeholders to `$1, $2, $3...` numbered parameters:

```javascript
// Before (MySQL)
await db.query('SELECT * FROM users WHERE id = ?', [userId]);

// After (PostgreSQL)
await db.query('SELECT * FROM users WHERE id = $1', [userId]);
```

### 4. Result Handling
Changed from destructuring `[rows]` to accessing `.rows` property:

```javascript
// Before (MySQL)
const [rows] = await db.query('SELECT * FROM users');
return rows;

// After (PostgreSQL)
const result = await db.query('SELECT * FROM users');
return result.rows;
```

### 5. Insert ID Retrieval
Changed from `result.insertId` to `RETURNING` clause:

```javascript
// Before (MySQL)
const [result] = await db.query('INSERT INTO users (...) VALUES (...)', values);
return result.insertId;

// After (PostgreSQL)
const result = await db.query('INSERT INTO users (...) VALUES (...) RETURNING id', values);
return result.rows[0].id;
```

### 6. Affected Rows
Changed from `result.affectedRows` to `result.rowCount`:

```javascript
// Before (MySQL)
return result.affectedRows;

// After (PostgreSQL)
return result.rowCount;
```

### 7. Schema Introspection
Changed from `SHOW COLUMNS FROM table` to `information_schema`:

```javascript
// Before (MySQL)
const [cols] = await db.query('SHOW COLUMNS FROM users');
const columnSet = new Set(cols.map((c) => c.Field));

// After (PostgreSQL)
const result = await db.query(
  `SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'users' AND table_schema = 'public'`
);
const columnSet = new Set(result.rows.map((c) => c.column_name));
```

### 8. Transactions
Changed from method calls to SQL commands:

```javascript
// Before (MySQL)
await connection.beginTransaction();
// ... queries ...
await connection.commit();
// or on error:
await connection.rollback();

// After (PostgreSQL)
await connection.query('BEGIN');
// ... queries ...
await connection.query('COMMIT');
// or on error:
await connection.query('ROLLBACK');
```

## Files Modified

### Backend Files

**Configuration:**
- `src/config/db.js` - Database connection pooling

**Models:**
- `src/models/user.model.js` - User data access
- `src/models/score.model.js` - Score data access
- `src/models/draw.model.js` - Draw data access
- `src/models/winner.model.js` - Winner data access
- `src/models/subscription.model.js` - Subscription data access
- `src/models/payment.model.js` - Payment data access
- `src/models/drawEntry.model.js` - Draw entry data access
- `src/models/charity.model.js` - Charity data access

**Services:**
- `src/services/draw.service.js` - Draw operations with transactions
- `src/services/stats.service.js` - Dashboard statistics

**Documentation:**
- `README.md` - Updated prerequisites and environment variables

## Migration Checklist

- [ ] Install PostgreSQL locally or provision remote instance
- [ ] Create `golfgive` database and `golfgive_user` role
- [ ] Create database schema/tables (SQL file required)
- [ ] Update `backend/.env` with PostgreSQL credentials
- [ ] Run `npm install` to update dependencies
- [ ] Migrate existing data from MySQL to PostgreSQL (if applicable)
- [ ] Run `npm run dev` to test backend
- [ ] Verify all API endpoints work correctly
- [ ] Test admin draw operations (transactions)
- [ ] Test payment and subscription flows

## Troubleshooting

### Connection Refused
- Ensure PostgreSQL is running: `psql -U postgres`
- Check `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS` in `.env`
- Verify firewall allows port 5432

### Permission Denied
- Ensure `golfgive_user` has proper permissions:
  ```sql
  GRANT ALL PRIVILEGES ON DATABASE golfgive TO golfgive_user;
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO golfgive_user;
  GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO golfgive_user;
  ```

### Table Not Found
- Verify all required tables exist in the database
- Check table names are lowercase (PostgreSQL default)

### Query Errors (LIMIT syntax)
- PostgreSQL requires `LIMIT` to come after `ORDER BY`
- Already fixed in all converted queries

### JSON Type Handling
- PostgreSQL has native `JSON` and `JSONB` types
- Current code uses `JSON.stringify()` before inserting and parses on retrieval
- Consider using `JSONB` columns for better performance with large JSON documents

## Performance Notes

PostgreSQL offers several advantages over MySQL:

1. **Better JSON support**: Native JSON and JSONB data types with indexing
2. **Window functions**: Advanced analytics queries
3. **Full-text search**: Built-in text search capabilities
4. **Transactions**: Better ACID compliance and isolation levels
5. **Extensibility**: Custom data types and functions

No performance optimization has been done yet - this is a straightforward migration. Future optimizations could include:
- Composite indexes on frequently queried columns
- Prepared statements for repeated queries
- Connection pooling tuning (currently using defaults)

## Data Migration

If migrating existing data from MySQL to PostgreSQL:

1. Export MySQL data as CSV or use tools like `mysqldump`
2. Create equivalent tables in PostgreSQL
3. Import data using `COPY` command or ETL tools
4. Verify data integrity after migration
5. Update any auto-increment sequences if needed

## Support

For PostgreSQL documentation: https://www.postgresql.org/docs/

For `pg` driver documentation: https://node-postgres.com/
