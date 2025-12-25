import matter from 'gray-matter'
import { errorBuilder } from '../errorBuilder/error-builder'
import type {
	BaseMeta,
	ButtonSettings,
	DropdownSettings,
	GroupSettings,
	LanguageSettings,
	PageFrontmatter,
	VersionSettings,
} from './types'

/**
 * Парсит frontmatter из markdown файла
 */
export function parseFrontmatter(content: string): {
	frontmatter: Record<string, unknown>
	content: string
} {
	try {
		const parsed = matter(content)
		return {
			frontmatter: parsed.data || {},
			content: parsed.content,
		}
	} catch (error) {
		// Если frontmatter некорректный, возвращаем весь контент как есть
		errorBuilder([], {
			type: 'VERSION_FORMAT_ERROR',
			reason: `frontmatter некорректный`,
			fix: `1`,
		})
		return {
			frontmatter: {},
			content,
		}
	}
}

/**
 * Парсит метаданные страницы из frontmatter
 */
export function parsePageFrontmatter(
	frontmatter: Record<string, unknown>
): PageFrontmatter {
	return {
		title:
			typeof frontmatter.title === 'string' ? frontmatter.title : undefined,
		order:
			typeof frontmatter.order === 'number'
				? frontmatter.order
				: typeof frontmatter.order === 'string'
				? parseInt(frontmatter.order, 10)
				: undefined,
		icon: typeof frontmatter.icon === 'string' ? frontmatter.icon : undefined,
		hidden:
			typeof frontmatter.hidden === 'boolean'
				? frontmatter.hidden
				: frontmatter.hidden === 'true'
				? true
				: undefined,
		searchable:
			typeof frontmatter.searchable === 'boolean'
				? frontmatter.searchable
				: frontmatter.searchable === 'false'
				? false
				: undefined,
		lang: typeof frontmatter.lang === 'string' ? frontmatter.lang : undefined,
		tags: Array.isArray(frontmatter.tags)
			? frontmatter.tags.filter((t): t is string => typeof t === 'string')
			: undefined,
		layout:
			typeof frontmatter.layout === 'string' ? frontmatter.layout : undefined,
	}
}

/**
 * Парсит настройки dropdown из frontmatter
 */
export function parseDropdownSettings(
	frontmatter: Record<string, unknown>
): DropdownSettings {
	return {
		title:
			typeof frontmatter.title === 'string' ? frontmatter.title : undefined,
		order:
			typeof frontmatter.order === 'number'
				? frontmatter.order
				: typeof frontmatter.order === 'string'
				? parseInt(frontmatter.order, 10)
				: undefined,
		icon: typeof frontmatter.icon === 'string' ? frontmatter.icon : undefined,
		hidden:
			typeof frontmatter.hidden === 'boolean'
				? frontmatter.hidden
				: frontmatter.hidden === 'true'
				? true
				: undefined,
		searchable:
			typeof frontmatter.searchable === 'boolean'
				? frontmatter.searchable
				: frontmatter.searchable === 'false'
				? false
				: undefined,
		dropdown:
			typeof frontmatter.dropdown === 'string' &&
			['open', 'collapsed', 'always-open'].includes(frontmatter.dropdown)
				? (frontmatter.dropdown as 'open' | 'collapsed' | 'always-open')
				: undefined,
	}
}

/**
 * Парсит настройки group из frontmatter
 */
export function parseGroupSettings(
	frontmatter: Record<string, unknown>
): GroupSettings {
	return {
		title:
			typeof frontmatter.title === 'string' ? frontmatter.title : undefined,
		order:
			typeof frontmatter.order === 'number'
				? frontmatter.order
				: typeof frontmatter.order === 'string'
				? parseInt(frontmatter.order, 10)
				: undefined,
		icon: typeof frontmatter.icon === 'string' ? frontmatter.icon : undefined,
		hidden:
			typeof frontmatter.hidden === 'boolean'
				? frontmatter.hidden
				: frontmatter.hidden === 'true'
				? true
				: undefined,
		searchable:
			typeof frontmatter.searchable === 'boolean'
				? frontmatter.searchable
				: frontmatter.searchable === 'false'
				? false
				: undefined,
		description:
			typeof frontmatter.description === 'string'
				? frontmatter.description
				: undefined,
	}
}

/**
 * Парсит настройки кнопки из frontmatter
 */
export function parseButtonSettings(
	frontmatter: Record<string, unknown>,
	defaultTitle: string
): ButtonSettings {
	return {
		type: 'button',
		variant:
			typeof frontmatter.variant === 'string' &&
			['link', 'page'].includes(frontmatter.variant)
				? (frontmatter.variant as 'link' | 'page')
				: 'page',
		title:
			typeof frontmatter.title === 'string' ? frontmatter.title : defaultTitle,
		order:
			typeof frontmatter.order === 'number'
				? frontmatter.order
				: typeof frontmatter.order === 'string'
				? parseInt(frontmatter.order, 10)
				: undefined,
		icon: typeof frontmatter.icon === 'string' ? frontmatter.icon : undefined,
		hidden:
			typeof frontmatter.hidden === 'boolean'
				? frontmatter.hidden
				: frontmatter.hidden === 'true'
				? true
				: undefined,
		searchable:
			typeof frontmatter.searchable === 'boolean'
				? frontmatter.searchable === false
				: frontmatter.searchable === 'false'
				? false
				: false, // Кнопки по умолчанию не участвуют в поиске
		url: typeof frontmatter.url === 'string' ? frontmatter.url : undefined,
		style:
			typeof frontmatter.style === 'string' &&
			['primary', 'secondary', 'ghost'].includes(frontmatter.style)
				? (frontmatter.style as 'primary' | 'secondary' | 'ghost')
				: undefined,
		target:
			typeof frontmatter.target === 'string' &&
			['_blank', '_self'].includes(frontmatter.target)
				? (frontmatter.target as '_blank' | '_self')
				: undefined,
		position:
			typeof frontmatter.position === 'string' &&
			['sidebar', 'header'].includes(frontmatter.position)
				? (frontmatter.position as 'sidebar' | 'header')
				: 'sidebar',
	}
}

/**
 * Парсит настройки версии из frontmatter
 */
export function parseVersionSettings(
	frontmatter: Record<string, unknown>
): VersionSettings {
	return {
		title:
			typeof frontmatter.title === 'string' ? frontmatter.title : undefined,
		order:
			typeof frontmatter.order === 'number'
				? frontmatter.order
				: typeof frontmatter.order === 'string'
				? parseInt(frontmatter.order, 10)
				: undefined,
		default:
			typeof frontmatter.default === 'boolean'
				? frontmatter.default
				: frontmatter.default === 'true',
		deprecated:
			typeof frontmatter.deprecated === 'boolean'
				? frontmatter.deprecated
				: frontmatter.deprecated === 'true',
	}
}

/**
 * Парсит настройки языка из frontmatter
 */
export function parseLanguageSettings(
	frontmatter: Record<string, unknown>
): LanguageSettings {
	return {
		label:
			typeof frontmatter.label === 'string' ? frontmatter.label : undefined,
		order:
			typeof frontmatter.order === 'number'
				? frontmatter.order
				: typeof frontmatter.order === 'string'
				? parseInt(frontmatter.order, 10)
				: undefined,
	}
}

/**
 * Применяет значения по умолчанию к базовым метаданным
 */
export function applyBaseMetaDefaults(meta: Partial<BaseMeta>): BaseMeta {
	return {
		order: meta.order ?? 100,
		hidden: meta.hidden ?? false,
		searchable: meta.searchable ?? true,
		...meta,
	}
}

/**
 * Наследует метаданные от родителя к дочернему элементу
 */
export function inheritMeta(
	childMeta: Partial<BaseMeta>,
	parentMeta?: Partial<BaseMeta>
): BaseMeta {
	if (!parentMeta) {
		return applyBaseMetaDefaults(childMeta)
	}

	// Наследуем значения, если они не заданы в дочернем элементе
	const inherited: Partial<BaseMeta> = {
		icon: childMeta.icon ?? parentMeta.icon,
		// hidden не наследуется вверх (если дочерний hidden, он остается hidden)
		hidden: childMeta.hidden ?? false,
		// searchable наследуется, но если родитель false, то и дочерний false
		searchable:
			childMeta.searchable !== undefined
				? childMeta.searchable
				: parentMeta.searchable ?? true,
	}

	return applyBaseMetaDefaults({
		...parentMeta,
		...inherited,
		...childMeta, // Дочерние значения имеют приоритет
	})
}
