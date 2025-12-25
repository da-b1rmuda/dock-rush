import { defineConfig } from 'tsup'

export default defineConfig([
	// Клиентская часть (React компоненты)
	{
		entry: ['src/client.ts'],
		format: ['esm', 'cjs'],
		dts: true,
		sourcemap: true,
		clean: false, // Не очищать, чтобы не удалить plugin
		minify: true,
		external: [
			'react',
			'react-dom',
			'react/jsx-runtime',
			'react/jsx-dev-runtime',
			'scheduler',
		],
		loader: {
			'.css': 'empty',
		},
		outDir: 'dist',
		outExtension({ format }) {
			return {
				js: format === 'cjs' ? '.cjs' : '.mjs',
			}
		},
	},
	// Серверная часть (Vite плагин)
	{
		entry: ['src/plugin.ts'],
		format: ['esm', 'cjs'],
		dts: true,
		sourcemap: true,
		clean: false,
		minify: true,
		external: [
			'fast-glob',
			'path',
			'fs',
			'node:fs',
			'node:fs/promises',
			'node:path',
			'vite',
		],
		outDir: 'dist',
		outExtension({ format }) {
			return {
				js: format === 'cjs' ? '.cjs' : '.mjs',
			}
		},
	},
])
