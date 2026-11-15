<script lang="ts">
	import { page } from '$app/state';
	import { paydayHref } from '../../client/sheet-route.ts';
	import { isReceived, type Payday } from '../../domain/models.ts';
	import { formatShortDate } from '../checklist/dates.ts';

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
						title={payday.payDate !== payday.scheduledDate
							? `Arrives ${formatShortDate(payday.payDate)} · ${payday.title}`
							: payday.title}
					>
						<span class="day">{formatShortDate(payday.payDate)}</span>
						<span class="payday-title">{payday.title}</span>
						<span class="status">
							{#if isReceived(payday)}
								Received
							{:else if payday.payDate !== payday.scheduledDate}
								Arrives {formatShortDate(payday.payDate)}
							{:else}
								Upcoming
							{/if}
						</span>
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
			border-radius: var(--radius-sm);
			border: 1px solid var(--border);
			color: var(--text-muted);
			font-size: var(--text-xs);
			font-weight: 700;
			text-align: center;
		}

		.payday.current {
			background: var(--accent-soft);
			color: var(--accent);
			border-color: var(--accent);
		}

		.payday.current .day,
		.payday.current .status {
			color: var(--accent);
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
			font-size: var(--text-sm);
		}

		.status {
			color: var(--text-dim);
			font-size: var(--text-xs);
			font-weight: 600;
		}

		.payday.current .status {
			color: var(--accent);
		}
	}
</style>
