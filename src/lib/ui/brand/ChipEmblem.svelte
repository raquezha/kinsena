<!-- Four-block K pads in jeepney primaries, used as a small ornament. -->
<span class="chip" aria-hidden="true">
	<span></span><span></span><span></span><span></span>
</span>

<style>
	.chip {
		width: 34px;
		height: 27px;
		flex: none;
		display: grid;
		grid-template: 1fr 1fr / 1fr 1fr;
		gap: 2px;
		padding: 3px;
		border-radius: 4px;
		border: 2px solid var(--chrome);
		background: var(--surface-sunken);
	}

	span span:nth-child(1) {
		background: var(--brand-red);
	}

	span span:nth-child(2) {
		background: var(--accent);
		border-radius: 0 3px 0 0;
	}

	span span:nth-child(3) {
		background: var(--brand-green);
	}

	span span:nth-child(4) {
		background: var(--brand-blue);
		border-radius: 0 0 0 3px;
	}
</style>
