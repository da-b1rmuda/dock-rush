# Dock Rush

A modern, feature-rich documentation system for React applications with versioning, multi-language support, and markdown-based content.

## Features

- 📚 **Markdown-based** - Write documentation in Markdown
- 🌍 **Multi-language** - Support for multiple languages
- 🔄 **Versioning** - Organize documentation by versions
- 🔍 **Full-text search** - Search through titles and content
- 🎨 **Modern UI** - Beautiful, responsive interface built with Radix UI and Tailwind CSS
- ⚡ **Fast** - Optimized for performance with lazy loading
- 🔗 **URL routing** - Shareable links to specific pages
- 🎯 **Flexible structure** - Support for pages, groups, dropdowns, and buttons

## Installation

```bash
npm install dock-rush
# or
pnpm add dock-rush
# or
yarn add dock-rush
```

## Quick Start

### 1. Install the Vite plugin

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { dockRushScannerPlugin } from 'dock-rush/plugin'

export default defineConfig({
	plugins: [
		react(),
		dockRushScannerPlugin({
			route: '/api/dock-rush-scan', // optional, default: '/api/dock-rush-scan'
			root: process.cwd(), // optional
		}),
	],
})
```

### 2. Use the Documentation component

```tsx
import { Documentation } from 'dock-rush'
import 'dock-rush/style.css'

function App() {
	return (
		<Documentation
			title='My Documentation'
			folderPath='docs'
			useToggleTheme={true}
			useToggleLanguage={true}
			useSearch={true}
			versionSelect={true}
		/>
	)
}
```

### 3. Create your documentation structure

```
docs/
  ├── 2.0.2/
  │   ├── en/
  │   │   ├── intro.md
  │   │   └── getting-started/
  │   │       └── installation.md
  │   └── ru/
  │       └── intro.md
  └── 1.0.1/
      └── api.md
```

## Documentation Structure

### Versions

Versions are detected automatically from folder names matching semantic versioning (e.g., `2.0.2`, `1.0.1`).

### Languages

Optional language folders (e.g., `en`, `ru`) can be used to organize content by language.

### Entity Types

- **Pages** - Regular markdown files (`.md`)
- **Groups** - Folders with `(group-*)` prefix containing related pages
- **Dropdowns** - Folders that can be expanded/collapsed
- **Buttons** - Files with `.button.md` suffix for navigation buttons

### Frontmatter

Each markdown file can include frontmatter:

```yaml
---
title: Page Title
order: 1
icon: file-text
hidden: false
searchable: true
tags:
  - getting-started
  - tutorial
---
```

## API Reference

### Documentation Component Props

| Prop                | Type        | Default           | Description                  |
| ------------------- | ----------- | ----------------- | ---------------------------- |
| `title`             | `string`    | `'Documentation'` | Title of the documentation   |
| `logo`              | `ReactNode` | `<Boxes />`       | Logo component               |
| `folderPath`        | `string`    | `'docs'`          | Path to documentation folder |
| `useToggleTheme`    | `boolean`   | `false`           | Enable theme toggle          |
| `useToggleLanguage` | `boolean`   | `false`           | Enable language toggle       |
| `useSearch`         | `boolean`   | `false`           | Enable search functionality  |
| `versionSelect`     | `boolean`   | `false`           | Enable version selector      |
| `logTreeFiles`      | `object`    | `{}`              | Console logging options      |

### Vite Plugin Options

| Option  | Type     | Default                 | Description                        |
| ------- | -------- | ----------------------- | ---------------------------------- |
| `route` | `string` | `'/api/dock-rush-scan'` | API route for scanning             |
| `root`  | `string` | `process.cwd()`         | Root directory for resolving paths |

## Examples

### Basic Usage

```tsx
import { Documentation } from 'dock-rush'
import 'dock-rush/style.css'
;<Documentation folderPath='docs' />
```

### With All Features

```tsx
<Documentation
	title='My Docs'
	folderPath='public/docs'
	useToggleTheme={true}
	useToggleLanguage={true}
	useSearch={true}
	versionSelect={true}
	logo={<MyLogo />}
/>
```

## License

MIT © da-b1rmuda

**Created with ❤️ for Web2Bizz**
