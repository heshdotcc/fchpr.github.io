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
		currentUser = netlifyIdentity.currentUser();

		netlify.on('login', user => currentUser = user);
		netlify.on('logout', () => currentUser = undefined);
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