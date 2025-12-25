export interface ScanOptions {
	pattern?: string | string[]
	ignore?: string[]
	deep?: number
	onlyFiles?: boolean
	onlyDirectories?: boolean
	stats?: boolean
}

export interface FileInfo {
	name: string
	path: string
	relativePath: string
	type: 'file' | 'directory'
	size?: number
	extension?: string
	depth: number
	originalRelativePath?: string // Оригинальный путь для загрузки файлов (используется при фильтрации по языку)
	content?: string // Содержимое файла для поиска (первые 10000 символов)
}

export interface FileMetadata {
	[key: string]:
		| import('../documentation/types').PageFrontmatter
		| import('../documentation/types').ButtonSettings
		| import('../documentation/types').DropdownSettings
		| import('../documentation/types').GroupSettings
}

export interface ScanResult {
	success: boolean
	files: FileInfo[]
	error?: string
	versions: string[]
	metadata?: FileMetadata
}

export type ConsoleFormat = 'tree' | 'list' | 'minimal'
