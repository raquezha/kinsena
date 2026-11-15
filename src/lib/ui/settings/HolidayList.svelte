<script lang="ts">
	import { enhance } from '$app/forms';
	import { FormState } from '../../client/form-state.svelte.ts';
	import { formatPaydayTitle } from '../../domain/calendar.ts';
	import type { Holiday } from '../../domain/models.ts';
	import { HOLIDAY_KINDS } from '../../domain/pay-rule.ts';
	import ChoiceGroup from '../forms/ChoiceGroup.svelte';

	let { holidays }: { holidays: Holiday[] } = $props();

	const add = new FormState();
	const grouped = $derived.by(() => {
		const years = [...new Set(holidays.map((holiday) => Number(holiday.date.slice(0, 4))))].sort(
			(left, right) => left - right
		);
		return years.map((year) => ({
			year,
			rows: holidays.filter((holiday) => Number(holiday.date.slice(0, 4)) === year)
		}));
	});
</script>

<section class="card">
	<h2>Holidays</h2>
	<p class="hint">
		National holidays for 2026 and 2027 are from official proclamations. Add local holidays, or
		Eid'l Fitr and Eid'l Adha once they are declared. Special working days such as EDSA are not
		listed — salary can still arrive then.
	</p>

	<form
		method="POST"
		action="?/addHoliday"
		class="add"
		use:enhance={add.enhance({ close: false, success: 'Holiday added' })}
	>
		<label class="field">
			<span>Date</span>
			<input class="input" type="date" name="date" required />
		</label>
		<label class="field">
			<span>Name</span>
			<input class="input" name="name" maxlength="128" required />
		</label>
		<ChoiceGroup
			name="kind"
			legend="Kind"
			value="LOCAL"
			options={HOLIDAY_KINDS.map((kind) => ({
				value: kind,
				label: kind === 'LOCAL' ? 'Local' : 'National'
			}))}
		/>
		<button class="button primary" type="submit" disabled={add.busy}>Add holiday</button>
		{#if add.error}<p class="form-error" role="alert">{add.error}</p>{/if}
	</form>

	{#each grouped as group (group.year)}
		<h3>{group.year}</h3>
		<ul>
			{#each group.rows as holiday (holiday.id)}
				<li>
					<div>
						<p class="date">{formatPaydayTitle(holiday.date)}</p>
						<p class="name">
							{holiday.name}
							<span class="kind">{holiday.kind === 'LOCAL' ? 'Local' : 'National'}</span>
						</p>
					</div>
					<form
						method="POST"
						action="?/removeHoliday"
						use:enhance={add.enhance({ close: false, success: 'Holiday removed' })}
					>
						<input type="hidden" name="id" value={holiday.id} />
						<button class="button" type="submit">Remove</button>
					</form>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="hint">No holidays yet.</p>
	{/each}
</section>

<style>
	h2 {
		font-size: 1.45rem;
		margin-bottom: var(--space-3);
	}

	h3 {
		font-size: var(--text-md);
		margin: var(--space-6) 0 var(--space-3);
		color: var(--text-muted);
	}

	.hint {
		color: var(--text-muted);
		font-size: var(--text-sm);
		margin-bottom: var(--space-4);
		line-height: var(--line);
	}

	.add {
		display: grid;
		gap: var(--space-4);
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--space-2);
	}

	li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		padding: var(--space-3) 0;
		border-top: 1px solid var(--border-subtle);
	}

	.date {
		font-weight: 700;
	}

	.name {
		color: var(--text-muted);
		font-size: var(--text-sm);
	}

	.kind {
		margin-left: var(--space-1);
		font-size: var(--text-xs);
		font-weight: 600;
		color: var(--text-dim);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	@media (min-width: 640px) {
		.add {
			grid-template-columns: 10rem 1fr auto;
			align-items: end;
		}

		.add :global(.choice-group) {
			grid-column: 1 / -1;
		}

		.add .form-error {
			grid-column: 1 / -1;
		}
	}
</style>
