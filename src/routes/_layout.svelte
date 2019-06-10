<svelte:head>
	<script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
</svelte:head>

<script>
	import netlifyIdentity from 'netlify-identity-widget';
	import { onMount } from 'svelte';
	import Nav from '../components/Nav.svelte';

	export let segment;

	let currentUser;

	onMount(() => {
		if (window.netlifyIdentity) {
			window.netlifyIdentity.on("init", user => {
				if (!user) {
					window.netlifyIdentity.on("login", () => {
						document.location.href = "/admin/";
					});
				}
			});
		}
	});
</script>

<style>
	nav + main {
		position: relative;
		max-width: 56em;
		background-color: white;
		padding: 2em;
		margin: 0 auto;
		box-sizing: border-box;
	}
</style>

{#if segment !== 'admin'}
<Nav {segment} isAdmin={currentUser && currentUser.admin}/>
{/if}

<main>
	<slot></slot>
</main>
