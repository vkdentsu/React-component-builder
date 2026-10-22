import process from 'node:process'
import app from './app.js'
import { pool } from './database.js'

const port = Number(process.env.PORT) || 3001

try {
  await pool.query('SELECT 1')
  app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}; database connected`)
  })
} catch (error) {
  console.error('Database connection failed:', error.code || 'UNKNOWN')
  await pool.end()
  process.exitCode = 1
}