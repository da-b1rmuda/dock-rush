import * as path from 'node:path'
import { FileInfo } from '../scanningFolder'
import { BUTTON_PATTERN, getEntityType } from './helpers'
import type { DocumentationEntity } from './types'

/**
 * Парсит структуру документации для версии
 */
export function parseVersionStructure(
	version: string,
	files: FileInfo[]
): DocumentationEntity[] {
	// Фильтруем файлы для этой версии
	const versionFiles = files.filter(file => {
		const pathParts = file.relativePath.split(/[\\/]/)
		return pathParts[0] === version
	})

	// Группируем по глубине
	const entities: DocumentationEntity[] = []
	const processedPaths = new Set<string>()

	// Сначала обрабатываем файлы на уровне версии (depth = 1)
	const rootLevelFiles = versionFiles.filter(
		f => f.depth === 1 && f.type === 'file'
	)

	for (const file of rootLevelFiles) {
		if (processedPaths.has(file.relativePath)) continue

		const entityType = getEntityType(file, versionFiles)
		if (entityType === 'page') {
			entities.push({
				type: 'page',
				file,
			})
			processedPaths.add(file.relativePath)
		} else if (entityType === 'button') {
			// Для button нужно будет парсить frontmatter
			entities.push({
				type: 'button',
				file,
				settings: {
					type: 'button',
					variant: 'page', // По умолчанию
					title: path.basename(file.name, '.button.md'),
				},
			})
			processedPaths.add(file.relativePath)
		}
	}

	// Затем обрабатываем папки на уровне версии (depth = 1)
	const rootLevelDirs = versionFiles.filter(
		f => f.depth === 1 && f.type === 'directory'
	)

	for (const dir of rootLevelDirs) {
		if (processedPaths.has(dir.relativePath)) continue

		const entityType = getEntityType(dir, versionFiles)
		if (entityType === 'group') {
			const groupFiles = versionFiles.filter(
				f =>
					f.relativePath.startsWith(dir.relativePath + path.sep) &&
					f.type === 'file'
			)
			const groupPages = groupFiles
				.filter(f => f.extension === 'md' && !BUTTON_PATTERN.test(f.name))
				.map(f => ({
					type: 'page' as const,
					file: f,
				}))

			entities.push({
				type: 'group',
				folder: dir,
				pages: groupPages,
			})
			processedPaths.add(dir.relativePath)
		} else if (entityType === 'dropdown') {
			const dropdownFiles = versionFiles.filter(
				f =>
					f.relativePath.startsWith(dir.relativePath + path.sep) &&
					f.type === 'file'
			)
			const dropdownPages = dropdownFiles
				.filter(f => f.extension === 'md' && !BUTTON_PATTERN.test(f.name))
				.map(f => ({
					type: 'page' as const,
					file: f,
				}))

			entities.push({
				type: 'dropdown',
				folder: dir,
				pages: dropdownPages,
			})
			processedPaths.add(dir.relativePath)
		}
	}

	// Сортируем по order, если есть
	return entities.sort((a, b) => {
		const aOrder = getOrder(a)
		const bOrder = getOrder(b)
		if (aOrder !== undefined && bOrder !== undefined) {
			return aOrder - bOrder
		}
		if (aOrder !== undefined) return -1
		if (bOrder !== undefined) return 1
		return 0
	})
}

function getOrder(entity: DocumentationEntity): number | undefined {
	if (entity.type === 'page') {
		return entity.frontmatter?.order
	}
	if (entity.type === 'dropdown') {
		return entity.settings?.order
	}
	if (entity.type === 'group') {
		return entity.settings?.order
	}
	if (entity.type === 'button') {
		return entity.settings.order
	}
	return undefined
}
