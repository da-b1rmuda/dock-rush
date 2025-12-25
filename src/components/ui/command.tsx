import * as React from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"

const Command = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			"flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
			className
		)}
		{...props}
	/>
))
Command.displayName = "Command"

const CommandInput = React.forwardRef<
	HTMLInputElement,
	React.ComponentProps<"input"> & {
		onValueChange?: (value: string) => void
	}
>(({ className, onValueChange, ...props }, ref) => {
	const [value, setValue] = React.useState(props.value || "")

	React.useEffect(() => {
		if (props.value !== undefined) {
			setValue(String(props.value))
		}
	}, [props.value])

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value
		setValue(newValue)
		onValueChange?.(newValue)
		if (props.onChange) {
			props.onChange(e)
		}
	}

	return (
		<div className="flex items-center border-b px-3">
			<Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
			<input
				ref={ref}
				{...props}
				value={value}
				onChange={handleChange}
				className={cn(
					"flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
					className
				)}
			/>
		</div>
	)
})
CommandInput.displayName = "CommandInput"

const CommandList = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
		{...props}
	/>
))
CommandList.displayName = "CommandList"

const CommandEmpty = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn("py-6 text-center text-sm", className)}
		{...props}
	/>
))
CommandEmpty.displayName = "CommandEmpty"

const CommandGroup = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & {
		heading?: string
	}
>(({ className, heading, ...props }, ref) => (
	<div ref={ref} className={cn("overflow-hidden p-1 text-foreground", className)} {...props}>
		{heading && (
			<div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
				{heading}
			</div>
		)}
		<div>
			{props.children}
		</div>
	</div>
))
CommandGroup.displayName = "CommandGroup"

const CommandItem = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & {
		onSelect?: () => void
		value?: string
	}
>(({ className, onSelect, ...props }, ref) => {
	const handleClick = () => {
		onSelect?.()
	}

	return (
		<div
			ref={ref}
			className={cn(
				"relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
				className
			)}
			onClick={handleClick}
			{...props}
		/>
	)
})
CommandItem.displayName = "CommandItem"

const CommandDialog = ({
	open,
	onOpenChange,
	children,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	children: React.ReactNode
}) => {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="overflow-hidden p-0">
				<Command>
					{children}
				</Command>
			</DialogContent>
		</Dialog>
	)
}

export {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
}

