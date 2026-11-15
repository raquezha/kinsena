<script lang="ts">
	import { enhance } from '$app/forms';
	import { FormState } from '#lib/client/form-state.svelte.ts';
	import { formatPaydayTitle } from '#lib/domain/calendar.ts';
	import type { CalendarRow } from '#lib/server/services/schedule-service.ts';
	import PageHeader from '#lib/ui/layout/PageHeader.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const MONTHS = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];

	const overrideForm = new FormState();

	const months = $derived.by(() => {
		const groups: { month: number; label: string; entries: CalendarRow[] }[] = [];
		for (const entry of data.calendar.entries) {
			const current = groups[groups.length - 1];
			if (!current || current.month !== entry.month) {
				groups.push({
					month: entry.month,
					label: `${MONTHS[entry.month - 1]} ${entry.year}`,
					entries: [entry]
				});
			} else {
				current.entries.push(entry);
			}
		}
		return groups;
	});

	const year = $derived(data.calendar.year);
</script>

<svelte:head>
	<title>Kinsena · Pay calendar {year}</title>
</svelte:head>

<PageHeader
	title="Pay calendar"
	description="Full-year schedule from the pay rule. Received and finished paydays stay put."
>
	{#snippet actions()}
		<a class="button" href="/settings">Pay rule</a>
		<nav class="years" aria-label="Year">
			<a class="button" href="/calendar?year={year - 1}" aria-label="Previous year, {year - 1}"
				>{year - 1}</a
			>
			<span class="this-year">{year}</span>
			<a class="button" href="/calendar?year={year + 1}" aria-label="Next year, {year + 1}"
				>{year + 1}</a
			>
		</nav>
	{/snippet}
</PageHeader>

<div class="calendar">
	{#if overrideForm.error}
		<p class="form-error" role="alert">{overrideForm.error}</p>
	{/if}

	{#each months as group (group.label)}
		<section class="card month">
			<h2>{group.label}</h2>
			<ul>
				{#each group.entries as entry (entry.scheduledDate)}
					<li class:locked={entry.locked} class:moved={entry.payDate !== entry.scheduledDate}>
						<div class="when">
							<p class="scheduled">
								Scheduled {formatPaydayTitle(entry.scheduledDate)}
							</p>
							<p class="actual">
								{#if entry.payDate === entry.scheduledDate}
									Arrives on the scheduled day
								{:else}
									Arrives {formatPaydayTitle(entry.payDate)}
								{/if}
							</p>
							{#if entry.reason}
								<p class="reason">{entry.reason}</p>
							{/if}
						</div>
						<div class="status">
							{#if entry.locked}
								<span class="badge locked-badge">Locked</span>
							{:else if entry.overridden}
								<span class="badge override-badge">Adjusted</span>
							{/if}
						</div>
						{#if !entry.locked}
							<form
								method="POST"
								action="?/setOverride"
								class="adjust"
								use:enhance={overrideForm.enhance({ close: false, success: 'Pay date saved' })}
							>
								<input type="hidden" name="scheduledDate" value={entry.scheduledDate} />
								<label class="field">
									<span class="visually-hidden">Actual pay date for {entry.scheduledDate}</span>
									<input class="input" type="date" name="payDate" value={entry.payDate} />
								</label>
								<button class="button" type="submit" disabled={overrideForm.busy}>Save</button>
							</form>
							{#if entry.overridden}
								<form
									method="POST"
									action="?/resetOverride"
									use:enhance={overrideForm.enhance({
										close: false,
										success: 'Pay date reset to the computed day'
									})}
								>
									<input type="hidden" name="scheduledDate" value={entry.scheduledDate} />
									<button class="button" type="submit" disabled={overrideForm.busy}>Reset</button>
								</form>
							{/if}
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>

<style>
	.years {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.this-year {
		font-weight: 700;
		min-width: 3.5rem;
		text-align: center;
	}

	.calendar {
		display: grid;
		gap: var(--space-5);
	}

	h2 {
		font-size: 1.15rem;
		margin-bottom: var(--space-3);
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--space-4);
	}

	li {
		display: grid;
		gap: var(--space-3);
		padding: var(--space-4) 0 0;
		border-top: 1px solid var(--border-subtle);
	}

	li:first-child {
		padding-top: 0;
		border-top: 0;
	}

	.scheduled {
		font-weight: 700;
	}

	.actual {
		margin-top: var(--space-1);
	}

	.reason {
		margin-top: var(--space-1);
		color: var(--notice);
		font-size: var(--text-sm);
		line-height: 1.45;
	}

	.moved .actual {
		color: var(--accent-strong);
		font-weight: 600;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		padding: var(--space-1) var(--space-2);
		border-radius: 999px;
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.locked-badge {
		background: var(--notice-soft);
		color: var(--notice);
	}

	.override-badge {
		background: var(--accent-soft);
		color: var(--accent);
	}

	.adjust {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		align-items: end;
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	@media (min-width: 900px) {
		li {
			grid-template-columns: 1fr auto auto;
			align-items: start;
			gap: var(--space-4);
		}

		.adjust {
			justify-content: end;
		}
	}
</style>
