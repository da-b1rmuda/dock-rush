import { DocumentationEntity } from '../types'
import { isButton, isDropdown, isGroup } from './types-helper'

export function getOrder(e: DocumentationEntity): number {
	if (isButton(e)) return e.settings.order ?? 100
	if (isDropdown(e)) return e.settings?.order ?? 100
	if (isGroup(e)) return e.settings?.order ?? 100
	return e.frontmatter?.order ?? 100
}
