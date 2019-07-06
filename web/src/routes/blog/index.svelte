<script context="module">
	export function preload({ params, query }) {
		return this.fetch(`blog.json`).then(r => r.json()).then(posts => {
			return { posts };
		});
	}
</script>

<script>
	export let posts;
</script>

<style>
	div {
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	ul {
		display: flex;
		list-style: none;
		align-self: normal;
		flex-direction: column;
		margin: 0 0 1em 0;
		line-height: 2;
	}
</style>

<svelte:head>
	<title>Blog</title>
</svelte:head>

<div>
	<ul>
		{#each posts as post}
			<!-- we're using the non-standard `rel=prefetch` attribute to
					tell Sapper to load the data for the page as soon as
					the user hovers over the link or taps it, instead of
					waiting for the 'click' event -->
			<li><a rel="prefetch" href="blog/{post.slug}">{post.title}</a></li>
		{/each}
	</ul>
</div>