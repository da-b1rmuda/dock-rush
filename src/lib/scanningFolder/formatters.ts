export class Formatter {
	static formatBytes(bytes: number): string {
		if (bytes === 0) return '0 Bytes'

		const k = 1024
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))

		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
	}

	static formatDate(date: Date): string {
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		})
	}

	static formatDuration(ms: number): string {
		if (ms < 1000) return `${ms}ms`
		if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
		return `${(ms / 60000).toFixed(2)}m`
	}

	static formatPercentage(part: number, total: number): string {
		if (total === 0) return '0%'
		return `${((part / total) * 100).toFixed(1)}%`
	}
}
