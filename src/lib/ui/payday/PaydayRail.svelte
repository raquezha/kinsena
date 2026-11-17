<script lang="ts">
	import { page } from '$app/state';
	import { paydayHref } from '../../client/sheet-route.ts';
	import { isReceived, type Payday } from '../../domain/models.ts';
	import { formatShortDate } from '../checklist/dates.ts';

	let {
		paydays,
		variant = 'rail'
	}: {
		paydays: Payday[];
		variant?: 'rail' | 'nested';
	} = $props();

	const activeId = $derived(Number(page.url.searchParams.get('p')) || paydays[0]?.id);

	function statusLabel(payday: Payday): string {
		if (isReceived(payday)) return 'Received';
		if (payday.payDate !== payday.scheduledDate)
			return `Arrives ${formatShortDate(payday.payDate)}`;
		return 'Upcoming';
	}
</script>

{#if paydays.length > 0}
	<nav class="paydays" class:nested={variant === 'nested'} aria-label="Paydays">
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
						<span class="day">{formatShortDate(payday.scheduledDate)}</span>
						<span class="payday-title">{payday.title}</span>
						<span class="status"
							><span class="dot" aria-hidden="true">·</span> {statusLabel(payday)}</span
						>
					</a>
				</li>
			{/each}
		</ul>
	</nav>
{/if}

<style>
	.paydays {
		display: block;
		width: 100%;
		min-width: 0;
		box-sizing: border-box;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--space-1);
		min-width: 0;
	}

	li {
		min-width: 0;
	}

	a {
		text-decoration: none;
		color: inherit;
	}

	.payday-title,
	.status {
		display: none;
	}

	/* Tablet rail: short cycle labels, flat capsules, no section header */
	.payday {
		display: grid;
		place-items: center;
		width: 64px;
		min-height: 36px;
		margin: 0 auto;
		padding: var(--space-1) var(--space-2);
		border-radius: 999px;
		border: 0;
		outline: 0;
		box-shadow: none;
		background: transparent;
		color: #8c8c8c;
		font-size: var(--text-xs);
		font-weight: 700;
		letter-spacing: -0.01em;
		text-align: center;
		transition:
			color var(--duration-base) var(--ease-out),
			background-color var(--duration-base) var(--ease-out);
	}

	.payday.current {
		background: #1e1c18;
		color: #e5c98b;
	}

	@media (hover: hover) {
		.payday:hover {
			color: #d4d4d4;
			background: rgb(255 255 255 / 0.03);
		}

		.payday.current:hover {
			color: #e5c98b;
			background: #1e1c18;
		}
	}

	/*
	 * Nested under Active: class-driven (not viewport media) so SSR + hydration
	 * always paint the same tree pills — no border/line flash after mount.
	 */
	.nested ul {
		gap: 0.375rem;
	}

	.nested .payday {
		width: 100%;
		max-width: 100%;
		min-width: 0;
		box-sizing: border-box;
		overflow: hidden;
		min-height: auto;
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		align-items: center;
		justify-content: flex-start;
		gap: 0.375rem;
		margin: 0;
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-sm);
		border: 1px solid rgb(255 255 255 / 0.06);
		background: transparent;
		color: #a3a3a3;
		font-size: var(--text-xs);
		text-align: left;
		white-space: nowrap;
	}

	.nested .day {
		display: none;
	}

	.nested .payday-title,
	.nested .status {
		display: inline;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.nested .payday-title {
		font-size: var(--text-xs);
		font-weight: 700;
		line-height: 1.3;
		color: #a3a3a3;
		flex: 0 1 auto;
		min-width: 0;
	}

	.nested .status {
		/* #8c8c8c clears WCAG AA on #12110e; white/40 was 3.81:1 */
		color: #8c8c8c;
		font-size: var(--text-xs);
		font-weight: 600;
		line-height: 1.3;
		flex: 1 1 auto;
		min-width: 0;
	}

	.nested .dot {
		margin: 0;
	}

	.nested .payday.current {
		background: #1c1c1c;
		border-color: rgb(255 255 255 / 0.14);
		color: #e5c98b;
	}

	.nested .payday.current .payday-title {
		color: #e5c98b;
	}

	.nested .payday.current .status {
		color: #8c8c8c;
	}

	@media (hover: hover) {
		.nested .payday:hover {
			color: rgb(255 255 255 / 0.85);
			background: rgb(255 255 255 / 0.03);
		}

		.nested .payday:hover .payday-title {
			color: rgb(255 255 255 / 0.85);
		}

		.nested .payday.current:hover {
			background: #1c1c1c;
			color: #e5c98b;
		}

		.nested .payday.current:hover .payday-title {
			color: #e5c98b;
		}
	}
</style>
