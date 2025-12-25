import { FileInfo } from '@/plugin'

/**
 * Определяет доступные языки для версии
 */
const LANGUAGE_PATTERN = /^[a-z]{2}$/
export function getAvailableLanguages(
	version: string,
	files: FileInfo[]
): string[] {
	const versionFiles = files.filter(file => {
		const pathParts = file.relativePath.split(/[\\/]/)
		return pathParts[0] === version
	})

	// Ищем папки с языками на уровне версии (depth = 1)
	const languageDirs = versionFiles.filter(
		f =>
			f.depth === 1 && f.type === 'directory' && LANGUAGE_PATTERN.test(f.name)
	)

	if (languageDirs.length === 0) {
		return []
	}

	return languageDirs.map(dir => dir.name).sort()
}
