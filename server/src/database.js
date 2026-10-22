import { Buffer } from 'node:buffer'
import { existsSync } from 'node:fs'
import process, { loadEnvFile } from 'node:process'
import pg from 'pg'

const envFile = new URL('../../.env', import.meta.url)

if (existsSync(envFile)) {
  loadEnvFile(envFile)
}

if (!process.env.DATABASE_URL || !process.env.DATABASE_CA_BASE64) {
  throw new Error('DATABASE_URL and DATABASE_CA_BASE64 must be configured.')
}

const databaseUrl = new URL(process.env.DATABASE_URL)

for (const parameter of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) {
  databaseUrl.searchParams.delete(parameter)
}

export const pool = new pg.Pool({
  connectionString: databaseUrl.toString(),
  ssl: {
    ca: Buffer.from(process.env.DATABASE_CA_BASE64, 'base64').toString('utf8'),
    rejectUnauthorized: true,
  },
  max: 5,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  query_timeout: 10000,
})

pool.on('error', (error) => {
  console.error('Unexpected database pool error:', error.code || 'UNKNOWN')
})