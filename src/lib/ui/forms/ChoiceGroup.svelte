<script lang="ts">
	export type ChoiceOption = { value: string; label: string };

	let {
		name,
		legend,
		value = '',
		options,
		required = false
	}: {
		name: string;
		legend: string;
		value?: string;
		options: readonly ChoiceOption[];
		required?: boolean;
	} = $props();
</script>

<fieldset class="choice-group">
	<legend>{legend}</legend>
	<div class="options" style:--choice-count={options.length}>
		{#each options as option (option.value)}
			<label class="choice">
				<input
					type="radio"
					{name}
					value={option.value}
					checked={option.value === value}
					{required}
				/>
				<span>{option.label}</span>
			</label>
		{/each}
	</div>
</fieldset>

<style>
	.choice-group {
		border: 0;
		margin: 0;
		padding: 0;
		min-width: 0;
	}

	legend {
		font-weight: 600;
		margin-bottom: var(--space-2);
	}

	.options {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 3px;
		padding: 3px;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--surface-sunken);
	}

	.options:has(:nth-child(3):last-child),
	.options:has(:nth-child(2):last-child) {
		grid-template-columns: repeat(var(--choice-count), minmax(0, 1fr));
	}

	@media (min-width: 640px) {
		.options:has(:nth-child(4):last-child) {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}

	.choice {
		position: relative;
		display: grid;
		place-items: center;
		min-height: var(--tap);
		padding: var(--space-2) var(--space-3);
		border-radius: calc(var(--radius-md) - 3px);
		color: var(--text-muted);
		font-size: var(--text-sm);
		font-weight: 700;
		text-align: center;
		line-height: 1.25;
		cursor: pointer;
	}

	.choice input {
		position: absolute;
		opacity: 0;
		inset: 0;
		margin: 0;
		cursor: pointer;
	}

	.choice:has(input:checked) {
		background: var(--accent-soft);
		color: var(--accent-strong);
		box-shadow: inset 0 0 0 1px var(--accent);
	}

	.choice:has(input:focus-visible) {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
</style>
