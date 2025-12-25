import { DocumentationEntity } from '../types'

export function getTitle(entity: DocumentationEntity): string {
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
