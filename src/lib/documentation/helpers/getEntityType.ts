import { FileInfo } from '@/plugin'

/**
 * Определяет тип сущности по имени файла/папки (клиентская версия)
 */
const GROUP_PATTERN = /^\(group-.*\)$/
const BUTTON_PATTERN = /\.button\.md$/

export function getEntityType(
	item: FileInfo,
	allFiles: FileInfo[]
): 'page' | 'dropdown' | 'group' | 'button' | null {
	if (item.type === 'file') {
		if (BUTTON_PATTERN.test(item.name)) {
			return 'button'
		}
		if (item.extension === 'md') {
			return 'page'
		}
		return null
	}

	if (item.type === 'directory') {
		if (GROUP_PATTERN.test(item.name)) {
			return 'group'
		}
		// Проверяем, есть ли внутри файлы
		const hasFiles = allFiles.some(
			f =>
				f.relativePath.startsWith(item.relativePath + '/') ||
				(f.relativePath.startsWith(item.relativePath + '\\') &&
					f.type === 'file')
		)
		if (hasFiles) {
			return 'dropdown'
		}
	}

	return null
}
