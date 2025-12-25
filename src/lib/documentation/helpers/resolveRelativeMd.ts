export function resolveRelativeMd(base: string, rel: string): string {
	// 1. нормализуем сепараторы → всегда "/"
	const baseParts = base.replace(/\\/g, '/').split('/').filter(Boolean)
	const relParts = rel.replace(/\\/g, '/').split('/').filter(Boolean)

	// 2. копируем базу
	const stack = [...baseParts]

	// 3. разбираем относительный путь
	for (const p of relParts) {
		if (p === '..') stack.pop()
		else if (p !== '.') stack.push(p)
	}

	// 4. собираем обратно
	return stack.join('/')
}
