import { Skeleton } from '@/components/ui/skeleton'
import * as React from 'react'

const LazyMarkdownViewer = React.lazy(() =>
	import('./markdown-viewer').then(m => ({
		default: m.MarkdownViewer,
	}))
)

export function MarkdownViewerLazy(props: any) {
	return (
		<React.Suspense
			fallback={
				<div className='p-6'>
					<Skeleton className='h-8 w-3/4 mb-4' />
					<Skeleton className='h-4 w-full mb-2' />
					<Skeleton className='h-4 w-full mb-2' />
					<Skeleton className='h-4 w-2/3' />
				</div>
			}
		>
			<LazyMarkdownViewer {...props} />
		</React.Suspense>
	)
}
