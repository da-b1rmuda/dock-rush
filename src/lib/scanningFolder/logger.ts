import { ConsoleFormat, FileInfo } from './types'

export class ConsoleLogger {
	static log(
		files: FileInfo[],
		folderPath: string,
		format: ConsoleFormat = 'tree'
	) {
		console.log(`\n📁 ${folderPath}\n`)

		switch (format) {
			case 'tree':
				this.logTree(files)
				break
			case 'list':
				this.logList(files)
				break
			case 'minimal':
				this.logMinimal(files)
				break
		}
	}

	private static logTree(files: FileInfo[]) {
		files
			.sort((a, b) => {
				if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
				return a.name.localeCompare(b.name)
			})
			.forEach(file => {
				const indent = '  '.repeat(file.depth)
				const icon = file.type === 'directory' ? '📁' : '📄'
				console.log(`${indent}${icon} ${file.name}`)
			})
	}

	private static logList(files: FileInfo[]) {
		files.forEach((file, i) => {
			const icon = file.type === 'directory' ? '📁' : '📄'
			console.log(`${i + 1}. ${icon} ${file.relativePath}`)
		})
	}

	private static logMinimal(files: FileInfo[]) {
		const dirs = files.filter(f => f.type === 'directory').length
		const fileCount = files.length - dirs
		console.log(`📁 ${dirs} directories, 📄 ${fileCount} files`)
	}
}
