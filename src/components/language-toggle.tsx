import { Languages } from 'lucide-react'
import * as React from 'react'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './ui/select'

interface LanguageToggleProps {
	readonly languages: string[]
	readonly selectedLanguage: string | null
	readonly onLanguageChange: (language: string | null) => void
}

export function LanguageToggle({
	languages,
	selectedLanguage,
	onLanguageChange,
}: LanguageToggleProps) {
	if (languages.length === 0) {
		return null
	}

	return (
		<Select
			value={selectedLanguage || ''}
			onValueChange={(value) => {
				onLanguageChange(value || null)
			}}
		>
			<SelectTrigger className='h-9 w-[120px]'>
				<Languages className='mr-2 h-4 w-4' />
				<SelectValue placeholder='Language' />
			</SelectTrigger>
			<SelectContent>
				{languages.map(lang => (
					<SelectItem key={lang} value={lang}>
						{lang.toUpperCase()}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}

