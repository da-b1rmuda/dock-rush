import { FileInfo } from '../scanningFolder'

/**
 * Базовые метаданные, общие для всех сущностей
 */
export interface BaseMeta {
	title?: string
	order?: number
	icon?: string
	hidden?: boolean
	searchable?: boolean
}

/**
 * Метаданные страницы (Page)
 */
export interface PageFrontmatter extends BaseMeta {
	lang?: string
	tags?: string[]
	layout?: string
}

/**
 * Метаданные Dropdown (папка)
 */
export interface DropdownSettings extends BaseMeta {
	dropdown?: 'open' | 'collapsed' | 'always-open'
}

/**
 * Метаданные Group (group-*)
 */
export interface GroupSettings extends BaseMeta {
	description?: string
}

/**
 * Метаданные кнопки (Button)
 */
export interface ButtonSettings extends BaseMeta {
	type: 'button'
	variant: 'link' | 'page'
	title: string
	url?: string
	style?: 'primary' | 'secondary' | 'ghost'
	target?: '_blank' | '_self'
	position?: 'sidebar' | 'header'
}

/**
 * Метаданные версии
 */
export interface VersionSettings extends BaseMeta {
	default?: boolean
	deprecated?: boolean
}

/**
 * Метаданные языка
 */
export interface LanguageSettings {
	label?: string
	order?: number
}

export type DocumentationEntity =
	| {
			type: 'page'
			file: FileInfo
			frontmatter?: PageFrontmatter
	  }
	| {
			type: 'dropdown'
			folder: FileInfo
			pages: DocumentationEntity[]
			settings?: DropdownSettings
	  }
	| {
			type: 'group'
			folder: FileInfo
			pages: DocumentationEntity[]
			settings?: GroupSettings
	  }
	| {
			type: 'button'
			file: FileInfo
			settings: ButtonSettings
	  }

export interface VersionStructure {
	version: string
	entities: DocumentationEntity[]
	languages?: string[]
}
