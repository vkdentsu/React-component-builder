import express from 'express'
import routes, { handleApiError } from './routes.js'

const app = express()

app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend is connected',
    timestamp: new Date().toISOString(),
  })
})

app.use('/api', routes)
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found' })
})
app.use(handleApiError)

export default app
