<template>
<div>
  <home />
</div>
</template>
<script>
import Home from './user/'
var data = { config: null }
export default {
  config(config) {
    data.config = config
  },
  data() {
    return data
  },
  components: {
    Home
  }
}
</script>
<style lang="scss">
@import './app.scss';
</style>

