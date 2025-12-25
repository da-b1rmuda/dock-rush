export type DocumentationProps = {
	/** Название разрабатываемого приложения */
	title?: string
	/** Включает переключатель темы */
	useToggleTheme?: boolean
	/** Включает переключатель языка */
	useToggleLanguage?: boolean
	/** Включает поиск по документации */
	useSearch?: boolean
	/** Логотип разрабатываемого приложения */
	logo?: React.ReactNode
	/** Путь к папке для сканирования */
	folderPath?: string
	/** Включает логирование дерева файлов */
	logTreeFiles?: DocumentationConsoleLoggerConfig
	/** Включает выбор версии документации */
	versionSelect?: boolean
}

export type InternalDocumentationProps = {
	versions?: string[]
	documentationStructure?: import('@/lib/documentation').VersionStructure[]
	onPageSelect?: (filePath: string | null) => void
}

export interface DocumentationConsoleLoggerConfig {
	/** Показывать в консоли (true/false) */
	console?: boolean
	/** Формат консольного вывода */
	consoleFormat?: 'tree' | 'list' | 'minimal'
	/** Опции сканирования */
	ignore?: string[]
}
