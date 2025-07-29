import { toast } from "sonner";
import {
	CodeBlock,
	CodeBlockBody,
	CodeBlockContent,
	CodeBlockCopyButton,
	CodeBlockFilename,
	CodeBlockFiles,
	CodeBlockHeader,
	CodeBlockItem,
	CodeBlockSelect,
	CodeBlockSelectContent,
	CodeBlockSelectItem,
	CodeBlockSelectTrigger,
	CodeBlockSelectValue,
} from "@/components/ui/kibo-ui/code-block";
import type { BundledLanguage } from "@/components/ui/kibo-ui/code-block/shiki.bundle";

const code = [
	{
		language: "tsx",
		filename: "React.tsx",
		code: `import { usePresenceCount } from "@simple-presence/react";
	
function OnlineUsers() {
	const count = usePresenceCount("page-1", {
		appKey: "your-app-key",
	});
	
	return (
		<div>
			<span>👥 {count} users online</span>
		</div>
	);
}`,
	},
	{
		language: "js",
		filename: "Agnostic.js",
		code: `import { SimplePresence } from "@simple-presence/core";

// Initialize presence tracking
const presence = new SimplePresence({
	tag: "page-1",
	appKey: "your-app-key",
	onCountChange: (count) => {
		console.log("Online users:", count);
	},
});


// Clean up when done
presence.destroy();`,
	},
];

export function QuickGuide() {
	return (
		<CodeBlock data={code} defaultValue={code[0].language}>
			<CodeBlockHeader>
				<CodeBlockFiles>
					{(item) => (
						<CodeBlockFilename key={item.language} value={item.language}>
							{item.filename}
						</CodeBlockFilename>
					)}
				</CodeBlockFiles>
				<CodeBlockSelect>
					<CodeBlockSelectTrigger>
						<CodeBlockSelectValue />
					</CodeBlockSelectTrigger>
					<CodeBlockSelectContent>
						{(item) => (
							<CodeBlockSelectItem key={item.language} value={item.language}>
								{item.language}
							</CodeBlockSelectItem>
						)}
					</CodeBlockSelectContent>
				</CodeBlockSelect>
				<CodeBlockCopyButton
					onCopy={() => toast.info("Copied code to clipboard")}
				/>
			</CodeBlockHeader>
			<CodeBlockBody>
				{(item) => (
					<CodeBlockItem
						key={item.language}
						lineNumbers={false}
						value={item.language}
					>
						<CodeBlockContent language={item.language as BundledLanguage}>
							{item.code}
						</CodeBlockContent>
					</CodeBlockItem>
				)}
			</CodeBlockBody>
		</CodeBlock>
	);
}
