<script lang="ts">
	import { goto } from '$app/navigation';
	import { openSheet } from '#lib/client/sheet-route.ts';
	import { sidebarCollapsedCookie } from '#lib/client/sidebar.ts';
	import { shortcutFor } from '#lib/client/shortcuts.ts';
	import { undoStack } from '#lib/client/undo.svelte.ts';
	import AppNav from '#lib/ui/layout/AppNav.svelte';
	import Toaster from '#lib/ui/layout/Toaster.svelte';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
	// Seed from SSR cookie so first paint matches (cookie updates keep later loads aligned).
	// svelte-ignore state_referenced_locally
	let sidebarCollapsed = $state(data.sidebarCollapsed);

	$effect(() => {
		document.cookie = sidebarCollapsedCookie(sidebarCollapsed);
	});

	function toggleSidebar() {
		sidebarCollapsed = !sidebarCollapsed;
	}

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
		if (!typing && event.key === '[' && !event.metaKey && !event.ctrlKey && !event.altKey) {
			event.preventDefault();
			toggleSidebar();
			return;
		}
		if (!typing && (event.metaKey || event.ctrlKey) && event.key === '\\') {
			event.preventDefault();
			toggleSidebar();
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

<div class="shell" class:sidebar-collapsed={sidebarCollapsed}>
	<AppNav version={data.version} paydays={data.openPaydays} bind:collapsed={sidebarCollapsed} />
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
		padding: calc(var(--safe-top) + var(--space-8)) var(--space-6)
			calc(var(--nav-height) + var(--safe-bottom) + var(--space-16));
	}

	@media (min-width: 640px) {
		.content {
			padding: var(--space-10);
			padding-left: calc(var(--rail-width) + var(--space-10));
			transition:
				padding-left var(--duration-collapse) var(--ease-collapse),
				max-width var(--duration-collapse) var(--ease-collapse);
		}
	}

	@media (min-width: 1100px) {
		.content {
			max-width: calc(var(--content-max) + var(--sidebar-width));
			padding-left: calc(var(--sidebar-width) + var(--space-12));
			padding-right: var(--space-12);
			padding-top: var(--space-12);
			padding-bottom: var(--space-16);
		}

		.shell.sidebar-collapsed .content {
			max-width: calc(var(--content-max) + var(--rail-width));
			padding-left: calc(var(--rail-width) + var(--space-10));
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.content {
			transition: none;
		}
	}
</style>
