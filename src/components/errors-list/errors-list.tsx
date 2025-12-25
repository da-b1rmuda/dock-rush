import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
	AlertCircle,
	CheckCircle2,
	Copy,
	FileWarning,
	FileX,
	FolderTree,
	FolderX,
} from 'lucide-react'
import * as React from 'react'

export interface DocumentationError {
	type:
		| 'ROOT_FILE_ERROR'
		| 'VERSION_FORMAT_ERROR'
		| 'ORPHAN_FILE_ERROR'
		| 'FILE_IN_WRONG_FOLDER'
		| 'NESTED_VERSION_ERROR'
		| 'NESTED_DIRECTORY_ERROR'
		| 'DUPLICATE_FILE_ERROR'
		| 'INVALID_ROOT_MD_FILE'
		| 'NESTED_DIRECTORY_IN_GROUP'
		| 'NESTED_DIRECTORY_IN_DROPDOWN'
		| 'BUTTON_FILE_IN_WRONG_PLACE'
	file?: string
	folder?: string
	files?: string[]
	path: string
	paths?: string[]
	reason: string
	fix: string
	parentVersion?: string
	nestedVersion?: string
}

interface ErrorCardProps {
	readonly error: DocumentationError
	readonly index: number
}

function getErrorIcon(type: DocumentationError['type']) {
	switch (type) {
		case 'ROOT_FILE_ERROR':
		case 'ORPHAN_FILE_ERROR':
			return FileX
		case 'VERSION_FORMAT_ERROR':
			return FolderX
		case 'FILE_IN_WRONG_FOLDER':
			return FileWarning
		case 'NESTED_VERSION_ERROR':
		case 'NESTED_DIRECTORY_ERROR':
			return FolderTree
		case 'DUPLICATE_FILE_ERROR':
			return Copy
		default:
			return AlertCircle
	}
}

function getErrorTypeLabel(type: DocumentationError['type']): string {
	switch (type) {
		case 'ROOT_FILE_ERROR':
			return 'Файл в корне'
		case 'VERSION_FORMAT_ERROR':
			return 'Неверный формат версии'
		case 'ORPHAN_FILE_ERROR':
			return 'Файл без версии'
		case 'FILE_IN_WRONG_FOLDER':
			return 'Файл в неправильной папке'
		case 'NESTED_VERSION_ERROR':
			return 'Вложенная версия'
		case 'NESTED_DIRECTORY_ERROR':
			return 'Вложенная директория'
		case 'DUPLICATE_FILE_ERROR':
			return 'Дубликат файла'
		case 'INVALID_ROOT_MD_FILE':
			return 'Неверный .md файл в корне версии'
		case 'NESTED_DIRECTORY_IN_GROUP':
			return 'Вложенная папка в группе'
		case 'NESTED_DIRECTORY_IN_DROPDOWN':
			return 'Вложенная папка в dropdown'
		case 'BUTTON_FILE_IN_WRONG_PLACE':
			return 'Кнопка в неправильном месте'
		default:
			return 'Ошибка'
	}
}

function ErrorCard({ error, index }: ErrorCardProps) {
	const Icon = getErrorIcon(error.type)
	const [copied, setCopied] = React.useState(false)

	const handleCopyPath = () => {
		const pathToCopy = error.path || error.paths?.join(', ') || ''
		navigator.clipboard.writeText(pathToCopy)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	return (
		<div
			className={cn(
				'group relative rounded-lg border border-destructive/20 bg-destructive/5 p-4 transition-all hover:border-destructive/40 hover:bg-destructive/10',
				'flex flex-col gap-3'
			)}
		>
			<div className='flex items-start gap-3'>
				<div className='mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive'>
					<Icon className='h-4 w-4' />
				</div>
				<div className='flex-1 space-y-1'>
					<div className='flex items-center justify-between gap-2'>
						<div className='flex items-center gap-2'>
							<span className='text-xs font-semibold text-muted-foreground'>
								#{index + 1}
							</span>
							<span className='text-sm font-semibold text-destructive'>
								{getErrorTypeLabel(error.type)}
							</span>
						</div>
						<Button
							variant='ghost'
							size='sm'
							className='h-7 w-7 p-0'
							onClick={handleCopyPath}
							title='Копировать путь'
						>
							{copied ? (
								<CheckCircle2 className='h-3.5 w-3.5 text-green-600' />
							) : (
								<Copy className='h-3.5 w-3.5' />
							)}
						</Button>
					</div>
					<div className='space-y-2'>
						{(error.file || error.folder || error.files) && (
							<div className='flex flex-wrap items-center gap-2'>
								<span className='text-xs text-muted-foreground'>
									{error.file && `Файл:`}
									{error.folder && `Папка:`}
									{error.files && `Файлы:`}
								</span>
								{error.file && (
									<code className='rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground'>
										{error.file}
									</code>
								)}
								{error.folder && (
									<code className='rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground'>
										{error.folder}
									</code>
								)}
								{error.files && (
									<div className='flex flex-wrap gap-1'>
										{error.files.map(file => (
											<code
												key={file}
												className='rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground'
											>
												{file}
											</code>
										))}
									</div>
								)}
							</div>
						)}
						<div className='flex items-start gap-2'>
							<span className='text-xs text-muted-foreground'>Путь:</span>
							<code className='break-all rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground'>
								{error.path || error.paths?.join(', ')}
							</code>
						</div>
					</div>
				</div>
			</div>

			<div className='ml-11 space-y-2 border-t border-destructive/10 pt-3'>
				<div>
					<span className='text-xs font-medium text-muted-foreground'>
						Причина:
					</span>
					<p className='mt-1 text-sm text-foreground'>{error.reason}</p>
				</div>
				<div>
					<span className='text-xs font-medium text-green-700 dark:text-green-400'>
						Решение:
					</span>
					<p className='mt-1 text-sm text-green-800 dark:text-green-300'>
						{error.fix}
					</p>
				</div>
			</div>
		</div>
	)
}

interface ErrorsListProps {
	readonly errors: DocumentationError[]
}

export function ErrorsList({ errors }: ErrorsListProps) {
	if (!errors || errors.length === 0) {
		return (
			<div className='flex flex-col items-center justify-center rounded-lg border border-green-200 bg-green-50/50 p-12 dark:border-green-900 dark:bg-green-950/20'>
				<CheckCircle2 className='mb-4 h-12 w-12 text-green-600 dark:text-green-400' />
				<h3 className='mb-2 text-lg font-semibold text-green-900 dark:text-green-100'>
					Ошибок не найдено
				</h3>
				<p className='text-center text-sm text-green-700 dark:text-green-300'>
					Структура документации соответствует всем требованиям
				</p>
			</div>
		)
	}

	return (
		<div className='space-y-4'>
			<div className='flex items-center justify-between'>
				<div>
					<h2 className='text-2xl font-bold tracking-tight'>
						Ошибки структуры документации
					</h2>
					<p className='mt-1 text-sm text-muted-foreground'>
						Найдено {errors.length} {errors.length === 1 ? 'ошибка' : 'ошибок'}{' '}
						в структуре документации
					</p>
				</div>
				<div className='flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive'>
					<AlertCircle className='h-5 w-5' />
				</div>
			</div>

			<div className='space-y-3'>
				{errors.map((error, index) => (
					<ErrorCard
						key={`${error.type}-${error.path}-${index}`}
						error={error}
						index={index}
					/>
				))}
			</div>
		</div>
	)
}
