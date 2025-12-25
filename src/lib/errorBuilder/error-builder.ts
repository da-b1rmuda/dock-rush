import { FileInfo } from '../scanningFolder'

export function errorBuilder(items: Array<FileInfo>, err?: Object) {
	const errors = []

	if (err) {
		errors.push(err)
	}

	// Паттерны для проверки структуры
	const versionPattern = /^\d+\.\d+\.\d+/
	const groupPattern = /^\(group-.*\)$/
	const languagePattern = /^[a-z]{2}$/ // Языковые коды (ISO 639-1)

	// Получаем корневые элементы (depth = 0)
	const rootItems = items.filter(item => item.depth === 0)

	// Проверяем каждый корневой элемент
	rootItems.forEach(item => {
		// Проверка 1: В корне должны быть только папки (директории)
		if (item.type !== 'directory') {
			errors.push({
				type: 'ROOT_FILE_ERROR',
				file: item.name,
				path: item.relativePath,
				reason: 'В корневой директории docs/ не должно быть файлов',
				fix: `Переместите файл "${item.name}" в соответствующую версионную папку (например, "1.0.0/")`,
			})
		}

		// Проверка 2: Папки в корне должны соответствовать паттерну версии
		if (item.type === 'directory') {
			if (!versionPattern.test(item.name)) {
				errors.push({
					type: 'VERSION_FORMAT_ERROR',
					folder: item.name,
					path: item.relativePath,
					reason: `Папка "${item.name}" не соответствует формату версии (должно быть "x.x.x")`,
					fix: `Переименуйте папку в формат версии, например: "1.0.0"`,
				})
			}
		}
	})

	// 2. Проверяем структуру вложенных файлов
	items.forEach(item => {
		// Проверка 3: Файлы должны быть внутри версионных папок
		if (item.type === 'file') {
			const pathParts = item.relativePath.split(/[\\/]/)

			// Проверяем, находится ли файл внутри папки с версией
			if (pathParts.length < 2) {
				errors.push({
					type: 'ORPHAN_FILE_ERROR',
					file: item.name,
					path: item.relativePath,
					reason: `Файл "${item.name}" находится в корне, а не внутри версионной папки`,
					fix: `Переместите файл в соответствующую версионную папку (например, "1.0.0/${item.name}")`,
				})
			} else {
				const parentFolder = pathParts[0]

				// Проверяем, что родительская папка - это версия
				if (!versionPattern.test(parentFolder)) {
					errors.push({
						type: 'FILE_IN_WRONG_FOLDER',
						file: item.name,
						path: item.relativePath,
						reason: `Файл "${item.name}" находится в папке "${parentFolder}", которая не является версионной папкой`,
						fix: `Переместите файл в папку с версией (например, "1.0.0/")`,
					})
				}
			}
		}

		// Проверка 4: Вложенные директории (не считая версионных)
		// Эта проверка теперь выполняется в разделе 4 для каждой версии отдельно
	})

	// 3. Проверяем структуру внутри версионных папок
	const versionFolders = items.filter(
		item =>
			item.depth === 0 &&
			item.type === 'directory' &&
			versionPattern.test(item.name)
	)

	versionFolders.forEach(versionFolder => {
		const versionFiles = items.filter(item => {
			const pathParts = item.relativePath.split(/[\\/]/)
			return pathParts[0] === versionFolder.name
		})

		// Проверка: .md файлы в корне версии должны быть только .button.md
		const rootMdFiles = versionFiles.filter(
			f => f.depth === 1 && f.type === 'file' && f.extension === 'md'
		)

		rootMdFiles.forEach(file => {
			if (!file.name.endsWith('.button.md')) {
				errors.push({
					type: 'INVALID_ROOT_MD_FILE',
					file: file.name,
					path: file.relativePath,
					reason: `В корне версионной папки "${versionFolder.name}" обычные .md файлы не допускаются. Используйте .button.md для кнопок или переместите файл в подпапку`,
					fix: `Переименуйте файл в "${
						file.name.endsWith('.md')
							? file.name.slice(0, -3) + '.button.md'
							: file.name + '.button.md'
					}" или переместите в подпапку`,
				})
			}
		})

		// Проверка: папки (group-*) должны содержать только файлы, не вложенные папки
		const groupFolders = versionFiles.filter(
			f => f.depth === 1 && f.type === 'directory' && groupPattern.test(f.name)
		)

		groupFolders.forEach(groupFolder => {
			const nestedDirs = versionFiles.filter(
				f =>
					f.relativePath.startsWith(groupFolder.relativePath) &&
					f.type === 'directory' &&
					f.depth > groupFolder.depth
			)

			if (nestedDirs.length > 0) {
				errors.push({
					type: 'NESTED_DIRECTORY_IN_GROUP',
					folder: nestedDirs[0].name,
					path: nestedDirs[0].relativePath,
					reason: `Внутри группы "${groupFolder.name}" не допускаются вложенные папки`,
					fix: `Переместите содержимое папки "${nestedDirs[0].name}" на уровень группы или удалите вложенную структуру`,
				})
			}
		})

		// Проверка: обычные папки (dropdown) не должны содержать другие папки
		// Исключение: языковые папки могут содержать любые вложенные папки
		const dropdownFolders = versionFiles.filter(
			f =>
				f.depth === 1 &&
				f.type === 'directory' &&
				!groupPattern.test(f.name) &&
				!versionPattern.test(f.name)
		)

		dropdownFolders.forEach(dropdownFolder => {
			// Если dropdown папка - это языковая папка, разрешаем любые вложенные папки
			const isLanguageFolder = languagePattern.test(dropdownFolder.name)

			// Пропускаем проверку для языковых папок
			if (isLanguageFolder) {
				return
			}

			const nestedDirs = versionFiles.filter(
				f =>
					f.relativePath.startsWith(dropdownFolder.relativePath) &&
					f.type === 'directory' &&
					f.depth > dropdownFolder.depth
			)

			if (nestedDirs.length > 0) {
				errors.push({
					type: 'NESTED_DIRECTORY_IN_DROPDOWN',
					folder: nestedDirs[0].name,
					path: nestedDirs[0].relativePath,
					reason: `Внутри dropdown папки "${dropdownFolder.name}" не допускаются вложенные папки`,
					fix: `Переместите содержимое папки "${nestedDirs[0].name}" на уровень dropdown или используйте плоскую структуру`,
				})
			}
		})

		// Проверка: .button.md файлы должны быть только в корне версии или в папке языка
		const buttonFiles = versionFiles.filter(
			f => f.type === 'file' && f.name.endsWith('.button.md')
		)

		buttonFiles.forEach(buttonFile => {
			const pathParts = buttonFile.relativePath.split(/[\\/]/)

			// Разрешаем .button.md в корне версии (depth = 1) или в папке языка (depth = 2, где второй элемент - языковая папка)
			const isInRoot = buttonFile.depth === 1
			const isInLanguageFolder =
				buttonFile.depth === 2 &&
				pathParts.length > 1 &&
				languagePattern.test(pathParts[1])

			if (!isInRoot && !isInLanguageFolder) {
				errors.push({
					type: 'BUTTON_FILE_IN_WRONG_PLACE',
					file: buttonFile.name,
					path: buttonFile.relativePath,
					reason: `Файл .button.md "${buttonFile.name}" должен находиться только в корне версионной папки или в папке языка`,
					fix: `Переместите файл "${buttonFile.name}" в корень версионной папки "${versionFolder.name}/" или в папку языка (например, "${versionFolder.name}/ru/")`,
				})
			}
		})
	})

	return errors
}
