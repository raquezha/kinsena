<script lang="ts">
	import ActiveCycle from '#lib/ui/checklist/ActiveCycle.svelte';
	import StartCycle from '#lib/ui/checklist/StartCycle.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Kinsena · {data.active?.cycle.title ?? 'Active'}</title>
</svelte:head>

{#if data.active}
	{#key data.active.cycle.id}
		<ActiveCycle view={data.active} currency={data.currency} />
	{/key}
{:else}
	<StartCycle savedCount={data.savedCount} />
{/if}
