<template>
<div style="padding: 0 0.5em">
  <div id="popup" class="popup">&nbsp;</div>
  <div style="display:none">
    <Suggest />
  </div>
  <Home />
</div>
</template>
<script>
import Suggest from 'coreds-ui/lib/c/suggest'
import Home from './view'
export default {
  data() {
    return {}
  },
  components: {
    Suggest,
    Home
  }
}
</script>
