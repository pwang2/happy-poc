<template>
  <div>
    <div class="message">\{{message}}</div>
    <div class="prop-message message">\{{pmessage}}</div>
    <h2 :style="{color:loaded?'green':'black'}">
      <span v-text="loaded?'loaded':'loading'"></span> asynchronously from split chunk
    </h2>
    <marquee direction="down" width="250" height="200" behavior="alternate">
    <marquee behavior="alternate">\{{asyncMessage}} </marquee>
    </marquee>
  </div>
</template>

<script>
export default {
  name: 'hello-world',
  props: ['pmessage'],
  data() {
    return {
      message: 'hello world from vue component!',
      asyncMessage: '',
      loaded: false
    }
  },
  created() {
    setTimeout(async () => {
      const { default: codemirror } = await import('codemirror')
      const { version } = codemirror
      this.asyncMessage = `codemirror ${version} loaded`
      this.loaded = true
    }, 1000)
  }
}
</script>

<style>
.message {
  font-size: 20px;
  color: green;
}
</style>
