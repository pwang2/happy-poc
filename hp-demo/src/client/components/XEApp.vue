<template>
<div class="app-wrap up-ds-theme up-ds-theme--dark up-ds-type up-ds-type--regular-text-xs">
  <main>
    <slot></slot>
  </main>
  <slot name="footer">
    <footer>&copy;  All rights reserved.</footer>
  </slot>
</div>
</template>

<script>
export default {
  name: 'xe-app',
  data() {
    return { currentYear: new Date().getFullYear() }
  }
}
</script>

<style>
.app-wrap {
  min-height: 100vh;
}
body {
  margin: 0;
  padding: 0;
  background-color: #fff;
}
footer {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ccc;
}
</style>
