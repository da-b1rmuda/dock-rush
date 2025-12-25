import { Moon, Sun } from 'lucide-react'
import * as React from 'react'
import { Button } from './ui/button'

export function ThemeToggle() {
	const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
		if (globalThis.window === undefined) return 'dark'
		const stored = globalThis.localStorage.getItem('theme')
		if (stored === 'light' || stored === 'dark') return stored
		return 'dark'
	})

	React.useEffect(() => {
		const root = document.documentElement
		if (theme === 'dark') {
			root.classList.add('dark')
		} else {
			root.classList.remove('dark')
		}
		if (globalThis.window !== undefined) {
			globalThis.localStorage.setItem('theme', theme)
		}
	}, [theme])

	const toggleTheme = () => {
		setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
	}

	return (
		<Button
			variant='ghost'
			size='icon'
			onClick={toggleTheme}
			className='h-9 w-9'
			aria-label='Toggle theme'
		>
			<Sun className='h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
			<Moon className='absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
			<span className='sr-only'>Toggle theme</span>
		</Button>
	)
}
