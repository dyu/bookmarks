<template>
<div class="container-full-width">
  <div id="popup" class="popup">&nbsp;</div>
  <div style="display:none">
    <calendar></calendar>
    <suggest></suggest>
  </div>
  <home></home>
</div>
</template>
<script>
import Suggest from 'vueds-ui/lib/c/suggest'
import Calendar from 'vueds-ui/lib/c/calendar'
import Home from './user/'
export default {
  data() {
    return {}
  },
  components: {
    Suggest,
    Calendar,
    Home
  }
}
</script>
<style lang="scss">
@import './scss/app.scss';
</style>
