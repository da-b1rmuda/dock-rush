import { useEffect, useState, useCallback } from 'react'

/**
 * Хук для синхронизации URL с выбранной страницей документации
 * Использует hash (#) для хранения пути к файлу в читаемом формате
 * Формат: http://localhost:5173/#2.0.2/ru/advanced/advanced-settings.md
 */
export function useDocumentationRouter(
	folderPath: string
): [string | null, (page: string | null) => void] {
	// Получаем текущую страницу из URL hash при инициализации
	const getPageFromURL = useCallback((): string | null => {
		if (typeof window === 'undefined') return null

		const hash = window.location.hash
		if (!hash || hash.length <= 1) return null

		// Убираем символ # в начале
		const pagePath = hash.slice(1)
		if (!pagePath) return null

		// Декодируем путь (на случай если есть специальные символы)
		try {
			return decodeURIComponent(pagePath)
		} catch {
			return pagePath
		}
	}, [])

	// Инициализируем состояние из URL
	const [currentPage, setCurrentPageState] = useState<string | null>(
		getPageFromURL
	)

	// Обновляем URL при изменении страницы
	const setCurrentPage = useCallback(
		(page: string | null) => {
			setCurrentPageState(page)

			if (typeof window === 'undefined') return

			// Нормализуем путь: заменяем обратные слэши на прямые
			const normalized = page ? page.replace(/\\/g, '/') : ''

			if (normalized) {
				// Кодируем только специальные символы, оставляя путь читаемым
				// encodeURI не кодирует /, что делает URL более читаемым
				const encoded = encodeURI(normalized)
				window.location.hash = encoded
			} else {
				// Удаляем hash если страница не выбрана
				window.history.pushState(
					'',
					document.title,
					window.location.pathname + window.location.search
				)
			}
		},
		[]
	)

	// Слушаем изменения URL (кнопки назад/вперед и прямые изменения hash)
	useEffect(() => {
		if (typeof window === 'undefined') return

		const handleHashChange = () => {
			const page = getPageFromURL()
			setCurrentPageState(page)
		}

		// Слушаем событие hashchange для прямых изменений hash
		window.addEventListener('hashchange', handleHashChange)
		// Слушаем popstate для кнопок назад/вперед
		window.addEventListener('popstate', handleHashChange)

		return () => {
			window.removeEventListener('hashchange', handleHashChange)
			window.removeEventListener('popstate', handleHashChange)
		}
	}, [getPageFromURL])

	return [currentPage, setCurrentPage]
}

