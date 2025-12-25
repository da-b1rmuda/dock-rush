import fs from 'node:fs/promises'
import path from 'node:path'
import { ConsoleLogger } from './logger'
import { readAllMetadata } from './metadata-reader'
import { FolderScanner } from './scanner'
import type { ConsoleFormat, FileInfo } from './types'

export interface DockRushScannerPluginOptions {
	/**
	 * HTTP‑роут, по которому будет висеть endpoint сканера.
	 * По умолчанию: `/api/dock-rush-scan`
	 */
	route?: string

	/**
	 * Корневая папка для разрешения относительного `folderPath`.
	 * По умолчанию — `server.config.root` или `process.cwd()`.
	 */
	root?: string
}

/**
 * Vite‑плагин, который обрабатывает запросы от клиентского компонента
 * и запускает `FolderScanner` на стороне Node.
 */
// Общая функция для настройки middleware
function setupMiddleware(server: any, options: DockRushScannerPluginOptions) {
	// ОБЪЕДИНЕННЫЙ обработчик для всех API
	server.middlewares.use(async (req: any, res: any, next: any) => {
		try {
			if (!req.url) return next()

			// Маршруты API
			const isScanRequest = req.url.startsWith('/api/dock-rush-scan')
			const isMarkdownRequest = req.url.startsWith('/api/dock-rush-markdown')

			if (!isScanRequest && !isMarkdownRequest) {
				return next()
			}

			const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)

			// MARKDOWN ENDPOINT
			if (isMarkdownRequest) {
				const rawFilePath = url.searchParams.get('filePath')
				const folderPath = url.searchParams.get('folderPath') || 'docs'

				if (!rawFilePath) {
					res.statusCode = 400
					res.setHeader('Content-Type', 'application/json')
					res.end(
						JSON.stringify({
							success: false,
							error: 'filePath parameter is required',
						})
					)
					return
				}

				// Нормализуем путь: заменяем обратные слэши на прямые
				const filePath = rawFilePath.replaceAll('\\', '/')

				const root = options.root ?? server.config?.root ?? process.cwd()

				// ДВА варианта пути:
				// 1. Если filePath абсолютный (содержит полный путь)
				let absoluteFilePath: string

				if (path.isAbsolute(filePath)) {
					// Это уже абсолютный путь от сканера
					absoluteFilePath = filePath
				} else {
					// Это относительный путь
					absoluteFilePath = path.resolve(root, folderPath, filePath)
				}

				// Проверка безопасности
				const docsFolder = path.resolve(root, folderPath)
				const normalizedTargetFile = path.normalize(absoluteFilePath)
				const normalizedDocsFolder = path.normalize(docsFolder)

				if (!normalizedTargetFile.startsWith(normalizedDocsFolder)) {
					res.statusCode = 403
					res.setHeader('Content-Type', 'application/json')
					res.end(
						JSON.stringify({
							success: false,
							error: 'Access denied: file outside docs folder',
						})
					)
					return
				}

				try {
					// Проверяем существование файла
					await fs.access(absoluteFilePath)

					const rawContent = await fs.readFile(absoluteFilePath, 'utf-8')
					const stats = await fs.stat(absoluteFilePath)

					// Удаляем frontmatter блок от --- до --- включительно
					let cleanContent = rawContent
					let frontmatterData: Record<string, unknown> = {}

					// Проверяем, есть ли frontmatter в начале файла
					const frontmatterMatch = rawContent.match(
						/^---\s*\n([\s\S]*?)\n---\s*\n?/m
					)

					if (frontmatterMatch) {
						// Извлекаем frontmatter для парсинга
						const matter = await import('gray-matter')
						try {
							const parsed = matter.default(rawContent)
							frontmatterData = parsed.data || {}
						} catch (error) {
							// Если парсинг не удался, frontmatterData остается пустым
						}

						// Удаляем весь frontmatter блок (от первого --- до второго --- включительно)
						cleanContent = rawContent.replace(
							/^---\s*\n[\s\S]*?\n---\s*\n?/m,
							''
						)
					}

					// Удаляем все пустые строки в начале (после frontmatter)
					cleanContent = cleanContent.replace(/^\s*\n+/g, '')
					// Удаляем все пустые строки в конце
					cleanContent = cleanContent.replace(/\n+\s*$/g, '')

					res.setHeader('Content-Type', 'application/json')
					res.setHeader('Cache-Control', 'no-cache')
					res.statusCode = 200
					res.end(
						JSON.stringify({
							success: true,
							content: cleanContent,
							frontmatter: frontmatterData,
							metadata: {
								path: absoluteFilePath,
								relativePath: path.relative(docsFolder, absoluteFilePath),
								name: path.basename(absoluteFilePath),
								size: stats.size,
								modified: stats.mtime,
								created: stats.birthtime,
							},
						})
					)
				} catch (fileError) {
					const errorMessage =
						fileError instanceof Error ? fileError.message : 'File not found'
					res.statusCode = 404
					res.setHeader('Content-Type', 'application/json')
					res.end(
						JSON.stringify({
							success: false,
							error: `File not found: ${errorMessage}`,
							requestedPath: absoluteFilePath,
							normalizedPath: normalizedTargetFile,
							docsFolder: normalizedDocsFolder,
						})
					)
				}
				return
			}

			// SCAN ENDPOINT
			if (isScanRequest) {
				const folderPath = url.searchParams.get('folderPath') ?? ''
				const consoleEnabled = url.searchParams.get('console') === 'true'
				const consoleFormat = (url.searchParams.get('consoleFormat') ||
					'tree') as ConsoleFormat
				const ignore = url.searchParams.getAll('ignore') || undefined

				if (!folderPath) {
					res.statusCode = 400
					res.setHeader('Content-Type', 'application/json')
					res.end(
						JSON.stringify({
							success: false,
							error: 'folderPath parameter is required',
							versions: [],
							files: [],
						})
					)
					return
				}

				const root = options.root ?? server.config?.root ?? process.cwd()
				const targetFolder = path.resolve(root, folderPath)

				const scanner = new FolderScanner()
				const result = await scanner.scan(targetFolder, { ignore })

				if (result.success) {
					// Читаем метаданные для всех файлов
					const metadata = await readAllMetadata(result.files, targetFolder)

					// Читаем содержимое markdown файлов для поиска
					const filesWithContent: FileInfo[] = await Promise.all(
						result.files.map(async (file): Promise<FileInfo> => {
							// Читаем содержимое только для markdown файлов
							if (file.type === 'file' && file.extension === 'md') {
								try {
									const absolutePath = path.isAbsolute(file.path)
										? file.path
										: path.join(targetFolder, file.path)

									const rawContent = await fs.readFile(absolutePath, 'utf-8')

									// Удаляем frontmatter и ограничиваем размер для индексации
									let content = rawContent
									const frontmatterMatch = rawContent.match(
										/^---\s*\n([\s\S]*?)\n---\s*\n?/m
									)

									if (frontmatterMatch) {
										content = rawContent.replace(
											/^---\s*\n[\s\S]*?\n---\s*\n?/m,
											''
										)
									}

									// Ограничиваем размер содержимого для индексации (первые 10000 символов)
									const indexedContent = content
										.replace(/^\s*\n+/g, '') // Убираем пустые строки в начале
										.replace(/\n+\s*$/g, '') // Убираем пустые строки в конце
										.substring(0, 10000)
										.toLowerCase()

									return {
										...file,
										content: indexedContent,
									}
								} catch (error) {
									return file
								}
							}
							return file
						})
					)

					// Log to console if enabled
					if (consoleEnabled) {
						ConsoleLogger.log(filesWithContent, targetFolder, consoleFormat)
					}

					// Преобразуем Map в объект для JSON
					const metadataObj: Record<string, unknown> = {}
					for (const [key, value] of metadata.entries()) {
						metadataObj[key] = value
					}

					// Return JSON response
					res.setHeader('Content-Type', 'application/json')
					res.statusCode = 200
					res.end(
						JSON.stringify({
							success: true,
							versions: result.versions,
							files: filesWithContent,
							metadata: metadataObj,
						})
					)
				} else {
					res.setHeader('Content-Type', 'application/json')
					res.statusCode = 500
					res.end(
						JSON.stringify({
							success: false,
							error: result.error,
							versions: [],
							files: [],
						})
					)
				}
			}
		} catch (error) {
			if (!res.headersSent) {
				res.statusCode = 500
				res.setHeader('Content-Type', 'application/json')
				res.end(
					JSON.stringify({
						success: false,
						error: 'Internal server error',
					})
				)
			}
		}
	})
}

export function dockRushScannerPlugin(
	options: DockRushScannerPluginOptions = {}
) {
	const VIRTUAL_STYLES_ID = 'virtual:dock-rush-styles'
	const RESOLVED_STYLES_ID = '\0' + VIRTUAL_STYLES_ID

	return {
		name: 'dock-rush-folder-scanner',
		enforce: 'pre' as const,
		resolveId(id: string) {
			// Создаем виртуальный модуль для стилей
			if (id === VIRTUAL_STYLES_ID) {
				return RESOLVED_STYLES_ID
			}
		},
		load(id: string) {
			// Загружаем виртуальный модуль, который импортирует стили
			if (id === RESOLVED_STYLES_ID) {
				return `import 'dock-rush/style.css'`
			}
		},
		transform(code: string, id: string) {
			// Автоматически добавляем импорт стилей при импорте основного модуля dock-rush
			// Это работает и в dev, и в production
			const isDockRushClient =
				(id.includes('node_modules/dock-rush/dist/client') ||
					id.includes('dock-rush/dist/client') ||
					// Для dev режима, когда модуль еще не собран
					(id.includes('dock-rush') &&
						!id.includes('style.css') &&
						!id.includes('plugin') &&
						!id.includes('server') &&
						!id.includes(VIRTUAL_STYLES_ID) &&
						code.includes('export') &&
						code.includes('Documentation'))) &&
				!code.includes('dock-rush/style.css') &&
				!code.includes(VIRTUAL_STYLES_ID) &&
				!code.includes("import 'dock-rush/style.css'") &&
				!code.includes('import "dock-rush/style.css"')

			if (isDockRushClient) {
				// Добавляем импорт стилей в начало файла
				return `import 'virtual:dock-rush-styles';\n${code}`
			}
		},
		transformIndexHtml(html: string) {
			// Fallback: инжектим стили в HTML для случаев, когда модули не обработались
			// Это работает как дополнительная страховка и в dev, и в production
			return {
				html,
				tags: [
					{
						tag: 'link',
						attrs: {
							rel: 'stylesheet',
							href: '/node_modules/dock-rush/dist/style.css',
						},
						injectTo: 'head' as const,
					},
				],
			}
		},
		configureServer(server: any) {
			setupMiddleware(server, options)
		},
		configurePreviewServer(server: any) {
			setupMiddleware(server, options)
		},
	}
}
