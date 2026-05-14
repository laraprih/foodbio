import { Pool } from 'pg'

const globalPool = global as typeof globalThis & { _pgPool?: Pool }

export function getPool(): Pool {
  if (!globalPool._pgPool) {
    globalPool._pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
    })
  }
  return globalPool._pgPool
}
