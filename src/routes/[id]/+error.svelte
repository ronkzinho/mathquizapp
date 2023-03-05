<script lang="ts">
  import { page } from '$app/stores';
  import '@/global.css';
</script>

<h1 style="font-size: 32px;">{$page.error?.message}</h1>
