<template>
<div>
  <div id="popup" class="popup">&nbsp;</div>
  <div style="display:none">
    <Calendar />
    <Suggest />
  </div>
  <Home />
</div>
</template>
<script>
import * as ui from './ui'
import { $customize } from 'coreds-ui/lib/c/suggest'
import Calendar from 'coreds-ui/lib/c/calendar'
import Home from './user/'
export default {
  data() {
    return {}
  },
  components: {
    Suggest: $customize(ui.suggest_controls),
    Calendar,
    Home
  }
}
</script>
