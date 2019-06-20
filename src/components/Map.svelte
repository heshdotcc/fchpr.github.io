<script>
    import { onMount, afterUpdate } from 'svelte';
    let container, map, mapboxgl, lat=-34.63020489294104, lon=-58.45173159155483, zoom=14.5;
    onMount(async () => {
/* 
		const link = document.createElement('link');
		link.rel = 'stylesheet';
        link.href = 'https://api.tiles.mapbox.com/mapbox-gl-js/v1.0.0/mapbox-gl.css';
 */
        const module = await import('mapbox-gl');
        mapboxgl = module.default;
        mapboxgl.accessToken = 'pk.eyJ1Ijoic2lldGVkb3NmZWRlIiwiYSI6ImNqdzVzb3gwYjEyY3k0NHMwMW9tcjRsNjcifQ.eaOFOH0I1JRVyxmMqfqWNA';
        map = new mapboxgl.Map({
            container,
            style: 'mapbox://styles/mapbox/streets-v9',
            center: [lon, lat],
            zoom
        });
        map.on('mousemove', function (e) {
            console.log(e);
/*             console.log(e.lngLat);
            console.log(e.lngLat); */
        });
    });
</script>

<style>
    @import './mapbox-gl.css';
    .mapboxgl-map {
        width: 100% !important;
        height: 100% !important;
    }
    .mapbox-logo {
        display: none !important;
    }
    .leaflet-bottom, .leaflet-top {
        z-index: 0 !important;
        position: absolute;
        pointer-events: none;
    }
</style>
<!-- 
<svelte:head>
    <link rel='stylesheet' href='https://api.tiles.mapbox.com/mapbox-gl-js/v1.0.0/mapbox-gl.css'/>
</svelte:head>
 -->
<div bind:this={container} class="mapboxgl-map">
    {#if map}
        <slot></slot>
    {/if}
</div>