import { Router } from 'express'
import { prisma } from '../database.js'
import { ApiError, asyncHandler } from '../api-utils.js'

const router = Router()

router.get('/:slug', asyncHandler(async (req, res) => {
  const page = await prisma.page.findUnique({
    where: { slug: req.params.slug },
    select: {
      id: true,
      name: true,
      slug: true,
      contentJson: true,
      version: true,
      status: true,
      theme: {
        select: {
          id: true,
          name: true,
          slug: true,
          configJson: true,
        },
      },
    },
  })
  if (!page || page.status !== 'PUBLISHED') {
    throw new ApiError(404, 'NOT_FOUND', 'Published page was not found.')
  }

  const seo = page.contentJson !== null
    && !Array.isArray(page.contentJson)
    && typeof page.contentJson === 'object'
    && page.contentJson.seo !== null
    && typeof page.contentJson.seo === 'object'
    && !Array.isArray(page.contentJson.seo)
    ? page.contentJson.seo
    : {}

  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  res.json({
    data: {
      page: {
        id: page.id,
        name: page.name,
        slug: page.slug,
        contentJson: page.contentJson,
        version: page.version,
      },
      theme: page.theme,
      seo,
    },
  })
}))

export default router
