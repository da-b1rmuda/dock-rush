import fg from 'fast-glob'
import * as path from 'node:path'
import { FileInfo, ScanOptions, ScanResult } from './types'

/**
 * Extracts version numbers from directory names that match semantic version patterns
 */
function extractVersions(files: FileInfo[]): string[] {
	const versionPattern = /^\d+\.\d+\.\d+$/
	const versions = new Set<string>()

	for (const file of files) {
		if (file.type === 'directory' && versionPattern.test(file.name)) {
			versions.add(file.name)
		}
	}

	return Array.from(versions).sort((a, b) => {
		const aParts = a.split('.').map(Number)
		const bParts = b.split('.').map(Number)

		for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
			const aPart = aParts[i] ?? 0
			const bPart = bParts[i] ?? 0
			if (aPart !== bPart) {
				return bPart - aPart // Sort descending (newest first)
			}
		}
		return 0
	})
}

export class FolderScanner {
	async scan(
		folderPath: string,
		options: ScanOptions = {}
	): Promise<ScanResult> {
		try {
			const entries = await fg('**/*', {
				cwd: folderPath,
				onlyFiles: false,
				stats: true,
				absolute: true,
				deep: options.deep ?? Infinity,
				ignore: options.ignore,
				dot: true,
			})

			const files = entries.map(entry => {
				const relativePath = path.relative(folderPath, entry.path)
				const isDirectory =
					'isDirectory' in entry.stats ? entry.stats.isDirectory() : false

				return {
					name: path.basename(entry.path),
					path: entry.path,
					relativePath,
					type: isDirectory ? 'directory' : 'file',
					size: entry.stats?.size,
					extension:
						isDirectory === false
							? path.extname(entry.path).toLowerCase().slice(1)
							: undefined,
					depth: relativePath.split(path.sep).length - 1,
				}
			}) as FileInfo[]

			const versions = extractVersions(files)

			return { success: true, files, versions: versions }
		} catch (error) {
			return {
				success: false,
				files: [],
				versions: [],
				error: error instanceof Error ? error.message : 'Unknown error',
			}
		}
	}
}
