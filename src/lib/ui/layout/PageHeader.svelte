<script lang="ts">
	import type { Snippet } from 'svelte';

	let { title, description, actions }: { title: string; description?: string; actions?: Snippet } =
		$props();
</script>

<header class="page-header">
	<div>
		<h1>{title}</h1>
		{#if description}<p>{description}</p>{/if}
	</div>
	{#if actions}<div class="actions">{@render actions()}</div>{/if}
</header>

<style>
	.page-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-4);
		margin-bottom: var(--space-6);
	}

	h1 {
		font-size: 1.75rem;
		font-weight: 800;
		letter-spacing: -0.02em;
	}

	p {
		margin-top: var(--space-1);
		color: var(--text-muted);
		max-width: 60ch;
	}

	.actions {
		flex: none;
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: var(--space-2);
	}

	@media (max-width: 639.98px) {
		.page-header {
			flex-direction: column;
			align-items: stretch;
		}

		.actions {
			justify-content: flex-start;
		}
	}
</style>
