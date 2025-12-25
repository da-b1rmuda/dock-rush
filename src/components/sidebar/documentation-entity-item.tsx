import {
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import { resolveIcon } from '@/lib/documentation/icon-resolver'
import type { DocumentationEntity } from '@/lib/documentation/types'
import { FolderOpen } from 'lucide-react'
import * as React from 'react'

function getEntityKey(entity: DocumentationEntity): string {
	if (entity.type === 'page' || entity.type === 'button') {
		return entity.file.originalRelativePath || entity.file.relativePath
	}
	return entity.folder.originalRelativePath || entity.folder.relativePath
}

function getEntityTitle(entity: DocumentationEntity): string {
	if (entity.type === 'page') {
		return entity.frontmatter?.title || entity.file.name.replaceAll('.md', '')
	}
	if (entity.type === 'button') {
		return entity.settings.title
	}
	if (entity.type === 'dropdown') {
		return entity.settings?.title || entity.folder.name
	}
	if (entity.type === 'group') {
		return (
			entity.settings?.title ||
			entity.folder.name.replace(/^\(group-/, '').replace(/\)$/, '')
		)
	}
	return ''
}

function getEntityIcon(
	entity: DocumentationEntity
): React.ComponentType<{ className?: string }> | null {
	if (entity.type === 'page') {
		return resolveIcon(entity.frontmatter?.icon) || null
	}
	if (entity.type === 'button') {
		return resolveIcon(entity.settings.icon)
	}
	if (entity.type === 'dropdown') {
		return resolveIcon(entity.settings?.icon) || null
	}
	if (entity.type === 'group') {
		return resolveIcon(entity.settings?.icon) || null
	}
	return null
}

interface DocumentationEntityItemProps {
	readonly entity: DocumentationEntity
	readonly openDropdowns: Set<string>
	readonly onToggleDropdown: (path: string) => void
	readonly onPageSelect?: (filePath: string | null) => void
}

export function DocumentationEntityItem({
	entity,
	openDropdowns,
	onToggleDropdown,
	onPageSelect,
}: DocumentationEntityItemProps) {
	const entityKey = getEntityKey(entity)
	const isOpen = openDropdowns.has(entityKey)
	const Icon = getEntityIcon(entity)

	if (entity.type === 'page') {
		const title = getEntityTitle(entity)
		const filePath =
			entity.file.originalRelativePath || entity.file.relativePath

		return (
			<SidebarMenuItem>
				<SidebarMenuButton onClick={() => onPageSelect?.(filePath)} asChild>
					<button type='button'>
						{Icon && <Icon className='size-4' />}
						<span>{title}</span>
					</button>
				</SidebarMenuButton>
			</SidebarMenuItem>
		)
	}

	if (entity.type === 'button') {
		const title = getEntityTitle(entity)
		// Если есть URL в метаданных, это ссылка (независимо от variant)
		const url = entity.settings.url

		if (url) {
			const target = entity.settings.target || '_self'

			// Останавливаем всплытие события, чтобы не вызывать onPageSelect
			const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
				e.stopPropagation()
				// Для внешних ссылок открываем в новой вкладке
				if (target === '_blank') {
					e.preventDefault()
					window.open(url, '_blank', 'noopener,noreferrer')
				}
				// Для внутренних ссылок позволяем браузеру обработать переход естественным образом
			}

			return (
				<SidebarMenuItem>
					<SidebarMenuButton asChild>
						<a
							href={url}
							target={target}
							rel={target === '_blank' ? 'noopener noreferrer' : undefined}
							onClick={handleClick}
							className='w-full' // Убеждаемся, что ссылка занимает всю ширину как кнопка
						>
							{Icon && <Icon className='size-4' />}
							<span>{title}</span>
						</a>
					</SidebarMenuButton>
				</SidebarMenuItem>
			)
		}

		// Если URL нет, это кнопка, открывающая markdown файл (variant === 'page')
		const filePath =
			entity.file.originalRelativePath || entity.file.relativePath

		const handlePageClick = () => {
			onPageSelect?.(filePath)
		}

		return (
			<SidebarMenuItem>
				<SidebarMenuButton onClick={handlePageClick} asChild>
					<button type='button'>
						{Icon && <Icon className='size-4' />}
						<span>{title}</span>
					</button>
				</SidebarMenuButton>
			</SidebarMenuItem>
		)
	}

	if (entity.type === 'dropdown') {
		const title = getEntityTitle(entity)
		const dropdownState = entity.settings?.dropdown || 'collapsed'
		const shouldBeOpen =
			dropdownState === 'open' ||
			dropdownState === 'always-open' ||
			(dropdownState === 'collapsed' && isOpen)
		const isAlwaysOpen = dropdownState === 'always-open'

		return (
			<SidebarMenuItem>
				<SidebarMenuButton
					onClick={() => {
						if (!isAlwaysOpen) {
							onToggleDropdown(entityKey)
						}
					}}
					data-state={shouldBeOpen ? 'open' : 'closed'}
				>
					{shouldBeOpen ? (
						<FolderOpen className='size-4' />
					) : (
						Icon && <Icon className='size-4' />
					)}
					<span>{title}</span>
				</SidebarMenuButton>
				{shouldBeOpen && entity.pages.length > 0 && (
					<SidebarMenuSub>
						{entity.pages
							.filter(
								p =>
									p.type === 'page' &&
									!p.file.name.endsWith('dropdown-settings.md')
							)
							.map((page, idx) => {
								// Проверяем, что это страница (page)
								if (page.type !== 'page') return null

								const pageTitle =
									page.frontmatter?.title ||
									page.file.name.replaceAll('.md', '')
								const filePath =
									page.file.originalRelativePath || page.file.relativePath
								const PageIcon = resolveIcon(page.frontmatter?.icon)
								const pageKey =
									page.file.originalRelativePath || page.file.relativePath
								return (
									<SidebarMenuSubItem key={`${pageKey}-${idx}`}>
										<SidebarMenuSubButton
											onClick={() => onPageSelect?.(filePath)}
											asChild
										>
											<button type='button'>
												{PageIcon && <PageIcon className='size-4' />}
												<span>{pageTitle}</span>
											</button>
										</SidebarMenuSubButton>
									</SidebarMenuSubItem>
								)
							})}
					</SidebarMenuSub>
				)}
			</SidebarMenuItem>
		)
	}

	if (entity.type === 'group') {
		const title = getEntityTitle(entity)
		return (
			<SidebarMenuItem>
				<SidebarMenuButton disabled>
					{Icon && <Icon className='size-4' />}
					<span>{title}</span>
				</SidebarMenuButton>
				{entity.pages.length > 0 && (
					<SidebarMenuSub>
						{entity.pages
							.filter(
								p =>
									p.type === 'page' &&
									!p.file.name.endsWith('group-settings.md')
							)
							.map((page, idx) => {
								// Проверяем, что это страница (page)
								if (page.type !== 'page') return null

								const pageTitle =
									page.frontmatter?.title ||
									page.file.name.replaceAll('.md', '')
								const filePath =
									page.file.originalRelativePath || page.file.relativePath
								const PageIcon = resolveIcon(page.frontmatter?.icon)
								const pageKey =
									page.file.originalRelativePath || page.file.relativePath
								return (
									<SidebarMenuSubItem key={`${pageKey}-${idx}`}>
										<SidebarMenuSubButton
											onClick={() => onPageSelect?.(filePath)}
											asChild
										>
											<button type='button'>
												{PageIcon && <PageIcon className='size-4' />}
												<span>{pageTitle}</span>
											</button>
										</SidebarMenuSubButton>
									</SidebarMenuSubItem>
								)
							})}
					</SidebarMenuSub>
				)}
			</SidebarMenuItem>
		)
	}

	return null
}
