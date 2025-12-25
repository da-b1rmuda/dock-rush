import * as path from 'path'

export class PathUtils {
	static normalizePath(filePath: string): string {
		return path.normalize(filePath)
	}

	static isInsideProject(filePath: string, projectRoot: string): boolean {
		const normalizedPath = this.normalizePath(filePath)
		const normalizedRoot = this.normalizePath(projectRoot)
		return normalizedPath.startsWith(normalizedRoot)
	}

	static getFolderName(filePath: string): string {
		return path.basename(filePath)
	}

	static getRelativePath(from: string, to: string): string {
		return path.relative(from, to)
	}

	static getFileExtension(filePath: string): string {
		const ext = path.extname(filePath).toLowerCase()
		return ext ? ext.slice(1) : ''
	}
}

export class ValidationUtils {
	static isValidPath(filePath: string): boolean {
		if (!filePath || typeof filePath !== 'string') {
			return false
		}

		// Защита от directory traversal
		const dangerousPatterns = [/\.\.\//, /\/\//, /[<>:"|?*]/, /^\s*$/]

		return !dangerousPatterns.some(pattern => pattern.test(filePath))
	}

	static validateOptions(options: any): { valid: boolean; error?: string } {
		if (
			options.deep &&
			(typeof options.deep !== 'number' || options.deep < 0)
		) {
			return { valid: false, error: 'deep must be a positive number' }
		}

		if (options.pattern) {
			if (
				typeof options.pattern !== 'string' &&
				!Array.isArray(options.pattern)
			) {
				return {
					valid: false,
					error: 'pattern must be string or array of strings',
				}
			}
		}

		return { valid: true }
	}
}
