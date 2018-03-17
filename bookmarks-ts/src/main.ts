declare function require(path: string): any;

// ==================================================

import { setNextTick } from 'coreds/lib/util'
import * as Vue from 'vue'
import { TARGET, filters } from './util'

setNextTick(Vue.nextTick)

//import { registerDefaults } from 'coreds-ui/lib/screen_util'
//registerDefaults()

// global filters
for (var i of Object.keys(filters)) Vue.filter(i, filters[i])

// directives
Vue.directive('append', require('coreds-ui/lib/d2/append'))
//Vue.directive('appendto', require('coreds-ui/lib/d2/appendto'))
Vue.directive('clear', require('coreds-ui/lib/d2/clear'))
//Vue.directive('close', require('coreds-ui/lib/d2/close'))
Vue.directive('defp', require('coreds-ui/lib/d2/defp'))
Vue.directive('dpicker', require('coreds-ui/lib/d2/dpicker'))
Vue.directive('lsearch', require('coreds-ui/lib/d2/lsearch'))
Vue.directive('pager', require('coreds-ui/lib/d2/pager'))
//Vue.directive('rappendto', require('coreds-ui/lib/d2/rappendto'))
//Vue.directive('rclass', require('coreds-ui/lib/d2/rclass'))
Vue.directive('suggest', require('coreds-ui/lib/d2/suggest'))
Vue.directive('sval', require('coreds-ui/lib/d2/sval'))
Vue.directive('toggle', require('coreds-ui/lib/d2/toggle'))
//Vue.directive('itoggle', require('coreds-ui/lib/d2/itoggle'))

let app = require('./App.vue')
new Vue(app).$mount(document.getElementById(TARGET) as any)
