<script lang="ts">
	import { page } from '$app/state';
	import Logo from '../brand/Logo.svelte';
	import Icon from '../icons/Icon.svelte';
	import { isCurrent, NAV_ITEMS } from './nav-items.ts';

	let { version }: { version: string } = $props();
</script>

<nav class="nav" aria-label="Main">
	<a class="brand" href="/" aria-label="Kinsena home">
		<Logo size={36} />
		<span class="brand-name">Kinsena</span>
	</a>
	<ul>
		{#each NAV_ITEMS as item (item.href)}
			{@const current = isCurrent(item, page.url.pathname)}
			<li>
				<a href={item.href} aria-current={current ? 'page' : undefined} title={item.label}>
					<span class="icon"><Icon name={item.icon} /></span>
					<span class="label">{item.label}</span>
					<kbd class="kbd shortcut" aria-hidden="true">{item.shortcut}</kbd>
				</a>
			</li>
		{/each}
	</ul>
	<p class="foot">
		<span>Press <kbd class="kbd">n</kbd> to add an item</span>
		<span>Kinsena {version}</span>
	</p>
</nav>

<style>
	.nav {
		position: fixed;
		z-index: var(--z-nav);
		inset: auto 0 0 0;
		height: calc(var(--nav-height) + var(--safe-bottom));
		padding: 0 var(--space-2) var(--safe-bottom);
		background: rgb(10 14 12 / 0.86);
		backdrop-filter: blur(18px) saturate(1.4);
		border-top: 1px solid var(--border-subtle);
		view-transition-name: nav;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		height: var(--nav-height);
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		align-items: center;
	}

	a {
		text-decoration: none;
		color: inherit;
	}

	li a {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 3px;
		min-height: 54px;
		margin: 0 var(--space-1);
		border-radius: var(--radius-md);
		color: var(--text-dim);
		font-size: var(--text-xs);
		font-weight: 650;
		transition:
			color var(--duration-base),
			background var(--duration-base);
	}

	li a[aria-current='page'] {
		color: var(--accent);
		background: var(--accent-soft);
	}

	.icon {
		display: grid;
		transition: transform var(--duration-base) var(--ease-spring);
	}

	li a[aria-current='page'] .icon {
		transform: translateY(-1px) scale(1.08);
	}

	.brand,
	.shortcut,
	.foot {
		display: none;
	}

	@media (hover: hover) {
		li a:hover {
			color: var(--text);
		}
	}

	/* Tablet: a slim icon rail on the left */
	@media (min-width: 640px) {
		.nav {
			inset: 0 auto 0 0;
			width: var(--rail-width);
			height: 100dvh;
			padding: var(--space-4) var(--space-2);
			border-top: 0;
			border-right: 1px solid var(--border-subtle);
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: var(--space-6);
		}

		.brand {
			display: flex;
		}

		.brand-name {
			display: none;
		}

		ul {
			height: auto;
			display: flex;
			flex-direction: column;
			gap: var(--space-2);
		}

		li a {
			width: 64px;
			min-height: 60px;
		}
	}

	/* Desktop: a full sidebar with labels and shortcut hints */
	@media (min-width: 1100px) {
		.nav {
			width: var(--sidebar-width);
			align-items: stretch;
			padding: var(--space-6) var(--space-4);
		}

		.brand {
			align-items: center;
			gap: var(--space-3);
			padding: 0 var(--space-2);
		}

		.brand-name {
			display: inline;
			font-size: var(--text-xl);
			font-weight: 800;
			letter-spacing: -0.02em;
		}

		li a {
			width: auto;
			min-height: var(--tap);
			flex-direction: row;
			justify-content: flex-start;
			gap: var(--space-3);
			padding: 0 var(--space-3);
			font-size: var(--text-md);
		}

		.shortcut {
			display: inline;
			margin-left: auto;
			opacity: 0;
			transition: opacity var(--duration-fast);
		}

		li a:hover .shortcut,
		li a:focus-visible .shortcut {
			opacity: 1;
		}

		.foot {
			display: grid;
			gap: var(--space-1);
			margin-top: auto;
			padding: 0 var(--space-2);
			color: var(--text-dim);
			font-size: var(--text-xs);
		}
	}
</style>
