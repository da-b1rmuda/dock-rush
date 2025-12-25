import * as LucideIcons from 'lucide-react'

/**
 * Разрешает имя иконки в компонент из lucide-react
 */
export function resolveIcon(iconName?: string): React.ComponentType<{ className?: string }> | null {
	if (!iconName) return null
	
	// Преобразуем имя иконки в формат PascalCase
	const pascalCaseName = iconName
		.split(/[-_\s]/)
		.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join('')
	
	// Ищем иконку в lucide-react
	const IconComponent = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[pascalCaseName]
	
	return IconComponent || null
}

