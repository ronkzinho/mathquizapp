<script lang="ts">
  import { env } from '$env/dynamic/public';
  export let { PUBLIC_PROJECT_URL: PROJECT_URL } = env;
  import '@/global.css';
</script>

<iframe
  title="Applab"
  width="392"
  height="620"
  style="border: 0px;"
  src={PROJECT_URL + '/embed'}
/>
