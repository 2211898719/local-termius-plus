<template>
  <div class="settings-section">
    <div class="settings-content">
      <UpdateManager />
    </div>
  </div>
</template>

<script setup lang="ts">
import UpdateManager from './UpdateManager.vue'
</script>

<style scoped>
.settings-section {
  padding: 16px;
}
.settings-content {
  padding: 0;
}
</style>

