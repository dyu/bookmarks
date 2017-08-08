import { component } from 'vuets'

import { PojoState } from 'coreds/lib/types'
import { extractMsg } from 'coreds/lib/util'
import { user } from '../../g/user/'

import { default as BookmarkTagPageV } from './BookmarkTagPage'
import { default as BookmarkEntryPageV } from './BookmarkEntryPage'
import { default as BookmarkEntryListV } from './BookmarkEntryList'

export class HomePage {
    backup_enabled = true
    backup_msg = ''
    backup_state = 0

    backup$$S(data: any) {
        this.backup_state = PojoState.SUCCESS
        this.backup_msg = `Backup successful: ${data['1']}`
    }
    backup$$F(err: any) {
        this.backup_state = PojoState.ERROR
        this.backup_msg = extractMsg(err)
    }
    backup$$() {
        this.backup_state = PojoState.LOADING
        this.backup_msg = ''

        user.ForUser.backup().then(this.backup$$S).then(undefined, this.backup$$F)
    }

    static mounted(self: HomePage) {
        self.backup_enabled = !window['hide_backup']
    }
}
export default component({
    mounted(this: HomePage) { HomePage.mounted(this) },
    components: {
        BookmarkTagPageV,
        BookmarkEntryPageV,
        BookmarkEntryListV
    },
    template: /**/`
<div class="container-full-width">
<div class="row">
  <div class="col-pl-100 col-tp-50 col-tl-66">
    <BookmarkEntryPageV />
    <BookmarkEntryListV :opts="{ title: 'BookmarksByTag' }" />
  </div>
  <div class="col-pl-100 col-tp-50 col-tl-33">
    <BookmarkTagPageV ref="tag_v" />
  </div>
  <div v-if="backup_enabled" style="position:fixed; top:0; right:0">
    <i style="margin-right:-5px" class="icon ellipsis-vert" v-toggle="'.1'"></i>
    <div class="dropdown pull-right">
      <ul class="dropdown-menu mhalf">
        <div :class="'ui message status-' + (backup_state & ${PojoState.MASK_STATUS})" 
            v-show="backup_msg">
          <i class="icon close" @click.prevent="backup_msg = null"></i>
          <span v-text="backup_msg"></span>
        </div>
        <li v-show="!(backup_state & ${PojoState.LOADING})">
          <a @click.prevent="backup$$">backup</a>
        </li>
      </ul>
    </div>
  </div>
</div>
</div>`/**/
}, HomePage)
