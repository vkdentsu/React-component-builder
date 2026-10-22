import { Prisma } from '@prisma/client'
import { Router } from 'express'
import prisma from './prisma.js'

const router = Router()

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next)
}

function requireObject(value, field) {
  if (value === null || typeof value !== 'object') {
    throw new HttpError(400, `${field} must be a JSON object or array`)
  }
  return value
}

function requireText(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(400, `${field} must be a non-empty string`)
  }
  return value.trim()
}

function requireBody(req) {
  if (req.body === null || typeof req.body !== 'object' || Array.isArray(req.body)) {
    throw new HttpError(400, 'Request body must be a JSON object')
  }
  return req.body
}

function optionalText(body, field, data) {
  if (Object.hasOwn(body, field)) data[field] = requireText(body[field], field)
}

function optionalJson(body, field, data) {
  if (Object.hasOwn(body, field)) data[field] = requireObject(body[field], field)
}

function optionalStatus(body, data) {
  if (!Object.hasOwn(body, 'status')) return
  if (!['DRAFT', 'PUBLISHED'].includes(body.status)) {
    throw new HttpError(400, 'status must be DRAFT or PUBLISHED')
  }
  data.status = body.status
}

router.get(
  '/themes',
  asyncHandler(async (req, res) => {
    const themes = await prisma.theme.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { pages: true } } },
    })
    res.json(themes)
  }),
)

router.post(
  '/themes',
  asyncHandler(async (req, res) => {
    const body = requireBody(req)
    const theme = await prisma.theme.create({
      data: {
        name: requireText(body.name, 'name'),
        slug: requireText(body.slug, 'slug'),
        configJson: requireObject(body.configJson, 'configJson'),
      },
    })
    res.status(201).json(theme)
  }),
)

router.get(
  '/themes/:id',
  asyncHandler(async (req, res) => {
    const theme = await prisma.theme.findUnique({
      where: { id: req.params.id },
      include: { pages: { orderBy: { createdAt: 'desc' } } },
    })
    if (!theme) throw new HttpError(404, 'Theme not found')
    res.json(theme)
  }),
)

router.patch(
  '/themes/:id',
  asyncHandler(async (req, res) => {
    const body = requireBody(req)
    const data = {}
    optionalText(body, 'name', data)
    optionalText(body, 'slug', data)
    optionalJson(body, 'configJson', data)
    if (Object.keys(data).length === 0) {
      throw new HttpError(400, 'Provide at least one theme field to update')
    }
    const theme = await prisma.theme.update({
      where: { id: req.params.id },
      data,
    })
    res.json(theme)
  }),
)

router.delete(
  '/themes/:id',
  asyncHandler(async (req, res) => {
    await prisma.theme.delete({ where: { id: req.params.id } })
    res.status(204).end()
  }),
)

router.get(
  '/pages',
  asyncHandler(async (req, res) => {
    const where = {}
    if (typeof req.query.themeId === 'string') where.themeId = req.query.themeId
    if (typeof req.query.status === 'string') {
      if (!['DRAFT', 'PUBLISHED'].includes(req.query.status)) {
        throw new HttpError(400, 'status must be DRAFT or PUBLISHED')
      }
      where.status = req.query.status
    }
    const pages = await prisma.page.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { theme: { select: { id: true, name: true, slug: true } } },
    })
    res.json(pages)
  }),
)

router.post(
  '/pages',
  asyncHandler(async (req, res) => {
    const body = requireBody(req)
    const page = await prisma.page.create({
      data: {
        name: requireText(body.name, 'name'),
        slug: requireText(body.slug, 'slug'),
        themeId: requireText(body.themeId, 'themeId'),
        contentJson: requireObject(body.contentJson, 'contentJson'),
      },
    })
    res.status(201).json(page)
  }),
)

router.get(
  '/pages/:id',
  asyncHandler(async (req, res) => {
    const page = await prisma.page.findUnique({
      where: { id: req.params.id },
      include: { theme: true },
    })
    if (!page) throw new HttpError(404, 'Page not found')
    res.json(page)
  }),
)

router.patch(
  '/pages/:id',
  asyncHandler(async (req, res) => {
    const body = requireBody(req)
    const data = {}
    optionalText(body, 'name', data)
    optionalText(body, 'slug', data)
    optionalJson(body, 'contentJson', data)
    optionalStatus(body, data)
    if (Object.keys(data).length === 0) {
      throw new HttpError(400, 'Provide at least one page field to update')
    }
    if (Object.hasOwn(data, 'contentJson')) data.version = { increment: 1 }
    const page = await prisma.page.update({
      where: { id: req.params.id },
      data,
    })
    res.json(page)
  }),
)

router.delete(
  '/pages/:id',
  asyncHandler(async (req, res) => {
    await prisma.page.delete({ where: { id: req.params.id } })
    res.status(204).end()
  }),
)

export function handleApiError(error, req, res, next) {
  if (res.headersSent) return next(error)

  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: error.message })
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'A record with that slug already exists' })
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Record not found' })
    }
    if (error.code === 'P2003') {
      return res.status(409).json({
        error: 'The operation conflicts with a related record',
      })
    }
  }

  if (error.status === 400) {
    return res.status(400).json({ error: 'Invalid JSON request body' })
  }

  console.error('API request failed:', error)
  return res.status(500).json({ error: 'Internal server error' })
}

export default router
