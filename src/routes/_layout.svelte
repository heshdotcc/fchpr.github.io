<script>
	import Nav from '../components/Nav.svelte';
	import Main from '../components/Main.svelte';
	import Footer from '../components/Footer.svelte';
	export let segment;
	let state = false;
</script>

<div class="container">
	<Nav {segment} {state}/>
	<Main>
    <slot></slot>
	</Main>
	<Footer/>
</div>

<style>
/* Assign grid instructions to our parent grid container, mobile-first (hide the sidenav) */
.container {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 50px 1fr 50px;
  grid-template-areas:
    'header'
    'main'
    'footer';
  height: 100vh;
}
/* Non-mobile styles, 750px breakpoint */
@media only screen and (min-width: 46.875em) {
  /* Show the sidenav */
  .container {
    grid-template-columns: 240px 1fr;
    grid-template-areas:
      "sidenav header"
      "sidenav main"
      "sidenav footer";
  }
}
</style>