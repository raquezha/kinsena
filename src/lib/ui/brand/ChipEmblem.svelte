<!-- The wallet card's EMV chip: a stealth titanium carrier with the four-block K as gold pads. -->
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
		padding: 2.5px;
		border-radius: 6px;
		border: 1px solid rgb(223 198 153 / 0.35);
		background: linear-gradient(135deg, #1c221e, #0c0f0d);
		box-shadow:
			inset 0 1px 1px rgb(255 255 255 / 0.1),
			0 2px 6px rgb(0 0 0 / 0.6);
	}

	span span {
		background: linear-gradient(135deg, #fff2db, #d8b370 45%, #9b7636);
		box-shadow: 0 1px 2px rgb(0 0 0 / 0.4);
	}

	span span:nth-child(2) {
		border-radius: 4px 0 4px 4px;
	}

	span span:nth-child(4) {
		border-radius: 4px 4px 0 4px;
	}
</style>
