<script lang="ts">
import { defineComponent } from 'vue';
import Vue3RecyclerView from '@/vue3-recycler-view.vue';

export default defineComponent({
  name: 'ServeDev',
  components: {
    Vue3RecyclerView
  }
});
</script>

<template>
  <div id="app">
    <vue3-recycler-view />
  </div>
</template>
