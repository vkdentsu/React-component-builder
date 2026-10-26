import { Router } from 'express'
import { prisma } from '../database.js'
import {
  ApiError,
  asyncHandler,
  requireJson,
  requireText,
} from '../api-utils.js'

const router = Router()
const pageStatuses = new Set(['DRAFT', 'PUBLISHED'])

function requireStatus(value) {
  if (!pageStatuses.has(value)) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'status must be DRAFT or PUBLISHED.')
  }
  return value
}

router.get('/', asyncHandler(async (req, res) => {
  const where = {}
  if (req.query.themeId !== undefined) {
    where.themeId = requireText(req.query.themeId, 'themeId')
  }
  if (req.query.status !== undefined) {
    where.status = requireStatus(req.query.status)
  }

  const pages = await prisma.page.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { theme: { select: { id: true, name: true, slug: true } } },
  })
  res.json({ data: pages })
}))

router.post('/', asyncHandler(async (req, res) => {
  const page = await prisma.page.create({
    data: {
      name: requireText(req.body?.name, 'name'),
      slug: requireText(req.body?.slug, 'slug'),
      themeId: requireText(req.body?.themeId, 'themeId'),
      contentJson: requireJson(req.body?.contentJson, 'contentJson'),
      ...(req.body?.status === undefined ? {} : { status: requireStatus(req.body.status) }),
    },
  })
  res.status(201).json({ data: page })
}))

router.get('/:id', asyncHandler(async (req, res) => {
  const page = await prisma.page.findUnique({
    where: { id: req.params.id },
    include: { theme: { select: { id: true, name: true, slug: true } } },
  })
  if (!page) {
    throw new ApiError(404, 'NOT_FOUND', 'Page was not found.')
  }
  res.json({ data: page })
}))

router.post('/:id/duplicate', asyncHandler(async (req, res) => {
  const source = await prisma.page.findUnique({
    where: { id: req.params.id },
  })
  if (!source) {
    throw new ApiError(404, 'NOT_FOUND', 'Page was not found.')
  }

  let suffix = 1
  while (true) {
    const slug = `${source.slug}-copy${suffix === 1 ? '' : `-${suffix}`}`
    try {
      const page = await prisma.page.create({
        data: {
          name: `${source.name} (Copy)`,
          slug,
          themeId: source.themeId,
          contentJson: source.contentJson,
          status: 'DRAFT',
        },
      })
      res.status(201).json({ data: page })
      return
    } catch (error) {
      if (error?.code !== 'P2002') throw error
      suffix += 1
    }
  }
}))

router.patch('/:id', asyncHandler(async (req, res) => {
  const data = {}
  if (Object.hasOwn(req.body ?? {}, 'name')) data.name = requireText(req.body.name, 'name')
  if (Object.hasOwn(req.body ?? {}, 'slug')) data.slug = requireText(req.body.slug, 'slug')
  if (Object.hasOwn(req.body ?? {}, 'themeId')) {
    data.themeId = requireText(req.body.themeId, 'themeId')
  }
  if (Object.hasOwn(req.body ?? {}, 'contentJson')) {
    data.contentJson = requireJson(req.body.contentJson, 'contentJson')
    data.version = { increment: 1 }
  }
  if (Object.hasOwn(req.body ?? {}, 'status')) data.status = requireStatus(req.body.status)
  if (Object.keys(data).length === 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Provide at least one field to update.')
  }

  const page = await prisma.page.update({
    where: { id: req.params.id },
    data,
  })
  res.json({ data: page })
}))

router.post('/:id/publish', asyncHandler(async (req, res) => {
  const page = await prisma.$transaction(async (transaction) => {
    const publishedPage = await transaction.page.update({
      where: { id: req.params.id },
      data: { status: 'PUBLISHED' },
    })
    await transaction.pageVersion.create({
      data: {
        pageId: publishedPage.id,
        version: publishedPage.version,
        contentJson: publishedPage.contentJson,
      },
    })
    return publishedPage
  })
  res.json({ data: page })
}))

router.get('/:id/versions', asyncHandler(async (req, res) => {
  const page = await prisma.page.findUnique({
    where: { id: req.params.id },
    select: {
      versions: {
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      },
    },
  })
  if (!page) {
    throw new ApiError(404, 'NOT_FOUND', 'Page was not found.')
  }
  res.json({ data: page.versions })
}))

router.post('/:id/rollback/:versionId', asyncHandler(async (req, res) => {
  const page = await prisma.$transaction(async (transaction) => {
    const snapshot = await transaction.pageVersion.findFirst({
      where: { id: req.params.versionId, pageId: req.params.id },
      select: { contentJson: true },
    })
    if (!snapshot) {
      throw new ApiError(404, 'NOT_FOUND', 'Page version was not found.')
    }
    return transaction.page.update({
      where: { id: req.params.id },
      data: {
        contentJson: snapshot.contentJson,
        version: { increment: 1 },
      },
    })
  })
  res.json({ data: page })
}))

router.delete('/:id', asyncHandler(async (req, res) => {
  await prisma.page.delete({ where: { id: req.params.id } })
  res.status(204).end()
}))

export default router
