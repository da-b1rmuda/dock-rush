import { MarkdownViewerLazy as MarkdownViewer } from '@/components/doc-page/markdown-viewer.lazy'
import {
	ErrorsList,
	type DocumentationError,
} from '@/components/errors-list/errors-list'
import { LanguageToggle } from '@/components/language-toggle'
import { Logo } from '@/components/logo'
import { SearchBar } from '@/components/search-bar'
import { AppSidebar } from '@/components/sidebar/sidebar'
import { ThemeToggle } from '@/components/theme-toggle'
import { Separator } from '@/components/ui/separator'
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from '@/components/ui/sidebar'
import { useDocumentationRouter } from '@/hooks/useDocumentationRouter'
import { parseVersionStructure } from '@/lib/documentation/client-parser'
import { getAvailableLanguages } from '@/lib/documentation/helpers'
import type { VersionStructure } from '@/lib/documentation/types'
import { errorBuilder } from '@/lib/errorBuilder/error-builder'
import { ScanResult } from '@/plugin'
import { useEffect, useMemo, useState } from 'react'
import { DocumentationProps } from '../types/DocumentationProps'
export function Documentation({
	title = 'Documentation',
	useToggleTheme = false,
	useToggleLanguage = false,
	useSearch = false,
	logo = <Logo className='h-10 w-10' />,
	folderPath = 'docs',
	logTreeFiles = {},
	versionSelect = false,
}: Readonly<DocumentationProps>) {
	const [scannedFiles, setScannedFiles] = useState<ScanResult>()
	const [receivedErrors, setReceivedErrors] = useState<DocumentationError[]>([])
	const [documentationStructure, setDocumentationStructure] = useState<
		VersionStructure[]
	>([])
	const [selectedVersion, setSelectedVersion] = useState<string | undefined>()

	// Ключи для localStorage
	const versionStorageKey = `dock-rush-version-${folderPath}`
	const languageStorageKey = `dock-rush-language-${folderPath}`

	// Используем хук для синхронизации URL с выбранной страницей
	const [currentPage, setCurrentPage] = useDocumentationRouter(folderPath)

	// Состояние для выбранного языка
	const [selectedLanguage, setSelectedLanguage] = useState<string | null>(
		() => {
			if (typeof window !== 'undefined') {
				const saved = localStorage.getItem(languageStorageKey)
				return saved || null
			}
			return null
		}
	)

	// Получаем выбранную версию из localStorage или используем первую доступную
	useEffect(() => {
		if (scannedFiles?.versions && scannedFiles.versions.length > 0) {
			if (versionStorageKey && typeof window !== 'undefined') {
				const saved = localStorage.getItem(versionStorageKey)
				if (saved && scannedFiles.versions.includes(saved)) {
					setSelectedVersion(saved)
					return
				}
			}
			setSelectedVersion(scannedFiles.versions[0])
		}
	}, [scannedFiles?.versions, versionStorageKey])

	// URL теперь синхронизируется автоматически через useDocumentationRouter

	// Сохраняем selectedLanguage в localStorage при изменении
	useEffect(() => {
		if (typeof window !== 'undefined') {
			if (selectedLanguage) {
				localStorage.setItem(languageStorageKey, selectedLanguage)
			} else {
				localStorage.removeItem(languageStorageKey)
			}
		}
	}, [selectedLanguage, languageStorageKey])

	// Стабилизируем массив ignore, чтобы избежать бесконечных циклов
	const ignoreArray = useMemo(
		() => logTreeFiles.ignore || [],
		[JSON.stringify(logTreeFiles.ignore || [])]
	)

	useEffect(() => {
		// Триггерим нодовый сканер через dev‑сервер (Vite‑плагин в template/vite.config.ts)
		if (!folderPath) return
		const params = new URLSearchParams()
		params.set('folderPath', folderPath)
		params.set('console', String(logTreeFiles.console ?? false))
		if (logTreeFiles.consoleFormat) {
			params.set('consoleFormat', logTreeFiles.consoleFormat)
		}
		logTreeFiles.ignore?.forEach(pattern => {
			params.append('ignore', pattern)
		})

		// Получение отсканированных файлов
		const scanFolder = async () => {
			try {
				const response = await fetch(`/api/dock-rush-scan?${params.toString()}`)
				const files = await response.json()
				setScannedFiles(files)
			} catch (error) {
				// Игнорируем ошибки сканирования
			}
		}
		scanFolder()
	}, [
		folderPath,
		logTreeFiles.console,
		logTreeFiles.consoleFormat,
		ignoreArray,
	])

	// Определяем доступные языки и устанавливаем язык по умолчанию
	useEffect(() => {
		if (scannedFiles?.files && scannedFiles?.versions) {
			// Проверяем, есть ли языки в любой версии
			const allLanguages = new Set<string>()
			scannedFiles.versions.forEach(version => {
				const languages = getAvailableLanguages(version, scannedFiles.files)
				languages.forEach(lang => allLanguages.add(lang))
			})

			// Если есть языки, но язык не выбран, устанавливаем 'ru' по умолчанию
			if (allLanguages.size > 0 && !selectedLanguage) {
				const defaultLang = allLanguages.has('ru')
					? 'ru'
					: Array.from(allLanguages)[0]
				setSelectedLanguage(defaultLang)
				if (typeof window !== 'undefined') {
					localStorage.setItem(languageStorageKey, defaultLang)
				}
			}
		}
	}, [scannedFiles, selectedLanguage, languageStorageKey])

	// Сканирование на ошибки структуры и парсинг структуры документации
	useEffect(() => {
		if (scannedFiles?.files && scannedFiles?.versions) {
			setReceivedErrors(errorBuilder(scannedFiles.files))

			// Парсим структуру для каждой версии
			const structures: VersionStructure[] = scannedFiles.versions.map(
				version => {
					const languages = getAvailableLanguages(version, scannedFiles.files)
					return {
						version,
						entities: parseVersionStructure(
							version,
							scannedFiles.files,
							selectedLanguage,
							scannedFiles.metadata
						),
						languages: languages.length > 0 ? languages : undefined,
					}
				}
			)
			setDocumentationStructure(structures)

			// Проверяем, существует ли текущая страница из URL в структуре
			if (currentPage) {
				// Нормализуем путь для сравнения (заменяем обратные слэши на прямые)
				const normalizedCurrentPage = currentPage.replace(/\\/g, '/')

				const allFiles = scannedFiles.files.filter(file => {
					const normalizedRelative = file.relativePath?.replace(/\\/g, '/')
					const normalizedOriginal = file.originalRelativePath?.replace(
						/\\/g,
						'/'
					)
					const normalizedPath = file.path?.replace(/\\/g, '/')

					return (
						normalizedRelative === normalizedCurrentPage ||
						normalizedOriginal === normalizedCurrentPage ||
						normalizedPath === normalizedCurrentPage
					)
				})

				if (allFiles.length === 0) {
					// Страница не найдена, очищаем URL
					setCurrentPage(null)
				}
			}
		}
	}, [scannedFiles, currentPage, selectedLanguage, setCurrentPage])

	if (receivedErrors.length > 0) {
		return (
			<div className='flex flex-1 flex-col gap-4 p-6'>
				<ErrorsList errors={receivedErrors} />
			</div>
		)
	}

	return (
		<SidebarProvider className='h-screen overflow-hidden'>
			<AppSidebar
				title={title}
				logo={logo}
				versionSelect={versionSelect}
				versions={scannedFiles?.versions || []}
				documentationStructure={documentationStructure}
				onPageSelect={setCurrentPage}
				versionStorageKey={versionStorageKey}
			/>
			<SidebarInset>
				<header className='flex h-16 shrink-0 items-center justify-between gap-2 border-b px-3'>
					<div className='flex items-center gap-2'>
						<SidebarTrigger />
						<Separator orientation='vertical' className='mr-2 h-4' />
					</div>
					<div className='flex items-center gap-2'>
						{useSearch && documentationStructure.length > 0 && (
							<SearchBar
								documentationStructure={documentationStructure}
								selectedVersion={selectedVersion}
								selectedLanguage={selectedLanguage}
								onPageSelect={setCurrentPage}
								scannedFiles={scannedFiles}
							/>
						)}
						{useToggleLanguage && documentationStructure.length > 0 && (
							<LanguageToggle
								languages={documentationStructure
									.flatMap(s => s.languages || [])
									.filter((lang, index, arr) => arr.indexOf(lang) === index)}
								selectedLanguage={selectedLanguage}
								onLanguageChange={lang => {
									setSelectedLanguage(lang)
									// При смене языка очищаем выбранную страницу и URL
									setCurrentPage(null)
								}}
							/>
						)}
						{useToggleTheme && <ThemeToggle />}
					</div>
				</header>
				<main className='overflow-auto'>
					{currentPage ? (
						<div className='animate-in fade-in-0 duration-300'>
							<MarkdownViewer
								filePath={currentPage}
								folderPath={folderPath}
								onPageSelect={setCurrentPage}
							/>
						</div>
					) : (
						<div className='flex flex-1 items-center justify-center p-12 animate-in fade-in-0 duration-300'>
							<div className='text-center'>
								<Logo className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
								<h2 className='mb-2 text-2xl font-semibold'>
									Добро пожаловать
								</h2>
								<p className='text-muted-foreground'>
									Выберите страницу документации из бокового меню
								</p>
							</div>
						</div>
					)}
				</main>
			</SidebarInset>
		</SidebarProvider>
	)
}
