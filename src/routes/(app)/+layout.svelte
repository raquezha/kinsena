<script lang="ts">
	import { goto } from '$app/navigation';
	import { openSheet } from '#lib/client/sheet-route.ts';
	import { shortcutFor } from '#lib/client/shortcuts.ts';
	import { undoStack } from '#lib/client/undo.svelte.ts';
	import AppNav from '#lib/ui/layout/AppNav.svelte';
	import Toaster from '#lib/ui/layout/Toaster.svelte';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	function onKeydown(event: KeyboardEvent) {
		const target = event.target as HTMLElement;
		const typing =
			target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
		if (
			!typing &&
			(event.metaKey || event.ctrlKey) &&
			event.key.toLowerCase() === 'z' &&
			!event.shiftKey
		) {
			event.preventDefault();
			void undoStack.undo();
			return;
		}
		const shortcut = shortcutFor({
			key: event.key,
			metaKey: event.metaKey,
			ctrlKey: event.ctrlKey,
			altKey: event.altKey,
			targetTag: target.tagName,
			targetEditable: target.isContentEditable,
			dialogOpen: document.querySelector('dialog[open]') !== null
		});
		if (shortcut.kind === 'navigate') void goto(shortcut.href);
		if (shortcut.kind === 'sheet' && location.pathname === '/') void openSheet(shortcut.name);
	}
</script>

<svelte:window onkeydown={onKeydown} />

<div class="shell">
	<AppNav version={data.version} paydays={data.openPaydays} />
	<main class="content">
		{@render children()}
	</main>
	<Toaster />
</div>

<style>
	.shell {
		min-height: 100dvh;
	}

	.content {
		view-transition-name: page;
		width: 100%;
		max-width: var(--content-max);
		margin: 0 auto;
		padding: calc(var(--safe-top) + var(--space-5)) var(--space-4)
			calc(var(--nav-height) + var(--safe-bottom) + 96px);
	}

	@media (min-width: 640px) {
		.content {
			padding: var(--space-8);
			padding-left: calc(var(--rail-width) + var(--space-8));
		}
	}

	@media (min-width: 1100px) {
		.content {
			max-width: calc(var(--content-max) + var(--sidebar-width));
			padding-left: calc(var(--sidebar-width) + 40px);
			padding-right: 40px;
		}
	}
</style>
