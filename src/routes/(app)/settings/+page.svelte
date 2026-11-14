<script lang="ts">
	import { SHEET_SHORTCUTS, TAB_SHORTCUTS } from '#lib/client/shortcuts.ts';
	import Icon from '#lib/ui/icons/Icon.svelte';
	import PageHeader from '#lib/ui/layout/PageHeader.svelte';
	import CurrencyPicker from '#lib/ui/settings/CurrencyPicker.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const SHORTCUT_LABELS: Record<string, string> = {
		'/': 'Active',
		'/history': 'History',
		'/defaults': 'Defaults',
		'/settings': 'Settings',
		add: 'Add an item',
		cycle: 'Salary, note and finish'
	};
	const shortcuts = [
		...Object.entries(TAB_SHORTCUTS),
		...Object.entries(SHEET_SHORTCUTS),
		['Esc', 'close']
	].map(([key, target]) => ({ key, label: SHORTCUT_LABELS[target ?? ''] ?? 'Close a sheet' }));
</script>

<svelte:head>
	<title>Kinsena · Settings</title>
</svelte:head>

<PageHeader title="Settings" />

<div class="settings">
	<section class="card"><CurrencyPicker current={data.currency} /></section>

	<section class="card shortcuts">
		<h2>Keyboard shortcuts</h2>
		<dl>
			{#each shortcuts as shortcut (shortcut.key)}
				<div>
					<dt><kbd class="kbd">{shortcut.key}</kbd></dt>
					<dd>{shortcut.label}</dd>
				</div>
			{/each}
		</dl>
	</section>

	<section class="card about">
		<h2>Kinsena {data.version}</h2>
		<p>One private login. Sessions end after seven days or when the server restarts.</p>
		<form method="POST" action="/logout">
			<button class="button block" type="submit"><Icon name="logout" size={18} /> Log out</button>
		</form>
	</section>
</div>

<style>
	.settings {
		display: grid;
		gap: var(--space-4);
	}

	h2 {
		font-size: var(--text-lg);
		font-weight: 750;
		margin-bottom: var(--space-3);
	}

	.about p {
		color: var(--text-muted);
		font-size: var(--text-sm);
		margin-bottom: var(--space-4);
	}

	dl {
		margin: 0;
		display: grid;
		gap: var(--space-2);
	}

	dl div {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	dt {
		width: 40px;
	}

	dd {
		margin: 0;
		color: var(--text-muted);
	}

	.shortcuts {
		display: none;
	}

	@media (min-width: 1100px) {
		.settings {
			grid-template-columns: 2fr 1fr;
			align-items: start;
		}

		.settings > :first-child {
			grid-row: span 2;
		}

		.shortcuts {
			display: block;
		}
	}
</style>
