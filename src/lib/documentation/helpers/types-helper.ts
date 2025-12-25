import { DocumentationEntity, PageFrontmatter } from '../types'

export const isPage = (
	e: DocumentationEntity
): e is Extract<DocumentationEntity, { type: 'page' }> => e.type === 'page'

export const isButton = (
	e: DocumentationEntity
): e is Extract<DocumentationEntity, { type: 'button' }> => e.type === 'button'

export const isDropdown = (
	e: DocumentationEntity
): e is Extract<DocumentationEntity, { type: 'dropdown' }> =>
	e.type === 'dropdown'

export const isGroup = (
	e: DocumentationEntity
): e is Extract<DocumentationEntity, { type: 'group' }> => e.type === 'group'

export function getFrontmatter(
	e: DocumentationEntity
): PageFrontmatter | undefined {
	return isPage(e) ? e.frontmatter : undefined
}

export function isHidden(e: DocumentationEntity): boolean {
	if (isPage(e)) return e.frontmatter?.hidden ?? false
	if (isButton(e)) return e.settings.hidden ?? false
	if (isDropdown(e)) return e.settings?.hidden ?? false
	if (isGroup(e)) return e.settings?.hidden ?? false
	return false
}
