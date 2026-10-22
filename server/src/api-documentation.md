## API documentation

The API is available at `http://localhost:3001/api` when the backend is running with `npm run server`. While Vite is running, you can also use `http://localhost:5173/api`—requests are proxied to the backend.

All request bodies use JSON. The complete route implementation is in `routes.js`; the README also has an `API overview`.

### Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Check backend status |
| `GET` | `/api/themes` | List themes with page counts |
| `POST` | `/api/themes` | Create a theme |
| `GET` | `/api/themes/:id` | Get a theme and its pages |
| `PATCH` | `/api/themes/:id` | Update a theme |
| `DELETE` | `/api/themes/:id` | Delete a theme without pages |
| `GET` | `/api/pages` | List pages; optionally filter by `themeId` or `status` |
| `POST` | `/api/pages` | Create a draft page |
| `GET` | `/api/pages/:id` | Get a page and its theme |
| `PATCH` | `/api/pages/:id` | Update a page |
| `DELETE` | `/api/pages/:id` | Delete a page |

### Example workflow

Create a theme:

```http
POST /api/themes
Content-Type: application/json

{
  "name": "Minimal",
  "slug": "minimal",
  "configJson": {
    "colors": {
      "primary": "#334155"
    }
  }
}
```

The response includes the theme’s generated `id`. Use that ID to create a page:

```http
POST /api/pages
Content-Type: application/json

{
  "name": "Home",
  "slug": "home",
  "themeId": "THEME_ID_FROM_RESPONSE",
  "contentJson": {
    "components": []
  }
}
```

Use `PATCH` to update only the fields you provide. For example, publish the page:

```http
PATCH /api/pages/PAGE_ID
Content-Type: application/json

{
  "status": "PUBLISHED"
}
```

Or update its content:

```http
PATCH /api/pages/PAGE_ID
Content-Type: application/json

{
  "contentJson": {
    "components": [
      { "type": "hero", "props": { "title": "Welcome" } }
    ]
  }
}
```

Updating `contentJson` increments the page’s `version`. Page statuses are `DRAFT` and `PUBLISHED`.

### Useful details

- Theme and page slugs must be unique. Duplicate slugs return `409 Conflict`.
- `GET /api/pages?themeId=THEME_ID&status=DRAFT` filters the page list.
- Invalid fields or JSON bodies return `400`; missing records return `404`.
- A theme with pages can’t be deleted; delete its pages first.
- Successful deletes return `204 No Content`.