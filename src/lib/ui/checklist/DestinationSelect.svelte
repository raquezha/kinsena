<script lang="ts">
	import { DESTINATION_KIND_LABELS } from '../../domain/destination.ts';
	import type { Destination } from '../../domain/models.ts';

	let {
		destinations,
		value = null,
		name = 'destinationId'
	}: {
		destinations: Destination[];
		value?: number | null;
		name?: string;
	} = $props();
</script>

<label class="field">
	<span>Destination</span>
	<select class="input" {name}>
		<option value="" selected={value === null}>None yet</option>
		{#each destinations as destination (destination.id)}
			<option value={destination.id} selected={destination.id === value}>
				{destination.name} · {DESTINATION_KIND_LABELS[destination.kind]}
			</option>
		{/each}
	</select>
	<small>An account to transfer to, or the biller you will pay.</small>
</label>
