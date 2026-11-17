<script lang="ts">
	import { page } from '$app/state';
	import type { Payday } from '../../domain/models.ts';
	import Logo from '../brand/Logo.svelte';
	import Icon from '../icons/Icon.svelte';
	import PaydayRail from '../payday/PaydayRail.svelte';
	import { isCurrent, NAV_ITEMS } from './nav-items.ts';

	let { version, paydays = [] }: { version: string; paydays?: Payday[] } = $props();
</script>

<nav class="nav" aria-label="Main">
	<a class="brand" href="/" aria-label="Kinsena home">
		<Logo size={36} />
		<span class="brand-name">Kinsena</span>
	</a>
	<ul>
		{#each NAV_ITEMS as item (item.href)}
			{@const current = isCurrent(item, page.url.pathname)}
			<li class:active-item={item.href === '/'}>
				<a href={item.href} aria-current={current ? 'page' : undefined} title={item.label}>
					<span class="icon"><Icon name={item.icon} /></span>
					<span class="label">{item.label}</span>
					<kbd class="kbd shortcut" aria-hidden="true">{item.shortcut}</kbd>
				</a>
				{#if item.href === '/'}
					<div class="paydays-nested">
						<PaydayRail {paydays} variant="nested" />
					</div>
				{/if}
			</li>
		{/each}
	</ul>
	<div class="paydays-rail">
		<PaydayRail {paydays} variant="rail" />
	</div>
	<p class="foot">
		<span>Shortcuts: <kbd class="kbd">n</kbd> add, <kbd class="kbd">i</kbd> salary in</span>
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
		background: #12110e;
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
		gap: 2px;
		min-height: 3.25rem;
		margin: 0;
		padding: var(--space-1) var(--space-2);
		border-radius: var(--radius-sm);
		color: #8c8c8c;
		font-size: var(--text-xs);
		font-weight: 650;
		transition:
			color var(--duration-base),
			background var(--duration-base);
	}

	li a[aria-current='page'] {
		color: #e5c98b;
		background: #1e1c18;
	}

	.icon {
		display: grid;
	}

	.brand,
	.shortcut,
	.foot,
	.paydays-nested,
	.paydays-rail {
		display: none;
	}

	@media (hover: hover) {
		li a:hover {
			color: rgb(255 255 255 / 0.8);
			background: rgb(255 255 255 / 0.03);
		}

		li a[aria-current='page']:hover {
			color: #e5c98b;
			background: #1e1c18;
		}
	}

	/* Tablet: slim icon rail on the left; payday cycles after Settings */
	@media (min-width: 640px) {
		.nav {
			inset: 0 auto 0 0;
			width: var(--rail-width);
			height: 100dvh;
			padding: var(--space-4) var(--space-2);
			border-top: 0;
			border-right: 0;
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: var(--space-3);
			overflow: auto;
		}

		.brand {
			display: flex;
			justify-content: center;
			padding: var(--space-1) 0 var(--space-2);
		}

		.brand-name {
			display: none;
		}

		ul {
			height: auto;
			width: 100%;
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: var(--space-2);
		}

		li a {
			width: 64px;
			min-height: 56px;
			margin: 0;
			gap: 4px;
			border-radius: var(--radius-sm);
		}

		.paydays-rail {
			display: block;
			width: 100%;
			margin-top: var(--space-3);
		}
	}

	/* Desktop: full sidebar; paydays nested under Active */
	@media (min-width: 1100px) {
		.nav {
			width: var(--sidebar-width);
			max-width: 350px;
			align-items: stretch;
			padding: var(--space-6) var(--space-4);
			gap: var(--space-6);
			overflow-x: hidden;
		}

		.brand {
			align-items: center;
			gap: var(--space-3);
			/* Same px as nav links so logo + icons share one X rail */
			padding: 0 var(--space-3);
		}

		.brand-name {
			display: inline;
			color: var(--text);
			font-size: var(--text-xl);
			font-weight: 800;
			letter-spacing: -0.02em;
		}

		ul {
			width: 100%;
			gap: var(--space-1);
		}

		li {
			width: 100%;
		}

		li a {
			width: 100%;
			box-sizing: border-box;
			min-height: var(--tap);
			flex-direction: row;
			align-items: center;
			justify-content: flex-start;
			gap: var(--space-3);
			margin: 0;
			padding: 0.625rem var(--space-3);
			border-radius: var(--radius-md);
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

		.paydays-rail {
			display: none;
		}

		.paydays-nested {
			display: flex;
			flex-direction: column;
			gap: 0.375rem;
			/* ml + calc width — never ml + width:100% (overflows past sidebar) */
			box-sizing: border-box;
			min-width: 0;
			width: calc(100% - 1.35rem);
			margin: 0.375rem 0 0.375rem 1.35rem;
			padding-left: 0.875rem;
			border-left: 1px solid rgb(255 255 255 / 0.12);
		}

		.foot {
			display: grid;
			gap: var(--space-1);
			margin-top: auto;
			padding: 0 var(--space-3);
			color: #8c8c8c;
			font-size: var(--text-xs);
		}
	}
</style>
