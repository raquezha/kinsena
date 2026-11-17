<script lang="ts">
	/* eslint-disable max-lines -- rail + desktop expanded/collapsed CSS */
	import { page } from '$app/state';
	import type { Payday } from '../../domain/models.ts';
	import Logo from '../brand/Logo.svelte';
	import Icon from '../icons/Icon.svelte';
	import PaydayRail from '../payday/PaydayRail.svelte';
	import { isCurrent, NAV_ITEMS } from './nav-items.ts';

	let {
		version,
		paydays = [],
		collapsed = $bindable(false)
	}: {
		version: string;
		paydays?: Payday[];
		collapsed?: boolean;
	} = $props();

	// Toggle bindable state directly — context callbacks are flaky in Firefox/Zen.
	function onCollapseClick(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		collapsed = !collapsed;
	}
</script>

<nav class="nav" class:collapsed data-collapsed={collapsed ? 'true' : 'false'} aria-label="Main">
	<div class="brand-row">
		<a class="brand" href="/" aria-label="Kinsena home">
			<span class="brand-mark"><Logo size={36} /></span>
			<span class="brand-name">Kinsena</span>
		</a>
		<button
			type="button"
			class="collapse-btn"
			data-testid="sidebar-toggle"
			aria-label={collapsed ? 'Open sidebar' : 'Close sidebar'}
			aria-pressed={collapsed}
			onclick={onCollapseClick}
		>
			<span class="collapse-icon" aria-hidden="true">
				<Icon name="panelLeft" size={18} stroke={1.75} />
			</span>
			<span class="collapse-tip" aria-hidden="true"
				>{collapsed ? 'Open sidebar' : 'Close sidebar'}</span
			>
		</button>
	</div>
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
		<span
			>Shortcuts: <kbd class="kbd">n</kbd> add, <kbd class="kbd">i</kbd> salary in,
			<kbd class="kbd">[</kbd> rail</span
		>
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
		border-radius: 999px;
		color: rgb(255 255 255 / 0.7);
		font-size: var(--text-xs);
		font-weight: 650;
		transition:
			color 150ms ease-out,
			background-color 150ms ease-out,
			transform 200ms ease-out;
	}

	li a:active {
		transform: scale(0.95);
	}

	li a[aria-current='page'] {
		color: #e5c98b;
		background: #1e1c18;
	}

	.label {
		white-space: nowrap;
		overflow: hidden;
	}

	.icon {
		display: grid;
	}

	.brand-row,
	.brand,
	.brand-name,
	.collapse-btn,
	.shortcut,
	.foot,
	.paydays-nested,
	.paydays-rail {
		display: none;
	}

	@media (hover: hover) {
		li a:hover {
			color: #fff;
			background: rgb(255 255 255 / 0.06);
		}

		li a[aria-current='page']:hover {
			color: #e5c98b;
			background: #1e1c18;
		}
	}

	/* Tablet + desktop-collapsed: slim icon rail; payday cycles after Settings */
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
			gap: var(--space-3);
			/* Visible on both axes — any non-visible axis would clip the tip. */
			overflow: visible;
			transition: width var(--duration-collapse) var(--ease-collapse);
		}

		.brand-row {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 100%;
			padding: var(--space-1) 0 var(--space-2);
		}

		.brand {
			display: flex;
			justify-content: center;
			align-items: center;
		}

		.brand-mark {
			display: grid;
			place-items: center;
			width: 36px;
			height: 36px;
			border-radius: var(--radius-sm);
			background: #1e1c18;
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
			flex: 1;
			min-height: 0;
			overflow-x: hidden;
			overflow-y: auto;
		}

		/* Stacked rail: rounded-2xl — rounded-full becomes a giant circle. */
		li a {
			width: 3.5rem;
			min-height: 56px;
			margin: 0;
			padding: 0.625rem 0;
			gap: 4px;
			border-radius: 1rem;
			font-size: 11px;
			font-weight: 600;
		}

		.paydays-rail {
			display: block;
			width: 100%;
			margin-top: var(--space-3);
		}
	}

	/* Desktop expanded: full sidebar; paydays nested under Active */
	@media (min-width: 1100px) {
		.nav:not(.collapsed) {
			width: var(--sidebar-width);
			max-width: 350px;
			align-items: stretch;
			padding: var(--space-6) var(--space-4);
			gap: var(--space-6);
			overflow: visible;
		}

		.nav:not(.collapsed) .brand-row {
			position: relative;
			z-index: 4;
			justify-content: space-between;
			gap: var(--space-2);
			padding: 0 var(--space-3);
			overflow: visible;
		}

		.nav:not(.collapsed) .brand {
			flex: 1;
			justify-content: flex-start;
			gap: var(--space-3);
			min-width: 0;
		}

		.nav:not(.collapsed) .brand-mark {
			background: transparent;
			width: auto;
			height: auto;
			border-radius: 0;
		}

		.nav:not(.collapsed) .brand-name {
			display: inline;
			color: var(--text);
			font-size: var(--text-xl);
			font-weight: 800;
			letter-spacing: -0.02em;
			white-space: nowrap;
			overflow: hidden;
			opacity: 1;
			transition: opacity 150ms ease-out;
		}

		.collapse-btn {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			position: relative;
			z-index: 3;
			flex-shrink: 0;
			width: 36px;
			height: 36px;
			padding: 0;
			border: 0;
			border-radius: 999px;
			background: transparent;
			color: rgb(255 255 255 / 0.6);
			line-height: 0;
			cursor: pointer;
			pointer-events: auto;
			transition:
				color 150ms ease-out,
				background-color 150ms ease-out,
				transform 150ms ease-out;
		}

		.collapse-icon {
			display: flex;
			align-items: center;
			justify-content: center;
			line-height: 0;
			pointer-events: none;
		}

		.collapse-btn :global(svg) {
			display: block;
			width: 18px;
			height: 18px;
			margin: 0;
			padding: 0;
			pointer-events: none;
		}

		.collapse-tip {
			pointer-events: none;
			position: absolute;
			top: calc(100% + 0.5rem);
			right: 0;
			z-index: 50;
			scale: 0.95;
			opacity: 0;
			padding: 0.375rem 0.75rem;
			border-radius: 999px;
			background: #e8e6e1;
			color: #141310;
			font-size: var(--text-xs);
			font-weight: 600;
			line-height: 1.2;
			white-space: nowrap;
			/* Flat: no shadow — invariant beats Gemini shadow-md. */
			transition:
				opacity 150ms ease-out,
				scale 150ms ease-out;
			transition-delay: 0ms;
		}

		.collapse-btn:hover .collapse-tip,
		.collapse-btn:focus-visible .collapse-tip {
			opacity: 1;
			scale: 1;
			transition-delay: 150ms;
		}

		.collapse-btn:active {
			transform: scale(0.95);
			background: rgb(255 255 255 / 0.12);
		}

		.nav:not(.collapsed) ul {
			width: 100%;
			gap: var(--space-1);
			align-items: stretch;
		}

		.nav:not(.collapsed) li {
			width: 100%;
		}

		.nav:not(.collapsed) li a {
			width: 100%;
			box-sizing: border-box;
			min-height: auto;
			flex-direction: row;
			align-items: center;
			justify-content: flex-start;
			gap: 0.875rem;
			margin: 0;
			padding: 0.625rem 0.875rem;
			border-radius: 999px;
			font-size: var(--text-sm);
			font-weight: 650;
		}

		.nav:not(.collapsed) .shortcut {
			display: inline;
			margin-left: auto;
			opacity: 0;
			transition: opacity var(--duration-fast);
		}

		.nav:not(.collapsed) li a:hover .shortcut,
		.nav:not(.collapsed) li a:focus-visible .shortcut {
			opacity: 1;
		}

		.nav:not(.collapsed) .paydays-rail {
			display: none;
		}

		.nav:not(.collapsed) .paydays-nested {
			display: flex;
			flex-direction: column;
			gap: 0.375rem;
			box-sizing: border-box;
			min-width: 0;
			width: calc(100% - 1.35rem);
			margin: 0.375rem 0 0.375rem 1.35rem;
			padding-left: 0.875rem;
			border-left: 1px solid rgb(255 255 255 / 0.12);
		}

		.nav:not(.collapsed) .foot {
			display: grid;
			gap: var(--space-1);
			margin-top: auto;
			padding: 0 var(--space-3);
			color: #8c8c8c;
			font-size: var(--text-xs);
		}

		/* Desktop collapsed: force rail width (do not rely on :not() fallthrough). */
		.nav.collapsed {
			width: var(--rail-width);
			max-width: var(--rail-width);
			align-items: center;
			padding: var(--space-4) var(--space-2);
			gap: var(--space-3);
			overflow: visible;
		}

		.nav.collapsed .brand-row {
			flex-direction: column;
			gap: var(--space-1);
			padding: var(--space-1) 0 var(--space-2);
		}

		.nav.collapsed .brand-name {
			opacity: 0;
		}

		/* Collapsed: tip to the right of the toggle (avoids left-edge / Active clip). */
		.nav.collapsed .collapse-tip {
			top: 50%;
			right: auto;
			left: calc(100% + 0.625rem);
			translate: 0 -50%;
		}

		.nav.collapsed .foot,
		.nav.collapsed .paydays-nested {
			display: none;
		}

		.nav.collapsed .paydays-rail {
			display: block;
		}

		.nav.collapsed ul {
			align-items: center;
		}

		.nav.collapsed li a {
			width: 3.5rem;
			min-height: 56px;
			flex-direction: column;
			justify-content: center;
			gap: 4px;
			padding: 0.625rem 0;
			border-radius: 1rem;
			font-size: 11px;
			font-weight: 600;
		}

		.nav.collapsed .shortcut {
			display: none;
		}
	}

	@media (hover: hover) and (min-width: 1100px) {
		.collapse-btn:hover {
			color: #fff;
			background: rgb(255 255 255 / 0.08);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.nav,
		li a,
		.collapse-btn,
		.collapse-tip,
		.brand-name {
			transition: none;
		}

		li a:active,
		.collapse-btn:active {
			transform: none;
		}
	}
</style>
