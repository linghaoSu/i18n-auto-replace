import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  vue: false,
  react: false,
  jsonc: true,
  yaml: true,
  ignores: [
    'dist',
    'node_modules',
    'locales',
    'package.nls*.json',
    'pnpm-lock.yaml',
    'resources/**/*.svg',
  ],
})
