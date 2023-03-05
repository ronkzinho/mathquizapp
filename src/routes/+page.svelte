<script lang="ts">
  import { env } from '$env/dynamic/public';
  export let { PUBLIC_PROJECT_URL: PROJECT_URL } = env;
  import '@/global.css';
</script>

<a
  href={PROJECT_URL}
  style="font-size: 3.5vw; margin: 2%; cursor: pointer; color: cornsilk"
  target="_blank"
  rel="noreferrer">Ir para o site do projeto</a
>
<iframe
  title="Applab"
  width="392"
  height="620"
  style="border: 0px;"
  src={PROJECT_URL + '/embed'}
/>
