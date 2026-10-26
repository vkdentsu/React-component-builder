# API Documentation

## Swagger / OpenAPI

Start the backend with `npm run server`, then open:

- **Interactive Swagger UI:** <http://localhost:3001/api/docs/>
- **OpenAPI 3.0 JSON:** <http://localhost:3001/api/openapi.json>

Use your configured port or deployed backend host instead of `localhost:3001`
when applicable. Swagger UI sends requests to the same host that serves the
documentation. Expand an operation and select **Try it out** to call the API.
These calls use the real database, including creates, updates, and deletes.
No authentication is currently required.

Frontend developers can import the JSON URL into Postman or an OpenAPI client
generator. For a theme/page workflow, create a theme first and replace the
example `themeId` with its returned ID before creating a page.

The contract is maintained in `server/src/openapi.js`. Update it alongside
route changes. It documents all health, theme, and page operations in
`server/src`, including request/response schemas, examples, filters, status
codes, and validation rules. The documentation routes themselves are not
business operations in the contract.

The Express API runs on `http://localhost:3001` by default. Set `PORT` to
change the port. All endpoints are prefixed with `/api`, use JSON request and
response bodies, and return errors in this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "A human-readable explanation."
  }
}
```

Successful resource responses use `{ "data": ... }`; list endpoints return
`{ "data": [...] }`. Delete endpoints return `204 No Content`.

## Health

### `GET /api/health`

Checks the database connection.

- `200`: `{ "status": "ok", "database": "connected", ... }`
- `503`: `{ "status": "error", "database": "unavailable", ... }`

## Themes

### `GET /api/themes`

Lists themes, newest first. Each theme includes `_count.pages`.

### `POST /api/themes`

Creates a theme.

Required body:

```json
{
  "name": "Brand",
  "slug": "brand",
  "configJson": {
    "colors": {
      "primary": "#0055aa"
    }
  }
}
```

### `GET /api/themes/:id`

Gets one theme by its ID, including `_count.pages`.

### `PATCH /api/themes/:id`

Updates any subset of `name`, `slug`, and `configJson`. At least one field is
required. `configJson` must be a JSON object or array.

### `DELETE /api/themes/:id`

Deletes a theme if it has no pages. Returns `409 CONFLICT` while pages still
reference it (`onDelete: Restrict`).

## Pages

### `GET /api/pages`

Lists pages, newest first. Optionally filter with `themeId` and/or `status`:

```text
GET /api/pages?themeId=<theme-id>&status=PUBLISHED
```

Valid statuses are `DRAFT` and `PUBLISHED`. Each result includes its theme's
`id`, `name`, and `slug`.

### `POST /api/pages`

Creates a page. The referenced theme must exist.

Required body:

```json
{
  "name": "Home",
  "slug": "home",
  "themeId": "<theme-id>",
  "contentJson": {
    "sections": []
  },
  "status": "DRAFT"
}
```

`status` is optional and defaults to `DRAFT`. `contentJson` must be a JSON
object or array. New pages start at version `1`.

### `GET /api/pages/:id`

Gets one page by its ID, including its theme's `id`, `name`, and `slug`.

### `PATCH /api/pages/:id`

Updates any subset of `name`, `slug`, `themeId`, `contentJson`, and `status`.
At least one field is required. Updating `contentJson` increments `version`;
other field updates do not.

### `POST /api/pages/:id/publish`

Sets the page status to `PUBLISHED` and creates an immutable `PageVersion`
snapshot of its current `contentJson` and version number. Each publish creates
a snapshot, including repeated publishes at the same page version.

### `POST /api/pages/:id/duplicate`

Creates a `DRAFT` copy of the page with the same theme and `contentJson`. Its
version starts at `1`; its name gains ` (Copy)`, and its slug is made unique
using `<source-slug>-copy`, then `<source-slug>-copy-2`, and so on. Returns
`201` with the created page.

### `GET /api/pages/:id/versions`

Returns the page's immutable publish snapshots, newest first. Each snapshot
contains `id`, `pageId`, `version`, `contentJson`, and `createdAt`. Returns
`404` if the page does not exist.

### `POST /api/pages/:id/rollback/:versionId`

Restores `contentJson` from a snapshot belonging to the specified page and
increments the page's version counter. Returns the updated page. Returns `404`
if the page or matching snapshot does not exist.

### `GET /api/public/pages/:slug`

Returns published page content for external consumers in this shape:

```json
{
  "data": {
    "page": {
      "id": "<page-id>",
      "name": "Home",
      "slug": "home",
      "contentJson": { "sections": [], "seo": { "title": "Home" } },
      "version": 1
    },
    "theme": {
      "id": "<theme-id>",
      "name": "Brand",
      "slug": "brand",
      "configJson": { "colors": { "primary": "#0055aa" } }
    },
    "seo": { "title": "Home" }
  }
}
```

`seo` is resolved from `contentJson.seo` when it is an object, or `{}` when
that property is missing or is not an object. Draft pages and unknown slugs
both return `404`. Responses advertise
`Cache-Control: public, max-age=60, stale-while-revalidate=300`.

### `DELETE /api/pages/:id`

Deletes a page.

## Common status codes

| Status | Meaning |
| --- | --- |
| `200` | Request succeeded |
| `201` | Resource created |
| `204` | Resource deleted |
| `400` | Invalid JSON, invalid field, or missing required field |
| `404` | Resource or API endpoint not found |
| `409` | Duplicate slug, missing referenced theme, or restricted delete |
| `413` | Request body exceeds 10 MB |
| `503` | Database unavailable for the health check |
| `500` | Unexpected server error |

## Database setup and migrations

1. Set `DATABASE_URL` in the project-root `.env` file.
2. For PostgreSQL providers requiring a custom CA, set `DATABASE_CA_BASE64` to
   the Base64-encoded PEM. The API verifies the server certificate and hostname
   when this value is set. It is optional for local databases.
3. Generate Prisma Client with `npm run db:generate`.
4. Apply committed migrations, including the PageVersion table, with
   `npm run db:deploy`. For local schema changes, create and apply a migration
   with `npm run db:migrate -- --name <migration-name>`.
5. Start the API with `npm run server`.

The Prisma schema is in `prisma/schema.prisma`. Do not expose database
credentials through `VITE_`-prefixed variables.
