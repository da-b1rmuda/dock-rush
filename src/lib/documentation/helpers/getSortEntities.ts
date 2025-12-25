import { DocumentationEntity } from '../types'
import { isButton, isDropdown, isGroup } from './types-helper'

export function getSortEntities(
	list: DocumentationEntity[]
): DocumentationEntity[] {
	return list.sort((a, b) => {
		const ao = isButton(a)
			? a.settings.order
			: isGroup(a)
			? a.settings.order
			: isDropdown(a)
			? a.settings.order
			: a.frontmatter?.order ?? 100

		const bo = isButton(b)
			? b.settings.order
			: isGroup(b)
			? b.settings.order
			: isDropdown(b)
			? b.settings.order
			: b.frontmatter?.order ?? 100

		if (ao !== bo) return ao - bo

		const at = isButton(a)
			? a.settings.title
			: isGroup(a)
			? a.settings.title
			: isDropdown(a)
			? a.settings.title
			: a.frontmatter?.title ?? ''

		const bt = isButton(b)
			? b.settings.title
			: isGroup(b)
			? b.settings.title
			: isDropdown(b)
			? b.settings.title
			: b.frontmatter?.title ?? ''

		return at.localeCompare(bt)
	})
}
