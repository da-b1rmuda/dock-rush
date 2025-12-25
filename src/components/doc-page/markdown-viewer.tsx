import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Check, Copy } from 'lucide-react'
import * as React from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import {
	oneDark,
	oneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'

interface MarkdownViewerProps {
	readonly filePath: string
	readonly folderPath: string
	readonly onPageSelect: (p: string) => void
}

// Функция для создания якорей из текста заголовка
function toAnchor(children: React.ReactNode): string {
	const regex = /[^\w\s-]/g
	const spaceRegex = /\s+/g
	const dashRegex = /-+/g

	if (typeof children === 'string') {
		return children
			.toLowerCase()
			.replace(regex, '')
			.replace(spaceRegex, '-')
			.replace(dashRegex, '-')
			.trim()
	}
	if (Array.isArray(children)) {
		return children
			.map(child => {
				if (typeof child === 'string') return child
				if (React.isValidElement(child)) {
					const childProps = child.props as { children?: React.ReactNode }
					if (childProps.children) {
						return toAnchor(childProps.children)
					}
				}
				return ''
			})
			.join('')
			.toLowerCase()
			.replace(regex, '')
			.replace(spaceRegex, '-')
			.replace(dashRegex, '-')
			.trim()
	}
	return ''
}

// Компонент для блока кода с кнопкой копирования
function CodeBlock({
	codeString,
	language,
	copiedCode,
	setCopiedCode,
	codeTheme,
}: {
	readonly codeString: string
	readonly language: string
	readonly copiedCode: string | null
	readonly setCopiedCode: (id: string | null) => void
	readonly codeTheme: any
}) {
	const codeId = React.useId()
	const isCopied = copiedCode === codeId

	return (
		<div className='my-6 overflow-hidden rounded-lg border border-border bg-card'>
			<div className='flex h-12 items-center justify-between border-b border-border bg-muted/50 px-4'>
				<span className='text-sm font-medium text-foreground'>{language}</span>
				<Button
					variant='ghost'
					size='sm'
					className='h-8 w-8 p-0'
					onClick={() => {
						navigator.clipboard.writeText(codeString)
						setCopiedCode(codeId)
						setTimeout(() => setCopiedCode(null), 2000)
					}}
				>
					{isCopied ? (
						<Check className='h-4 w-4' />
					) : (
						<Copy className='h-4 w-4' />
					)}
					<span className='sr-only'>Copy code</span>
				</Button>
			</div>
			<SyntaxHighlighter
				style={codeTheme}
				language={language}
				PreTag='div'
				showLineNumbers={false}
				customStyle={{
					margin: 0,
					padding: '1rem',
					fontSize: '14px',
					lineHeight: '1.5',
					background: 'transparent',
				}}
			>
				{codeString}
			</SyntaxHighlighter>
		</div>
	)
}

// Функция для разрешения путей к изображениям
function resolveImagePath(src: string, filePath: string, folderPath: string): string {
	// Абсолютные пути (http, https, data:) оставляем как есть
	if (
		!src ||
		src.startsWith('http://') ||
		src.startsWith('https://') ||
		src.startsWith('data:')
	) {
		return src
	}

	// Если путь начинается с /, это абсолютный путь от корня сайта
	// Но нам нужно проверить, не находится ли он в папке документации
	if (src.startsWith('/')) {
		// Если путь уже начинается с folderPath, оставляем как есть
		const cleanFolderPath = folderPath.replace(/^\/+/, '').replace(/\/+$/, '')
		if (src.startsWith(`/${cleanFolderPath}/`)) {
			return src
		}
		// Иначе добавляем folderPath
		if (cleanFolderPath) {
			return `/${cleanFolderPath}${src}`
		}
		return src
	}

	// Относительные пути разрешаем относительно текущего файла
	// filePath имеет формат: "2.0.2/ru/api/markdown-test.md" (относительно folderPath)
	if (!filePath) {
		// Если filePath пустой, просто добавляем folderPath
		const cleanFolderPath = folderPath.replace(/^\/+/, '').replace(/\/+$/, '')
		const imageName = src.replace(/\\/g, '/').replace(/^\.\//, '')
		if (cleanFolderPath) {
			return `/${cleanFolderPath}/${imageName}`
		}
		return `/${imageName}`
	}
	
	// Убираем имя файла из пути, оставляем только директорию
	const fileDir = filePath.replace(/[/\\][^/\\]*\.md$/, '').replace(/\\/g, '/')
	
	// Нормализуем путь изображения (убираем начальные ./ если есть)
	const imagePath = src.replace(/\\/g, '/').replace(/^\.\//, '')
	const imageParts = imagePath.split('/').filter(Boolean)
	
	// Начинаем с директории файла (может быть пустой, если файл в корне)
	const dirParts = fileDir ? fileDir.split('/').filter(Boolean) : []

	// Обрабатываем относительные пути (.., .)
	for (const part of imageParts) {
		if (part === '..') {
			if (dirParts.length > 0) {
				dirParts.pop()
			}
		} else if (part !== '.') {
			dirParts.push(part)
		}
	}

	// Формируем путь относительно папки документации
	const resolvedPath = dirParts.length > 0 ? dirParts.join('/') : ''
	
	// Добавляем folderPath в начало пути
	// В Vite файлы из public доступны по корневому пути
	const cleanFolderPath = folderPath.replace(/^\/+/, '').replace(/\/+$/, '')
	
	if (cleanFolderPath) {
		if (resolvedPath) {
			return `/${cleanFolderPath}/${resolvedPath}`
		}
		// Если resolvedPath пустой, но есть folderPath, возвращаем только folderPath
		// Это может произойти, если изображение указано как "./" или "../" до корня
		return `/${cleanFolderPath}`
	}
	
	return resolvedPath ? `/${resolvedPath}` : '/'
}

export function MarkdownViewer({
	filePath,
	folderPath,
	onPageSelect,
}: MarkdownViewerProps) {
	const [content, setContent] = React.useState<string>('')
	const [loading, setLoading] = React.useState(true)
	const [error, setError] = React.useState<string | null>(null)
	const [isDark, setIsDark] = React.useState(false)
	const [copiedCode, setCopiedCode] = React.useState<string | null>(null)

	React.useEffect(() => {
		const checkTheme = () => {
			setIsDark(document.documentElement.classList.contains('dark'))
		}
		checkTheme()
		const observer = new MutationObserver(checkTheme)
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class'],
		})
		return () => observer.disconnect()
	}, [])

	const codeTheme = isDark ? oneDark : oneLight

	React.useEffect(() => {
		const loadMarkdown = async () => {
			setLoading(true)
			setError(null)
			setContent('')

			// Минимальная задержка для плавности анимации
			const minDelay = 200

			try {
				const startTime = Date.now()

				// Загружаем markdown файл через API
				const params = new URLSearchParams()
				params.set('filePath', filePath)
				params.set('folderPath', folderPath)

				const response = await fetch(
					`/api/dock-rush-markdown?${params.toString()}`,
					{
						headers: {
							Accept: 'application/json',
						},
					}
				)

				if (!response.ok) {
					throw new Error(`HTTP ${response.status}: ${response.statusText}`)
				}

				const data = await response.json()

				// Вычисляем оставшееся время для минимальной задержки
				const elapsed = Date.now() - startTime
				const remainingDelay = Math.max(0, minDelay - elapsed)

				await new Promise(resolve => setTimeout(resolve, remainingDelay))

				if (data.success) {
					setContent(data.content)
					// Небольшая задержка перед скрытием loading для плавности
					setTimeout(() => {
						setLoading(false)
					}, 100)
				} else {
					throw new Error(data.error || 'Failed to load markdown')
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Unknown error')
				setLoading(false)
			}
		}

		if (filePath) {
			loadMarkdown()
		}
	}, [filePath, folderPath])

	if (error) {
		return (
			<div className='flex flex-col items-center justify-center p-12 animate-in fade-in-0 duration-300'>
				<p className='text-destructive'>Ошибка загрузки файла: {error}</p>
			</div>
		)
	}

	return (
		<div className='relative mx-auto max-w-4xl px-6 py-8 h-full'>
			{/* Скелетон */}
			{loading && (
				<div className='flex flex-col gap-4 p-6 animate-in fade-in-0 duration-200'>
					<Skeleton className='h-8 w-3/4' />
					<Skeleton className='h-4 w-full' />
					<Skeleton className='h-4 w-full' />
					<Skeleton className='h-4 w-2/3' />
					<Skeleton className='h-4 w-full' />
					<Skeleton className='h-4 w-5/6' />
					<Skeleton className='h-4 w-full' />
					<Skeleton className='h-4 w-4/5' />
				</div>
			)}

			{/* Контент */}
			{!loading && content && (
				<div className='animate-in fade-in-0 duration-300'>
					<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				rehypePlugins={[rehypeRaw, rehypeSanitize]}
				components={{
					// Заголовки в стиле shadcn
					h1: ({ node, ...props }) => {
						const anchor = toAnchor(props.children)
						return (
							<h1
								id={anchor}
								className='mb-6 mt-8 scroll-mt-20 text-4xl font-bold tracking-tight'
								{...props}
							/>
						)
					},
					h2: ({ node, ...props }) => {
						const anchor = toAnchor(props.children)
						return (
							<h2
								id={anchor}
								className='mb-4 mt-8 scroll-mt-20 text-3xl font-semibold tracking-tight'
								{...props}
							/>
						)
					},
					h3: ({ node, ...props }) => {
						const anchor = toAnchor(props.children)
						return (
							<h3
								id={anchor}
								className='mb-3 mt-6 scroll-mt-20 text-2xl font-semibold tracking-tight'
								{...props}
							/>
						)
					},
					h4: ({ node, ...props }) => {
						const anchor = toAnchor(props.children)
						return (
							<h4
								id={anchor}
								className='mb-2 mt-4 scroll-mt-20 text-xl font-semibold tracking-tight'
								{...props}
							/>
						)
					},
					h5: ({ node, ...props }) => {
						const anchor = toAnchor(props.children)
						return (
							<h5
								id={anchor}
								className='mb-2 mt-4 scroll-mt-20 text-lg font-semibold'
								{...props}
							/>
						)
					},
					h6: ({ node, ...props }) => {
						const anchor = toAnchor(props.children)
						return (
							<h6
								id={anchor}
								className='mb-2 mt-4 scroll-mt-20 text-base font-semibold'
								{...props}
							/>
						)
					},
					// Параграфы в стиле shadcn
					p: ({ node, children, ...props }: any) => {
						// Проверяем, есть ли внутри изображения или другие блочные элементы
						const childrenArray = React.Children.toArray(children)
						const hasBlockElements = childrenArray.some((child: unknown) => {
							if (React.isValidElement(child)) {
								if (child.type === 'figure' || child.type === 'img') {
									return true
								}
								const childProps = child.props as { node?: any }
								if (childProps?.node) {
									const childNode = childProps.node
									if (
										childNode.type === 'element' &&
										(childNode.tagName === 'img' ||
											childNode.tagName === 'figure')
									) {
										return true
									}
								}
							}
							return false
						})

						if (hasBlockElements) {
							const { ref, ...divProps } = props as any
							return (
								<div
									className='mb-6 leading-7 text-muted-foreground'
									{...divProps}
								>
									{children}
								</div>
							)
						}

						return (
							<p className='mb-6 leading-7 text-muted-foreground' {...props}>
								{children}
							</p>
						)
					},
					// Списки в стиле shadcn
					ul: ({ node, ...props }) => (
						<ul
							className='my-6 ml-6 list-disc space-y-2 text-muted-foreground'
							{...props}
						/>
					),
					ol: ({ node, ...props }) => (
						<ol
							className='my-6 ml-6 list-decimal space-y-2 text-muted-foreground'
							{...props}
						/>
					),
					li: ({ node, ...props }) => (
						<li className='leading-7 pl-2' {...props} />
					),
					// Чекбоксы для task lists
					input: ({ node, ...props }: any) => {
						if (props.type === 'checkbox') {
							return (
								<input
									type='checkbox'
									className='mr-2 h-4 w-4 rounded border-border accent-primary'
									disabled
									{...props}
								/>
							)
						}
						return <input {...props} />
					},
					// Цитаты в стиле shadcn
					blockquote: ({ node, ...props }) => (
						<blockquote
							className='my-6 border-l-2 border-border bg-muted/50 pl-6 italic text-muted-foreground'
							{...props}
						/>
					),
					// Подсветка кода в стиле shadcn
					code: ({ node, inline, className, children, ...props }: any) => {
						const match = /language-(\w+)/.exec(className || '')
						const codeString = String(children).replace(/\n$/, '')

						if (!inline && match) {
							return (
								<CodeBlock
									codeString={codeString}
									language={match[1]}
									copiedCode={copiedCode}
									setCopiedCode={setCopiedCode}
									codeTheme={codeTheme}
								/>
							)
						}
						return (
							<code
								className='relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold'
								{...props}
							>
								{children}
							</code>
						)
					},
					pre: ({ node, ...props }: any) => {
						const { ref, ...divProps } = props
						return <div {...divProps} />
					},
					// Изображения в стиле shadcn
					img: ({ src, alt, title }: any) => {
						// Разрешаем путь к изображению относительно текущего файла
						const resolvedSrc = resolveImagePath(
							src || '',
							filePath || '',
							folderPath || 'docs'
						)
						
						return (
							<figure className='my-8'>
								<img
									src={resolvedSrc}
									alt={alt}
									title={title}
									loading='lazy'
									className='rounded-lg border border-border bg-muted max-w-full h-auto'
									onError={(e) => {
										// Если изображение не загрузилось, показываем placeholder
										const target = e.target as HTMLImageElement
										target.style.display = 'none'
										const figure = target.closest('figure')
										if (figure && !figure.querySelector('.image-error')) {
											const errorDiv = document.createElement('div')
											errorDiv.className = 'image-error p-4 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg'
											errorDiv.textContent = `Изображение не найдено: ${src} (путь: ${resolvedSrc})`
											figure.appendChild(errorDiv)
										}
									}}
								/>
								{alt && (
									<figcaption className='mt-3 text-center text-sm text-muted-foreground'>
										{alt}
									</figcaption>
								)}
							</figure>
						)
					},
					// Ссылки в стиле shadcn
					a: ({ href, children, ...props }: any) => {
						/* 1. внешние / якоря – оставляем как есть */
						if (
							!href ||
							href.startsWith('http') ||
							href.startsWith('#') ||
							href.startsWith('mailto:') ||
							href.startsWith('tel:')
						) {
							return (
								<a
									href={href}
									className='font-medium text-primary underline underline-offset-4 transition-colors hover:text-primary/80'
									target='_blank'
									rel='noopener noreferrer'
									{...props}
								>
									{children}
								</a>
							)
						}

						/* 2. локальный .md – перехватываем */
						if (href.toLowerCase().endsWith('.md')) {
							const handle = (e: React.MouseEvent) => {
								e.preventDefault()

								/* 2а. выделяем папку текущего файла (убираем имя.md) */
								const dir = filePath.replace(/[/\\][^/\\]*\.md$/, '') // убирает \installation.md

								/* 2b. нормализуем слеши → всегда "/" для единообразия */
								const base = dir.replace(/\\/g, '/')

								/* 2c. резолвим относительную ссылку */
								const rel = href.replace(/\\/g, '/')
								const relParts = rel.split('/').filter(Boolean)
								const baseParts = base.split('/').filter(Boolean)

								for (const p of relParts) {
									if (p === '..') baseParts.pop()
									else if (p !== '.') baseParts.push(p)
								}

								const absolute = baseParts.join('/')
								// onPageSelect теперь обновляет URL автоматически
								onPageSelect(absolute)
							}

							return (
								<a
									href={href}
									onClick={handle}
									className='font-medium text-primary underline underline-offset-4 transition-colors hover:text-primary/80 cursor-pointer'
									{...props}
								>
									{children}
								</a>
							)
						}

						/* 3. остальные внутренние ссылки – просто отдаём */
						return (
							<a
								href={href}
								className='font-medium text-primary underline underline-offset-4 transition-colors hover:text-primary/80'
								{...props}
							/>
						)
					},
					// Таблицы в стиле shadcn
					table: ({ children }: any) => (
						<div className='my-6 w-full overflow-y-auto'>
							<table className='w-full border-collapse'>{children}</table>
						</div>
					),
					thead: ({ node, ...props }) => (
						<thead className='[&_tr]:border-b' {...props} />
					),
					th: ({ node, ...props }) => (
						<th
							className='h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0'
							{...props}
						/>
					),
					td: ({ node, ...props }) => (
						<td
							className='p-4 align-middle [&:has([role=checkbox])]:pr-0'
							{...props}
						/>
					),
					tbody: ({ node, ...props }: any) => (
						<tbody className='[&_tr:last-child]:border-0' {...props} />
					),
					tr: ({ node, ...props }: any) => (
						<tr
							className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'
							{...props}
						/>
					),
					// Горизонтальная линия в стиле shadcn
					hr: ({ node, ...props }) => (
						<hr className='my-8 border-t border-border' {...props} />
					),
					// Форматирование текста в стиле shadcn
					strong: ({ node, ...props }) => (
						<strong className='font-semibold text-foreground' {...props} />
					),
					em: ({ node, ...props }) => (
						<em className='italic text-foreground' {...props} />
					),
					del: ({ node, ...props }) => (
						<del className='line-through text-muted-foreground' {...props} />
					),
					// Дополнительные HTML элементы
					// Поддержка <mark> для выделения
					mark: ({ node, ...props }: any) => (
						<mark
							className='bg-yellow-200 dark:bg-yellow-900/50 px-1 rounded'
							{...props}
						/>
					),
					// Поддержка <kbd> для клавиатурных сочетаний
					kbd: ({ node, ...props }: any) => (
						<kbd
							className='px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded shadow-sm'
							{...props}
						/>
					),
					// Поддержка <abbr> для аббревиатур
					abbr: ({ node, title, ...props }: any) => (
						<abbr
							title={title}
							className='underline decoration-dotted cursor-help'
							{...props}
						/>
					),
					// Поддержка <sub> и <sup>
					sub: ({ node, ...props }: any) => (
						<sub className='text-xs align-sub' {...props} />
					),
					sup: ({ node, ...props }: any) => (
						<sup className='text-xs align-super' {...props} />
					),
					// Поддержка <details> и <summary>
					details: ({ node, ...props }: any) => (
						<details
							className='my-4 px-4 rounded-lg border border-border bg-muted/30'
							{...props}
						/>
					),
					summary: ({ node, ...props }: any) => (
						<summary
							className='cursor-pointer px-4 py-2 font-semibold hover:bg-muted/50'
							{...props}
						/>
					),
					// Поддержка <dl>, <dt>, <dd> для списков определений
					dl: ({ node, ...props }: any) => (
						<dl className='my-4 space-y-2' {...props} />
					),
					dt: ({ node, ...props }: any) => (
						<dt className='font-semibold text-foreground' {...props} />
					),
					dd: ({ node, ...props }: any) => (
						<dd className='ml-6 text-muted-foreground' {...props} />
					),
					// Поддержка <video>
					video: ({ node, src, ...props }: any) => (
						<video
							src={src}
							controls
							className='my-4 w-full rounded-lg border border-border'
							{...props}
						/>
					),
					// Поддержка <iframe>
					iframe: ({ node, src, title, ...props }: any) => (
						<iframe
							src={src}
							title={title}
							className='my-4 w-full rounded-lg border border-border'
							allowFullScreen
							{...props}
						/>
					),
					// Поддержка <audio>
					audio: ({ node, src, ...props }: any) => (
						<audio src={src} controls className='my-4 w-full' {...props} />
					),
					// Поддержка <br>
					br: ({ node, ...props }: any) => <br {...props} />,
					// Поддержка <div>
					div: ({ node, className, ...props }: any) => {
						// Сохраняем классы если они есть, добавляем базовые стили
						const finalClassName = className ? `${className} my-2` : 'my-2'
						return <div className={finalClassName} {...props} />
					},
					// Поддержка <span>
					span: ({ node, ...props }: any) => <span {...props} />,
					// Поддержка <section>
					section: ({ node, ...props }: any) => (
						<section className='my-6' {...props} />
					),
					// Поддержка <article>
					article: ({ node, ...props }: any) => (
						<article className='my-6' {...props} />
					),
					// Поддержка <aside>
					aside: ({ node, ...props }: any) => (
						<aside
							className='my-4 border-l-4 border-primary pl-4 italic text-muted-foreground'
							{...props}
						/>
					),
					// Поддержка <address>
					address: ({ node, ...props }: any) => (
						<address className='my-4 not-italic' {...props} />
					),
					// Поддержка <time>
					time: ({ node, datetime, ...props }: any) => (
						<time
							dateTime={datetime}
							className='text-muted-foreground'
							{...props}
						/>
					),
					// Поддержка <small>
					small: ({ node, ...props }: any) => (
						<small className='text-sm text-muted-foreground' {...props} />
					),
					// Поддержка <ins> (вставленный текст)
					ins: ({ node, ...props }: any) => (
						<ins
							className='no-underline bg-green-100 dark:bg-green-900/30 px-1 rounded'
							{...props}
						/>
					),
					// Поддержка <samp> (пример вывода)
					samp: ({ node, ...props }: any) => (
						<samp
							className='font-mono bg-muted px-1 py-0.5 rounded text-sm'
							{...props}
						/>
					),
					// Поддержка <var> (переменные)
					var: ({ node, ...props }: any) => (
						<var className='italic font-mono text-primary' {...props} />
					),
					// Поддержка <cite> (цитата источника)
					cite: ({ node, ...props }: any) => (
						<cite className='italic text-muted-foreground' {...props} />
					),
					// Поддержка <q> (короткая цитата)
					q: ({ node, ...props }: any) => (
						<q className='italic text-muted-foreground' {...props} />
					),
					// Поддержка <dfn> (определение термина)
					dfn: ({ node, ...props }: any) => (
						<dfn className='italic font-semibold' {...props} />
					),
					// Поддержка <bdi> и <bdo> (двунаправленный текст)
					bdi: ({ node, ...props }: any) => <bdi {...props} />,
					bdo: ({ node, dir, ...props }: any) => <bdo dir={dir} {...props} />,
					// Поддержка <wbr> (возможный перенос строки)
					wbr: ({ node, ...props }: any) => <wbr {...props} />,
					// Поддержка <ruby>, <rt>, <rp> (руби-аннотации)
					ruby: ({ node, ...props }: any) => (
						<ruby className='text-base' {...props} />
					),
					rt: ({ node, ...props }: any) => (
						<rt className='text-xs text-muted-foreground' {...props} />
					),
					rp: ({ node, ...props }: any) => (
						<rp className='text-xs text-muted-foreground' {...props} />
					),
					// Поддержка <meter> (измеритель)
					meter: ({ node, value, min, max, ...props }: any) => (
						<meter
							value={value}
							min={min}
							max={max}
							className='w-full h-2 rounded'
							{...props}
						/>
					),
					// Поддержка <progress> (прогресс-бар)
					progress: ({ node, value, max, ...props }: any) => (
						<progress
							value={value}
							max={max}
							className='w-full h-2 rounded'
							{...props}
						/>
					),
				}}
			>
				{content}
			</ReactMarkdown>
				</div>
			)}
		</div>
	)
}
