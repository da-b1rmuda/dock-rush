import { Button } from '@/components/ui/button'
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command'
import { getTitle } from '@/lib/documentation/helpers'
import type {
	DocumentationEntity,
	VersionStructure,
} from '@/lib/documentation/types'
import { Search } from 'lucide-react'
import * as React from 'react'

interface SearchBarProps {
	documentationStructure: VersionStructure[]
	selectedVersion: string | undefined
	selectedLanguage: string | null
	onPageSelect: (filePath: string | null) => void
	scannedFiles?: {
		files: Array<{
			relativePath: string
			originalRelativePath?: string
			content?: string
		}>
	}
}

interface SearchResult {
	entity: DocumentationEntity
	version: string
	path: string
	title: string
	content?: string // Содержимое файла для поиска
	snippet?: string // Фрагмент текста с найденным словом
}

export function SearchBar({
	documentationStructure,
	selectedVersion,
	selectedLanguage,
	onPageSelect,
	scannedFiles,
}: SearchBarProps) {
	const [open, setOpen] = React.useState(false)
	const [query, setQuery] = React.useState('')

	// Создаем Map для быстрого доступа к содержимому файлов
	const contentMap = React.useMemo(() => {
		const map = new Map<string, string>()
		if (scannedFiles?.files) {
			for (const file of scannedFiles.files) {
				const key = file.originalRelativePath || file.relativePath
				if (file.content) {
					map.set(key, file.content)
				}
			}
		}
		return map
	}, [scannedFiles])

	// Получаем все страницы для поиска
	const searchablePages = React.useMemo(() => {
		const results: SearchResult[] = []

		for (const structure of documentationStructure) {
			// Фильтруем по выбранной версии, если она задана
			if (selectedVersion && structure.version !== selectedVersion) {
				continue
			}

			const collectPages = (
				entities: DocumentationEntity[],
				version: string
			): void => {
				for (const entity of entities) {
					if (entity.type === 'page') {
						// Проверяем searchable
						if (entity.frontmatter?.searchable === false) {
							continue
						}

						const filePath =
							entity.file.originalRelativePath || entity.file.relativePath
						const title = getTitle(entity)

						// Получаем содержимое файла из Map
						const content = contentMap.get(filePath)

						results.push({
							entity,
							version,
							path: filePath,
							title,
							content,
						})
					} else if (entity.type === 'dropdown' || entity.type === 'group') {
						// Рекурсивно собираем страницы из dropdown и group
						collectPages(entity.pages, version)
					}
				}
			}

			collectPages(structure.entities, structure.version)
		}

		return results
	}, [documentationStructure, selectedVersion, contentMap])

	// Функция для извлечения фрагмента текста с найденным словом
	const extractSnippet = (
		content: string,
		query: string,
		maxLength = 150
	): string => {
		const lowerContent = content.toLowerCase()
		const lowerQuery = query.toLowerCase()
		const index = lowerContent.indexOf(lowerQuery)

		if (index === -1) return ''

		// Находим начало фрагмента (стараемся взять целое предложение)
		let start = Math.max(0, index - maxLength / 2)
		// Ищем начало предложения или пробел
		const beforeMatch = content.substring(start, index)
		const lastSentence = beforeMatch.lastIndexOf('. ')
		const lastNewline = beforeMatch.lastIndexOf('\n')
		const lastSpace = beforeMatch.lastIndexOf(' ')

		const bestStart = Math.max(
			lastSentence + 2,
			lastNewline + 1,
			lastSpace + 1,
			start
		)

		// Находим конец фрагмента
		let end = Math.min(content.length, index + query.length + maxLength / 2)
		// Ищем конец предложения или пробел
		const afterMatch = content.substring(index + query.length, end)
		const nextSentence = afterMatch.indexOf('. ')
		const nextNewline = afterMatch.indexOf('\n')
		const nextSpace = afterMatch.indexOf(' ')

		let bestEnd = end
		if (nextSentence !== -1) {
			bestEnd = index + query.length + nextSentence + 1
		} else if (nextNewline !== -1) {
			bestEnd = index + query.length + nextNewline
		} else if (nextSpace !== -1) {
			bestEnd = index + query.length + nextSpace
		}

		let snippet = content.substring(bestStart, bestEnd).trim()

		// Добавляем многоточие если обрезали
		if (bestStart > 0) snippet = '...' + snippet
		if (bestEnd < content.length) snippet = snippet + '...'

		return snippet
	}

	// Фильтруем результаты по запросу и извлекаем фрагменты
	const filteredResults = React.useMemo(() => {
		if (!query.trim()) return []

		const lowerQuery = query.toLowerCase().trim()

		return searchablePages
			.filter(page => {
				const titleMatch = page.title.toLowerCase().includes(lowerQuery)
				const pathMatch = page.path.toLowerCase().includes(lowerQuery)
				const contentMatch = page.content?.includes(lowerQuery) ?? false

				return titleMatch || pathMatch || contentMatch
			})
			.map(page => {
				let snippet: string | undefined

				// Если найдено в содержимом, извлекаем фрагмент
				if (page.content?.includes(lowerQuery)) {
					snippet = extractSnippet(page.content, query)
				} else if (page.title.toLowerCase().includes(lowerQuery)) {
					// Если найдено только в заголовке, используем заголовок как snippet
					snippet = page.title
				}

				return {
					...page,
					snippet,
				}
			})
	}, [query, searchablePages])

	// Обработка выбора страницы
	const handleSelect = (path: string) => {
		onPageSelect(path)
		setOpen(false)
		setQuery('')
	}

	// Обработка горячих клавиш
	React.useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault()
				setOpen(open => !open)
			}
		}

		document.addEventListener('keydown', down)
		return () => document.removeEventListener('keydown', down)
	}, [])

	return (
		<>
			<Button
				variant='outline'
				className='relative h-9 w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-64 lg:w-80'
				onClick={() => setOpen(true)}
			>
				<Search className='mr-2 h-4 w-4' />
				<span className='hidden lg:inline-flex'>Поиск документации...</span>
				<span className='inline-flex lg:hidden'>Поиск...</span>
				<kbd className='pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex'>
					<span className='text-xs'>⌘</span>K
				</kbd>
			</Button>

			<CommandDialog open={open} onOpenChange={setOpen}>
				<CommandInput
					placeholder='Поиск по документации...'
					value={query}
					onValueChange={setQuery}
				/>
				<CommandList>
					{filteredResults.length === 0 && query.trim() && (
						<CommandEmpty>Ничего не найдено.</CommandEmpty>
					)}
					{filteredResults.length > 0 && (
						<CommandGroup heading='Страницы'>
							{filteredResults.map((result, index) => {
								// Выделяем найденное слово в snippet
								const highlightSnippet = (text: string, query: string) => {
									if (!text || !query) return text
									const regex = new RegExp(
										`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
										'gi'
									)
									const parts = text.split(regex)
									return parts.map((part, i) =>
										part.toLowerCase() === query.toLowerCase() ? (
											<mark
												key={i}
												className='bg-primary/20 text-primary font-medium px-0.5 rounded'
											>
												{part}
											</mark>
										) : (
											part
										)
									)
								}

								return (
									<CommandItem
										key={`${result.version}-${result.path}-${index}`}
										value={`${result.title} ${result.path}`}
										onSelect={() => handleSelect(result.path)}
										className='cursor-pointer'
									>
										<div className='flex flex-col gap-1'>
											<span className='font-medium'>{result.title}</span>
											{result.snippet && (
												<span className='text-xs text-muted-foreground line-clamp-2'>
													{highlightSnippet(result.snippet, query)}
												</span>
											)}
											<span className='text-xs text-muted-foreground/70'>
												{result.version} • {result.path}
											</span>
										</div>
									</CommandItem>
								)
							})}
						</CommandGroup>
					)}
					{!query.trim() && (
						<CommandEmpty>Введите запрос для поиска...</CommandEmpty>
					)}
				</CommandList>
			</CommandDialog>
		</>
	)
}
