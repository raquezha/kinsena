<script lang="ts">
	import { enhance } from '$app/forms';
	import { FormState } from '../../client/form-state.svelte.ts';
	import {
		SHIFT_DIRECTIONS,
		WEEKDAY_INDEXES,
		WEEKDAY_LABELS,
		formatDaysOfMonth,
		formatWeekendDays,
		type PayRule,
		type WeekdayIndex
	} from '../../domain/pay-rule.ts';

	let { rule }: { rule: PayRule } = $props();

	const form = new FormState();
	let weekendDraft: WeekdayIndex[] | undefined = $state();
	const weekends = $derived(weekendDraft ?? rule.weekendDays);

	const SHIFT_LABELS = {
		PREVIOUS: 'Previous working day',
		NEXT: 'Next working day'
	} as const;

	function toggleWeekend(day: WeekdayIndex, checked: boolean) {
		const current = weekendDraft ?? [...rule.weekendDays];
		weekendDraft = checked
			? [...new Set([...current, day])].sort((left, right) => left - right)
			: current.filter((entry) => entry !== day);
	}
</script>

<section class="card">
	<h2>Pay rule</h2>
	<p class="hint">
		Salary is scheduled on these days of each month. If a month is shorter than a pay day, the last
		day is used. When that day is non-working, the date shifts to the {SHIFT_LABELS[
			rule.shift
		].toLowerCase()}.
	</p>
	<p class="calendar-link">
		<a href="/calendar">View the full-year pay calendar</a>
	</p>
	<form
		method="POST"
		action="?/payRule"
		class="stack"
		use:enhance={form.enhance({ close: false, success: 'Pay rule saved' })}
	>
		<label class="field">
			<span>Pay days of the month</span>
			<input class="input" name="daysOfMonth" value={formatDaysOfMonth(rule.daysOfMonth)} />
			<span class="help">Two days, for example 15, 30.</span>
		</label>

		<fieldset>
			<legend>When the day is non-working</legend>
			<div class="options">
				{#each SHIFT_DIRECTIONS as direction (direction)}
					<label class="option">
						<input type="radio" name="shift" value={direction} checked={rule.shift === direction} />
						{SHIFT_LABELS[direction]}
					</label>
				{/each}
			</div>
		</fieldset>

		<fieldset>
			<legend>Non-working weekdays</legend>
			<div class="options wrap">
				{#each WEEKDAY_INDEXES as day (day)}
					<label class="option">
						<input
							type="checkbox"
							checked={weekends.includes(day)}
							onchange={(e) => toggleWeekend(day, e.currentTarget.checked)}
						/>
						{WEEKDAY_LABELS[day]}
					</label>
				{/each}
			</div>
			<input type="hidden" name="weekendDays" value={formatWeekendDays(weekends)} />
		</fieldset>

		<fieldset>
			<legend>Holidays that count as non-working</legend>
			<label class="option">
				<input type="hidden" name="includeNationalHolidays" value="false" />
				<input
					type="checkbox"
					name="includeNationalHolidays"
					value="true"
					checked={rule.includeNationalHolidays}
				/>
				National holidays
			</label>
			<label class="option">
				<input type="hidden" name="includeLocalHolidays" value="false" />
				<input
					type="checkbox"
					name="includeLocalHolidays"
					value="true"
					checked={rule.includeLocalHolidays}
				/>
				Local holidays
			</label>
		</fieldset>

		{#if form.error}<p class="form-error" role="alert">{form.error}</p>{/if}
		<button class="button primary" type="submit" disabled={form.busy}>Save pay rule</button>
	</form>
</section>

<style>
	h2 {
		font-size: 1.45rem;
		margin-bottom: var(--space-3);
	}

	.hint,
	.help,
	.calendar-link {
		color: var(--text-muted);
		font-size: var(--text-sm);
	}

	.hint {
		margin-bottom: var(--space-3);
		line-height: 1.55;
	}

	.calendar-link {
		margin-bottom: var(--space-4);
	}

	.help {
		margin-top: var(--space-1);
	}

	fieldset {
		border: 0;
		padding: 0;
		min-width: 0;
	}

	legend {
		font-weight: 600;
		margin-bottom: var(--space-2);
	}

	.options {
		display: grid;
		gap: var(--space-2);
	}

	.options.wrap {
		grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
	}

	.option {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-height: var(--tap);
	}
</style>
