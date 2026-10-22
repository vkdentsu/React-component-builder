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

## Sass styles
`src/styles/main.scss` is loaded by the app entry point. Its `@import` glob patterns are expanded by the Vite Sass glob plugin before Sass compilation, so matching `.scss` files added under `src/components` or `src/styles` are included automatically.

## React Compiler
npm install
npm run dev

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
