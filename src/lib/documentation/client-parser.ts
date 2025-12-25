import type { FileInfo } from '../scanningFolder'
import { inheritMeta } from './frontmatter-parser'
import { BUTTON_PATTERN, LANGUAGE_PATTERN } from './helpers'
import { getEntityType } from './helpers/getEntityType'
import { getSortEntities } from './helpers/getSortEntities'
import { isHidden } from './helpers/types-helper'
import {
	type ButtonSettings,
	type DocumentationEntity,
	type DropdownSettings,
	type GroupSettings,
	type PageFrontmatter,
} from './types'

/**
 * Парсит структуру документации для версии и языка (клиентская версия)
 */

type FileExtended = FileInfo & { originalRelativePath?: string }
export function parseVersionStructure(
	version: string,
	files: FileInfo[],
	language?: string | null,
	metadata?: Record<
		string,
		PageFrontmatter | ButtonSettings | DropdownSettings | GroupSettings
	>
): DocumentationEntity[] {
	/* 1.  отфильтровать и «схлопнуть» языковые папки */
	const versionFiles = prepareFilesForVersion(files, version, language)

	/* 2.  собрать сущности */
	const entities = buildEntities(versionFiles, metadata || {})

	/* 3.  отсортировать один раз */
	return getSortEntities(entities)
}

/* ================================================================== */
/*  1. подготовка файлов (фильтр по версии + язык)                   */
/* ================================================================== */
function prepareFilesForVersion(
	files: FileInfo[],
	version: string,
	language: string | null | undefined
): FileExtended[] {
	/* оставляем только файлы нужной версии */
	let list = files.filter(f => f.relativePath.split(/[/\\]/)[0] === version)

	const hasLangFolders = list.some(
		f =>
			f.depth === 1 && f.type === 'directory' && LANGUAGE_PATTERN.test(f.name)
	)

	/* если языковых папок нет – просто дополняем поле */
	if (!hasLangFolders) {
		return list.map(f => ({ ...f, originalRelativePath: f.relativePath }))
	}

	/* язык задан – берём только его; не задан – выбрасываем языковые папки */
	const wantedLang = language || null
	list = list.filter(f => {
		const p = f.relativePath.split(/[/\\]/)
		if (p.length < 2) return true /* корень версии */
		const second = p[1]
		if (!LANGUAGE_PATTERN.test(second)) return true /* не языковая папка */
		return wantedLang ? second === wantedLang : false
	})

	/* корректируем depth / path для файлов внутри языковых папок */
	return list.map(f => {
		const p = f.relativePath.split(/[/\\]/)
		if (p.length >= 2 && LANGUAGE_PATTERN.test(p[1])) {
			return {
				...f,
				depth: f.depth - 1,
				relativePath: p.slice(2).join('/'),
				originalRelativePath: f.relativePath,
			}
		}
		return { ...f, originalRelativePath: f.relativePath }
	})
}

/* ================================================================== */
/*  2. сбор сущностей                                                */
/* ================================================================== */

function buildEntities(
	files: FileExtended[],
	metadata: Record<string, any>
): DocumentationEntity[] {
	const entities: DocumentationEntity[] = []

	/* корневые файлы */
	files
		.filter(f => f.depth === 1 && f.type === 'file')
		.forEach(file => {
			const type = getEntityType(file, files)
			const meta =
				metadata[file.relativePath] || metadata[file.originalRelativePath!]
			if (type === 'page') {
				const p = makePage(file, meta)
				if (!isHidden(p)) entities.push(p)
			} else if (type === 'button') {
				const b = makeButton(file, meta)
				if (!isHidden(b)) entities.push(b)
			}
		})

	/* корневые папки (без языковых) */
	const processedDirs = new Set<string>()
	files
		.filter(
			f =>
				f.depth === 1 &&
				f.type === 'directory' &&
				!LANGUAGE_PATTERN.test(f.name)
		)
		.forEach(dir => {
			if (processedDirs.has(dir.relativePath)) return
			processedDirs.add(dir.relativePath)

			const type = getEntityType(dir, files)
			const dirPath = dir.relativePath.replace(/\\/g, '/')
			const originalDirPath =
				dir.originalRelativePath?.replace(/\\/g, '/') || dirPath
			const meta = metadata[originalDirPath]

			if (type === 'group') {
				const g = makeGroup(dir, files, meta, metadata)
				if (!isHidden(g)) entities.push(g)
			} else if (type === 'dropdown') {
				const d = makeDropdown(dir, files, meta, metadata)
				if (!isHidden(d)) entities.push(d)
			}
		})

	return entities
}

/* ================================================================== */
/*  3. фабрики сущностей                                             */
/* ================================================================== */
function makePage(
	file: FileExtended,
	meta?: PageFrontmatter
): DocumentationEntity {
	const frontmatter: PageFrontmatter = {
		order: 100,
		hidden: false,
		searchable: true,
		...meta,
		title: meta?.title || file.name.replace(/\.md$/i, ''),
	}
	return { type: 'page', file, frontmatter }
}

function makeButton(
	file: FileExtended,
	meta?: ButtonSettings
): Extract<DocumentationEntity, { type: 'button' }> {
	const settings: ButtonSettings = {
		type: 'button',
		variant: meta?.variant || 'page',
		order: meta?.order ?? 100,
		hidden: meta?.hidden ?? false,
		searchable: meta?.searchable ?? false,
		position: meta?.position || 'sidebar',
		title: meta?.title || file.name.replace(BUTTON_PATTERN, ''),
		url: meta?.url,
		target: meta?.target,
		style: meta?.style,
		icon: meta?.icon,
	}
	return { type: 'button', file, settings } as const
}

function makeGroup(
	dir: FileExtended,
	files: FileExtended[],
	dirMeta?: GroupSettings,
	allMeta: Record<string, any> = {}
): DocumentationEntity {
	const settings: GroupSettings = {
		order: 100,
		hidden: false,
		searchable: true,
		...dirMeta,
		title:
			dirMeta?.title || dir.name.replace(/^\(group-/, '').replace(/\)$/, ''),
	}

	const pages = collectPagesUnder(dir, files, settings, allMeta)
	return { type: 'group', folder: dir, pages, settings }
}

function makeDropdown(
	dir: FileExtended,
	files: FileExtended[],
	dirMeta?: DropdownSettings,
	allMeta: Record<string, any> = {}
): DocumentationEntity {
	const settings: DropdownSettings = {
		order: 100,
		hidden: false,
		searchable: true,
		dropdown: 'collapsed',
		...dirMeta,
		title: dirMeta?.title || dir.name,
	}

	const pages = collectPagesUnder(dir, files, settings, allMeta)
	return { type: 'dropdown', folder: dir, pages, settings }
}

/* ---------- вспомогательный сбор страниц внутри папки ------------- */
function collectPagesUnder(
	dir: FileExtended,
	files: FileExtended[],
	dirSettings: GroupSettings | DropdownSettings,
	allMeta: Record<string, any>
): DocumentationEntity[] {
	return files
		.filter(
			f =>
				f.type === 'file' &&
				f.extension === 'md' &&
				!BUTTON_PATTERN.test(f.name) &&
				(f.relativePath.startsWith(dir.relativePath + '/') ||
					f.relativePath.startsWith(dir.relativePath + '\\'))
		)
		.map(file => {
			const metaKey = file.originalRelativePath || file.relativePath
			const pageMeta = allMeta[metaKey] as PageFrontmatter | undefined

			// Наследуем только нужные поля, не трогаем title
			const inherited = inheritMeta(pageMeta || {}, {
				order: dirSettings.order,
				hidden: dirSettings.hidden,
				searchable: dirSettings.searchable,
			}) as PageFrontmatter

			const frontmatter: PageFrontmatter = {
				...inherited,
				title: pageMeta?.title || file.name.replace(/\.md$/i, ''),
			}

			return { type: 'page' as const, file, frontmatter }
		})
		.filter(p => !isHidden(p))
}
