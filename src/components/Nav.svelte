<script>
 	export let segment, state;
	function toggleAside(event){
    if(window.innerWidth<=750){
      state = !state;
      document.querySelector('.sidenav').classList.toggle('active');
      document.querySelector('body').classList.toggle('noscroll');
      if(state){
        document.querySelector('header img').src = './wcruz.svg';
      } else {
        document.querySelector('header img').src = './logo.svg';
      }	
    }
  }
</script>

<style>
  a, img {
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    -o-user-select: none;
    user-select: none;
  }
  a img:nth-child(1) {
    margin-right: 10px;
  }
  img {
    width: 2em;
  }
  p {
    font-size: 1.5em;
  }
  li a {
    display: flex;
    align-items: center;
  }
  /* Give every child element its grid name */
  .header {
    grid-area: header;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    background-color: #fff;
  }
  .sidenav {
    grid-area: sidenav;
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 240px;
    position: fixed;
    overflow-y: auto;
    transform: translateX(-245px);
    transition: all .6s ease-in-out;
    box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.16), 0 0 0 1px rgba(0, 0, 0, 0.08);
    z-index: 2; /* Needs to sit above the hamburger menu icon */
    background-color: #00171f;
    justify-content: center;
    overscroll-behavior: contain;
    overflow: auto;
    scrollbar-width: none;
  }
  .sidenav::-webkit-scrollbar { /* WebKit */
    width: 0;
    height: 0;
  }
  .sidenav.active {
    transform: translateX(0);
  }
  .sidenav__list {
    padding: 0;
    list-style-type: none;
  }
  .sidenav__list-item {
    display: flex;
    align-items: center;
    padding: 20px 20px 20px 40px;
    white-space: pre;
    color: #eee;
  }
  .sidenav__list-item:hover {
    background-color: rgba(255, 255, 255, 0.2);
    cursor: pointer;
  }
  /* Non-mobile styles, 750px breakpoint */
  @media only screen and (min-width: 46.875em) {
    .sidenav {
      position: relative;
      transform: translateX(0);
    }
  }
</style>
  
<header class="header">
  <p>Bitácora del cascarón</p>
  <img src="./logo.svg" alt="Φ" on:click={toggleAside}>
</header>
<aside class="{false ? 'sidenav.active' : 'sidenav'}">
	<ul class="sidenav__list" on:click={toggleAside}>
    <li class="sidenav__list-item">
      <a rel="prefetch" href="about">Apropos</a>
    </li>
    <li class="sidenav__list-item">
      <a rel="prefetch" href="blog">Brief</a>
    </li>
		<li class="sidenav__list-item">
      <a rel="prefetch" href="/">Index</a>
    </li>
    <li class="sidenav__list-item">
      <a rel="prefetch" href="i18n">Region</a>
    </li>
		<li class="sidenav__list-item">
      <a rel="prefetch" href="search">Search</a>
    </li>
	</ul>
</aside>