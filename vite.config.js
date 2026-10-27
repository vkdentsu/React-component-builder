import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { glob } from 'tinyglobby'

const stylesDirectory = fileURLToPath(new URL('./src/styles', import.meta.url))

function sassGlobImports() {
  return {
    name: 'sass-glob-imports',
    enforce: 'pre',

    async transform(code, id) {
      const filePath = id.split('?')[0]

      if (!filePath.endsWith('.scss') || !code.includes('*')) {
        return null
      }

      const importPattern = /@import\s+(["'])([^"']*\*[^"']*)\1\s*;/g
      const matches = [...code.matchAll(importPattern)]

      if (matches.length === 0) {
        return null
      }

      let transformed = code

      for (const match of matches) {
        const files = (await glob(match[2], {
          cwd: path.dirname(filePath),
          absolute: true,
          onlyFiles: true,
        }))
          .map((file) => path.resolve(file))
          .filter((file) => file !== path.resolve(filePath))
          .sort()

        const expandedImports = files
          .map((file) => {
            const relativePath = path
              .relative(path.dirname(filePath), file)
              .split(path.sep)
              .join('/')

            return `@import '${relativePath}';`
          })
          .join('\n')

        transformed = transformed.replace(match[0], expandedImports)

        this.addWatchFile(path.dirname(filePath))
        files.forEach((file) => this.addWatchFile(file))
      }

      return { code: transformed, map: null }
    },
  }
}

export default defineConfig({
  plugins: [sassGlobImports(), react()],

  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: [stylesDirectory],
        additionalData: (content, filename) => {
          const normalizedFilename = filename.replace(/\\/g, '/')

          // Don't inject variables into the variables file itself.
          if (normalizedFilename.endsWith('/_variables.scss')) {
            return content
          }

          return '@use "variables" as *;\n' + content
        },
      },
    },
  },
})
