import { FileText } from 'lucide-react'
import * as React from 'react'

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
	DocumentationProps,
	InternalDocumentationProps,
} from '../types/DocumentationProps'
import { DocumentationEntityItem } from './documentation-entity-item'

export function AppSidebar({
	title,
	logo,
	versionSelect,
	versions = [],
	documentationStructure = [],
	onPageSelect,
	versionStorageKey,
	...props
}: React.ComponentProps<typeof Sidebar> &
	DocumentationProps &
	InternalDocumentationProps & {
		versionStorageKey?: string
	}) {
	// Восстанавливаем сохраненную версию из localStorage
	const [selectedVersion, setSelectedVersion] = React.useState<
		string | undefined
	>(() => {
		if (versionStorageKey && typeof window !== 'undefined') {
			const saved = localStorage.getItem(versionStorageKey)
			if (saved && versions.includes(saved)) {
				return saved
			}
		}
		return versions[0]
	})

	const [openDropdowns, setOpenDropdowns] = React.useState<Set<string>>(
		new Set()
	)

	// Обновляем selectedVersion когда versions загружается или меняется
	React.useEffect(() => {
		if (versions.length > 0) {
			// Проверяем сохраненную версию
			if (versionStorageKey && typeof window !== 'undefined') {
				const saved = localStorage.getItem(versionStorageKey)
				if (saved && versions.includes(saved)) {
					setSelectedVersion(saved)
					return
				}
			}
			// Если сохраненной версии нет или она невалидна, используем первую доступную
			if (!selectedVersion || !versions.includes(selectedVersion)) {
				setSelectedVersion(versions[0])
			}
		}
	}, [versions, versionStorageKey])

	// Сохраняем selectedVersion в localStorage при изменении
	React.useEffect(() => {
		if (versionStorageKey && selectedVersion && typeof window !== 'undefined') {
			localStorage.setItem(versionStorageKey, selectedVersion)
		}
	}, [selectedVersion, versionStorageKey])

	// Получаем структуру для выбранной версии
	const currentStructure = React.useMemo(() => {
		if (!selectedVersion) return null
		return documentationStructure.find(s => s.version === selectedVersion)
	}, [selectedVersion, documentationStructure])

	const toggleDropdown = (path: string) => {
		setOpenDropdowns(prev => {
			const next = new Set(prev)
			if (next.has(path)) {
				next.delete(path)
			} else {
				next.add(path)
			}
			return next
		})
	}

	return (
		<Sidebar {...props}>
			<SidebarHeader>
				<div className='flex items-center justify-between gap-2 px-2 py-2'>
					<a
						href='/'
						className='flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors'
					>
						<div className='flex aspect-square size-8 items-center justify-center text-primary-foreground'>
							{logo}
						</div>
						<span className='font-semibold'>{title}</span>
					</a>
					{versionSelect ? (
						<Select
							value={selectedVersion || ''}
							onValueChange={value => {
								setSelectedVersion(value)
								// При смене версии очищаем выбранную страницу,
								// так как она может не существовать в новой версии
								if (onPageSelect) {
									onPageSelect(null)
								}
							}}
						>
							<SelectTrigger className='h-6 w-auto min-w-16 border border-sidebar-border bg-sidebar-accent/50 hover:bg-sidebar-accent shadow-none focus:ring-0 focus:ring-offset-0 p-0 px-2 text-xs'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{versions.map(version => (
									<SelectItem key={version} value={version}>
										{version}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					) : (
						<div className='h-6 w-auto min-w-16 border border-sidebar-border bg-sidebar-accent/50  shadow-none focus:ring-0 text-center items-center justify-center flex rounded-md focus:ring-offset-0 p-0 px-2 text-xs text-white'>
							<span className='text-sm text-foreground'>
								{versions[0] || 'N/A'}
							</span>
						</div>
					)}
				</div>
			</SidebarHeader>
			<SidebarContent>
				{currentStructure && currentStructure.entities.length > 0 ? (
					<SidebarGroup>
						<SidebarMenu>
							{currentStructure.entities.map((entity, index) => {
								const entityKey =
									entity.type === 'page' || entity.type === 'button'
										? entity.file.originalRelativePath ||
										  entity.file.relativePath
										: entity.folder.originalRelativePath ||
										  entity.folder.relativePath
								return (
									<DocumentationEntityItem
										key={`${entity.type}-${index}-${entityKey}`}
										entity={entity}
										openDropdowns={openDropdowns}
										onToggleDropdown={toggleDropdown}
										onPageSelect={onPageSelect}
									/>
								)
							})}
						</SidebarMenu>
					</SidebarGroup>
				) : (
					<SidebarGroup>
						<SidebarGroupLabel>Документация</SidebarGroupLabel>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton disabled>
									<FileText />
									<span>Нет документации</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroup>
				)}
			</SidebarContent>
		</Sidebar>
	)
}
