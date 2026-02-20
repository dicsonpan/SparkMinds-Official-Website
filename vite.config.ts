import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Vite plugin that patches @react-pdf/pdfkit's number validation to clamp
 * extreme values instead of throwing "unsupported number" errors.
 *
 * Certain CJK font compound glyphs produce glyph-path coordinates outside
 * pdfkit's accepted range (-1e21, 1e21). The original code throws, which
 * breaks PDF generation for those glyphs. This patch clamps the value to
 * the boundary so the glyph renders (possibly with minor distortion) instead
 * of crashing.
 */
function patchPdfkitNumber(): Plugin {
  return {
    name: 'patch-pdfkit-number',
    transform(code, id) {
      if (!id.includes('@react-pdf/pdfkit')) return null
      // Match the exact pattern:  if (n > -1e21 && n < 1e21) { return Math.round(n * 1e6) / 1e6; } throw new Error(`unsupported number: ${n}`);
      const pattern = /if\s*\(\s*n\s*>\s*-1e21\s*&&\s*n\s*<\s*1e21\s*\)\s*\{\s*return\s+Math\.round\(n\s*\*\s*1e6\)\s*\/\s*1e6;\s*\}\s*throw\s+new\s+Error\(`unsupported number: \$\{n\}`\);/
      if (!pattern.test(code)) return null
      const patched = code.replace(
        pattern,
        'if (n > -1e21 && n < 1e21) { return Math.round(n * 1e6) / 1e6; } return Math.round(Math.max(-1e21 + 1, Math.min(1e21 - 1, n)) * 1e6) / 1e6;'
      )
      return { code: patched, map: null }
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [patchPdfkitNumber(), react()],
})
