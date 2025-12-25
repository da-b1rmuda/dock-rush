import { RefObject, useEffect } from 'react'

export function useInterceptMdLinks(
	ref: RefObject<HTMLElement>,
	onNavigate: (filePath: string) => void
) {
	useEffect(() => {
		const el = ref.current
		if (!el) return

		const handler = (e: MouseEvent) => {
			const anchor = (e.target as HTMLElement).closest('a')
			if (!anchor) return

			const href = anchor.getAttribute('href')
			if (!href || !href.endsWith('.md')) return // интересуют только *.md

			e.preventDefault()

			// Убираем якорь и параметры, нормализуем сепараторы
			const clean = href.split('#')[0].split('?')[0].replace(/\\/g, '/')

			onNavigate(clean)
		}

		el.addEventListener('click', handler)
		return () => el.removeEventListener('click', handler)
	}, [ref, onNavigate])
}
