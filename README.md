# React + Vite
Tech Stack
-  React + Vite
- @dnd-kit/core, @dnd-kit/sortable, state management with localstorage zustand, tailwind
 
Completed as of now
- Drag-and-drop canvas
- 8 droppable elements: Button, Text, Heading, Input, Image, Card, Badge, Divider
- Component naming
- Undo, Redo changes
- Device preview Desktop / Tablet / Mobile
- Export as .jsx file

## Node version
LTS 
v - 26.3.0

## React Compiler
npm install
npm run dev

## Backend Database Configuration

Use the single `.env` file in the project root for local configuration.
Set `DATABASE_URL` to your PostgreSQL connection string and
`DATABASE_CA_BASE64` to the Base64-encoded contents of your provider's PEM CA
certificate. On macOS, encode the certificate with:

```sh
base64 < /path/to/ca.pem | tr -d '\n'
```

The Express backend loads the root `.env` automatically using Node's native
environment loader. Existing deployment environment variables take precedence.
The PostgreSQL pool in `server/src/database.js` decodes the certificate and
verifies TLS certificates. URL parameters `sslmode`, `sslcert`, `sslkey`, and
`sslrootcert` are removed so they cannot override this TLS configuration.
Backend code can import `pool` from that module and use parameterized queries.
Do not prefix these variables with `VITE_`, which would expose them to the browser.

Run `npm run server` to start the backend on port 3001 (override with `PORT`).
Startup checks the database before listening. `GET /api/health` runs a read-only
database query and returns 200 when connected or 503 when unavailable.

The local environment file and certificate are ignored by Git. The `.env` keys are
`DATABASE_URL`, `DATABASE_CA_BASE64`, and `GEMINI_API_KEY` (for AI generation).
Do not create separate `.env.local` or backend environment files.
Restart Vite and the backend after changing environment settings. In production,
configure the variables in your hosting environment; no certificate file is
needed. Base64 is encoding, not encryption.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
