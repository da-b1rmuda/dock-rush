import matter from 'gray-matter'
import fs from 'node:fs/promises'
import path from 'node:path'
import {
	parseButtonSettings,
	parseDropdownSettings,
	parseGroupSettings,
	parsePageFrontmatter,
} from '../documentation/frontmatter-parser'
import type {
	ButtonSettings,
	DropdownSettings,
	GroupSettings,
	PageFrontmatter,
} from '../documentation/types'
import type { FileInfo } from './types'

const SETTINGS_PATTERNS = {
	dropdown: /^dropdown-settings\.md$/i,
	group: /^group-settings\.md$/i,
}

const BUTTON_PATTERN = /\.button\.md$/

/**
 * Читает метаданные из markdown файла
 */
export async function readFileMetadata(filePath: string) {
	try {
		const content = await fs.readFile(filePath, 'utf-8')

		/* ➜ добавляем дефолт {} если фронт-маттер отсутствует */
		const { data: rawFrontmatter = {}, content: markdownContent } =
			matter(content)

		if (BUTTON_PATTERN.test(path.basename(filePath))) {
			const defaultTitle = path
				.basename(filePath, '.button.md')
				.replace(/[-_]/g, ' ')
			const buttonSettings = parseButtonSettings(rawFrontmatter, defaultTitle)
			return { frontmatter: buttonSettings, content: markdownContent }
		}

		const pageFrontmatter = parsePageFrontmatter(rawFrontmatter)
		return { frontmatter: pageFrontmatter, content: markdownContent }
	} catch (error) {
		return { frontmatter: null, content: '' }
	}
}

/**
 * Читает settings файл для папки (dropdown или group)
 */
export async function readSettingsFile(
	folderPath: string,
	type: 'dropdown' | 'group'
): Promise<DropdownSettings | GroupSettings | null> {
	const settingsFileName =
		type === 'dropdown' ? 'dropdown-settings.md' : 'group-settings.md'
	const settingsPath = path.join(folderPath, settingsFileName)

	try {
		const content = await fs.readFile(settingsPath, 'utf-8')
		const { data } = matter(content)

		if (type === 'dropdown') {
			return parseDropdownSettings(data)
		} else {
			return parseGroupSettings(data)
		}
	} catch (error) {
		// Settings файл не найден - это нормально
		return null
	}
}

/**
 * Находит settings файл в папке
 */
export function findSettingsFile(
	files: FileInfo[],
	folderRelativePath: string
): {
	type: 'dropdown' | 'group' | null
	file: FileInfo | null
} {
	const normalizedFolderPath = folderRelativePath.replace(/\\/g, '/')

	for (const file of files) {
		if (file.type !== 'file') continue

		const fileDir = path.dirname(file.relativePath).replace(/\\/g, '/')
		if (fileDir !== normalizedFolderPath) continue

		if (SETTINGS_PATTERNS.dropdown.test(file.name)) {
			return { type: 'dropdown', file }
		}
		if (SETTINGS_PATTERNS.group.test(file.name)) {
			return { type: 'group', file }
		}
	}

	return { type: null, file: null }
}

/**
 * Читает метаданные для всех файлов в структуре
 */
export async function readAllMetadata(
	files: FileInfo[],
	rootPath: string
): Promise<
	Map<
		string,
		PageFrontmatter | ButtonSettings | DropdownSettings | GroupSettings
	>
> {
	const metadataMap = new Map<
		string,
		PageFrontmatter | ButtonSettings | DropdownSettings | GroupSettings
	>()

	// Читаем метаданные для всех markdown файлов
	for (const file of files) {
		if (file.type !== 'file' || file.extension !== 'md') continue

		const absolutePath = path.isAbsolute(file.path)
			? file.path
			: path.join(rootPath, file.path)

		try {
			const { frontmatter } = await readFileMetadata(absolutePath)

			if (frontmatter) {
				metadataMap.set(file.relativePath, frontmatter)
			}
		} catch (error) {
			// Игнорируем ошибки чтения файлов
		}
	}

	// Читаем settings файлы для папок
	const processedFolders = new Set<string>()
	for (const file of files) {
		if (file.type !== 'directory') continue

		const folderRelativePath = file.relativePath.replace(/\\/g, '/')
		if (processedFolders.has(folderRelativePath)) continue

		const settingsFile = findSettingsFile(files, folderRelativePath)
		if (settingsFile.file) {
			if (settingsFile.type === 'dropdown') {
				const absoluteFolderPath = path.isAbsolute(file.path)
					? file.path
					: path.join(rootPath, file.path)
				const settings = await readSettingsFile(absoluteFolderPath, 'dropdown')
				if (settings) {
					metadataMap.set(folderRelativePath, settings)
				}
			} else if (settingsFile.type === 'group') {
				const absoluteFolderPath = path.isAbsolute(file.path)
					? file.path
					: path.join(rootPath, file.path)
				const settings = await readSettingsFile(absoluteFolderPath, 'group')
				if (settings) {
					metadataMap.set(folderRelativePath, settings)
				}
			}
		}

		processedFolders.add(folderRelativePath)
	}

	return metadataMap
}
