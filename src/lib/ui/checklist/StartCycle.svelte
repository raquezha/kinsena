<script lang="ts">
	import { enhance } from '$app/forms';
	import { fly } from 'svelte/transition';
	import { FormState } from '../../client/form-state.svelte.ts';
	import { CADENCE_LABELS, CADENCES } from '../../domain/cadence.ts';
	import Logo from '../brand/Logo.svelte';

	let { savedCount }: { savedCount: number } = $props();
	const form = new FormState();
</script>

<section class="start card" in:fly={{ y: 12, duration: 360 }}>
	<Logo size={56} animate />
	<h1>Start a payday</h1>
	<p class="lead">
		{#if savedCount > 0}
			{savedCount} saved {savedCount === 1 ? 'item' : 'items'} will be copied into the new checklist.
		{:else}
			No saved items yet. Start empty, or add recurring ones under <a href="/defaults">Defaults</a>.
		{/if}
	</p>
	<form method="POST" action="?/start" class="stack" use:enhance={form.enhance({ close: false })}>
		<label class="field">
			<span>Title</span>
			<input class="input" name="title" maxlength="128" placeholder="e.g. November 15" />
			<small>Leave blank to use today's date.</small>
		</label>
		<fieldset class="field">
			<legend>Which payday?</legend>
			<div class="segmented">
				{#each CADENCES as cadence (cadence)}
					<label>
						<input type="radio" name="cadence" value={cadence} checked={cadence === 'ANY'} />
						<span>{CADENCE_LABELS[cadence]}</span>
					</label>
				{/each}
			</div>
		</fieldset>
		<label class="field">
			<span>Salary <em>(optional)</em></span>
			<input class="input money" name="salary" inputmode="decimal" autocomplete="off" />
		</label>
		{#if form.error}<p class="form-error" role="alert">{form.error}</p>{/if}
		<button class="button primary block" type="submit" disabled={form.busy}>Start cycle</button>
	</form>
</section>

<style>
	.start {
		max-width: 520px;
		margin: var(--space-6) auto 0;
		display: grid;
		gap: var(--space-3);
		padding: var(--space-8) var(--space-6);
	}

	h1 {
		margin-top: var(--space-2);
		font-size: 1.6rem;
		font-weight: 800;
		letter-spacing: -0.02em;
	}

	.lead {
		color: var(--text-muted);
		margin-bottom: var(--space-3);
	}

	em {
		color: var(--text-dim);
		font-style: normal;
		font-weight: 500;
	}

	fieldset {
		border: 0;
		margin: 0;
		padding: 0;
	}

	legend {
		margin-bottom: var(--space-2);
		font-size: var(--text-sm);
		font-weight: 600;
		color: var(--text-muted);
	}

	.segmented {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-1);
		padding: var(--space-1);
		border-radius: var(--radius-md);
		background: var(--surface-sunken);
		border: 1px solid var(--border);
	}

	.segmented label {
		position: relative;
	}

	.segmented input {
		position: absolute;
		opacity: 0;
		inset: 0;
	}

	.segmented span {
		display: grid;
		place-items: center;
		min-height: 42px;
		padding: 0 var(--space-2);
		border-radius: var(--radius-sm);
		color: var(--text-muted);
		font-size: var(--text-sm);
		font-weight: 650;
		text-align: center;
		transition:
			background var(--duration-base),
			color var(--duration-base);
	}

	.segmented input:checked + span {
		background: var(--accent);
		color: var(--accent-ink);
	}

	.segmented input:focus-visible + span {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
</style>
