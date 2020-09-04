<svelte:head>
	<title>About</title>
</svelte:head>

<div class="container">
	<h2 class="center">
		This site is the result of the integration of various technologies, without them nothing would have been possible...
	</h2>
	<br>
	<br>
	<div class="branding">
		<div>
			<a href="https://svelte.dev">
				<img src="https://svelte.dev/svelte-logo-horizontal.svg" alt="Svelte">
			</a>
			<a href="https://sapper.svelte.dev">
				<img src="https://sapper.svelte.dev/sapper-logo-horizontal.svg" alt="Sapper">
			</a>
		</div>
		<div>
			<a href="https://netlify.com">
				<img src="netlify.svg" alt="Netlify">
			</a>
			<a href="https://openlayers.org">
				<img style="width: auto;" src="openlayers.png" alt="OpenLayers">
			</a>
		</div>
	</div>
	<br>
	<h2 class="center">Feel free to view and redistribute this <a href="https://github.com/fchpr/boiler"><b>project source code.</b></a> Thanks you all!</h2>
</div>

<style>
	.container {
		padding: 2em;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.branding {
		display: flex;
		justify-content: center;
	}

	.branding div {
		text-align: center;
	}

	img {
		width: 25em;
	}

	.center {
		text-align: center;
	}
	h1 {
		text-align: center;
	}
</style>