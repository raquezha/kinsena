<script lang="ts">
	import { enhance } from '$app/forms';
	import { FormState } from '#lib/client/form-state.svelte.ts';
	import { SHEET_SHORTCUTS, TAB_SHORTCUTS } from '#lib/client/shortcuts.ts';
	import { formatEdit } from '#lib/domain/money.ts';
	import Icon from '#lib/ui/icons/Icon.svelte';
	import PageHeader from '#lib/ui/layout/PageHeader.svelte';
	import CurrencyPicker from '#lib/ui/settings/CurrencyPicker.svelte';
	import HolidayList from '#lib/ui/settings/HolidayList.svelte';
	import PayRuleForm from '#lib/ui/settings/PayRuleForm.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const salaries = new FormState();
	const SHORTCUT_LABELS: Record<string, string> = {
		'/': 'Active',
		'/history': 'History',
		'/defaults': 'Defaults',
		'/settings': 'Settings',
		add: 'Add an item',
		cycle: 'Salary, note and finish',
		receive: 'Salary in'
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

	<PayRuleForm rule={data.settings.payRule} />

	<HolidayList holidays={data.holidays} />

	<section class="card">
		<h2>Default salaries</h2>
		<p class="hint">Copied onto new mid-month and month-end paydays. Leave blank if it varies.</p>
		<form
			method="POST"
			action="?/salaries"
			class="stack"
			use:enhance={salaries.enhance({ close: false, success: 'Default salaries saved' })}
		>
			<label class="field">
				<span>Mid-month</span>
				<input
					class="input money"
					name="midMonth"
					inputmode="decimal"
					autocomplete="off"
					value={data.settings.midMonthSalary === null
						? ''
						: formatEdit(data.settings.midMonthSalary)}
				/>
			</label>
			<label class="field">
				<span>Month-end</span>
				<input
					class="input money"
					name="monthEnd"
					inputmode="decimal"
					autocomplete="off"
					value={data.settings.monthEndSalary === null
						? ''
						: formatEdit(data.settings.monthEndSalary)}
				/>
			</label>
			{#if salaries.error}<p class="form-error" role="alert">{salaries.error}</p>{/if}
			<button class="button primary" type="submit" disabled={salaries.busy}>Save salaries</button>
		</form>
	</section>

	<section class="card shortcuts">
		<h2>Keyboard shortcuts</h2>
		<p class="hint">In an item sheet, F, M, U, and S choose Full, Min, Custom, and Skip.</p>
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
		gap: var(--space-6);
	}

	h2 {
		font-size: 1.45rem;
		margin-bottom: var(--space-3);
	}

	.hint,
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
			grid-template-columns: 1fr 1fr;
			align-items: start;
		}

		.settings > :global(.card:nth-child(2)),
		.settings > :global(.card:nth-child(3)) {
			grid-column: 1 / -1;
		}

		.shortcuts {
			display: block;
		}
	}
</style>
