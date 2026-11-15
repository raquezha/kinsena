<script lang="ts">
	import { page } from '$app/state';
	import { paydayHref } from '../../client/sheet-route.ts';
	import { formatRouteSign } from '../../domain/calendar.ts';
	import { isReceived, type Payday } from '../../domain/models.ts';

	let { paydays }: { paydays: Payday[] } = $props();

	const activeId = $derived(Number(page.url.searchParams.get('p')) || paydays[0]?.id);
</script>

{#if paydays.length > 0}
	<div class="paydays">
		<p class="payday-label">Paydays</p>
		<ul>
			{#each paydays as payday (payday.id)}
				<li>
					<a
						class="payday"
						class:current={payday.id === activeId && page.url.pathname === '/'}
						href={paydayHref(payday.id)}
						title={payday.title}
					>
						<span class="day">{formatRouteSign(payday.scheduledDate)}</span>
						<span class="payday-title">{formatRouteSign(payday.scheduledDate)}</span>
						<span class="status">{isReceived(payday) ? 'Received' : 'Upcoming'}</span>
					</a>
				</li>
			{/each}
		</ul>
	</div>
{/if}

<style>
	.paydays {
		display: none;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	a {
		text-decoration: none;
		color: inherit;
	}

	@media (min-width: 640px) {
		.paydays {
			display: block;
			width: 100%;
		}

		.payday-label,
		.payday-title,
		.status {
			display: none;
		}

		.payday {
			display: grid;
			place-items: center;
			width: 64px;
			min-height: 44px;
			margin: 0 auto var(--space-1);
			border-radius: 2px;
			border: 2px solid var(--chrome);
			color: var(--text-muted);
			font-family: var(--font-display);
			font-size: 0.95rem;
			letter-spacing: 0.04em;
			text-transform: uppercase;
			font-weight: 400;
			text-align: center;
		}

		.payday.current {
			background: var(--accent);
			color: var(--accent-ink);
			border-color: var(--accent-ink);
		}

		.payday.current .day,
		.payday.current .status {
			color: var(--accent-ink);
		}
	}

	@media (min-width: 1100px) {
		.payday-label {
			display: block;
			padding: 0 var(--space-3);
			margin-bottom: var(--space-2);
			color: var(--text-dim);
			font-size: var(--text-xs);
			font-weight: 700;
			letter-spacing: 0.08em;
			text-transform: uppercase;
		}

		.payday {
			width: auto;
			min-height: 52px;
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: var(--space-2);
			padding: var(--space-2) var(--space-3);
			text-align: left;
		}

		.day {
			display: none;
		}

		.payday-title,
		.status {
			display: block;
		}

		.payday-title {
			font-size: 1.15rem;
		}

		.status {
			color: var(--text-dim);
			font-family: var(--font-ui);
			font-size: var(--text-xs);
			letter-spacing: 0.04em;
			text-transform: uppercase;
			font-weight: 700;
		}

		.payday.current .status {
			color: var(--accent-ink);
		}
	}
</style>
