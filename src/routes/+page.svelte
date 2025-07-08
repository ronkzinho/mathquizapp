<script lang="ts">
  import { env } from '$env/dynamic/public';
  export let { PUBLIC_PROJECT_URL: PROJECT_URL } = env;
</script>

<svelte:head>
  <title>Math Quiz!</title>
</svelte:head>

<div class="homeContainer">
  <a href={PROJECT_URL} class="projectAnchor" target="_blank" rel="noreferrer"
    >code.org</a
  >
  <iframe
    title="Applab"
    width="392"
    height="620"
    style="border: 0px;"
    src={PROJECT_URL + '/embed'}
  ></iframe>
</div>

<p class="madeBy">Feito por Henrique</p>
