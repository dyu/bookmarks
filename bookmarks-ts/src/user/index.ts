import { component } from 'vuets'

import { PojoState } from 'vueds/lib/types'
import { extractMsg } from 'vueds/lib/util'
import { user } from '../../g/user/'

import { BookmarkTagView, default as BookmarkTagViewC } from './BookmarkTagView'
import { default as BookmarkEntryViewC } from './BookmarkEntryView'

export class HomePage {
    bookmark_tag_v: BookmarkTagView

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

    static activate(self: HomePage) {
        let bookmark_tag_v = self.bookmark_tag_v || (self.bookmark_tag_v = self['$refs']['bookmark_tag_v'])
        BookmarkTagView.activate(bookmark_tag_v)
    }
}
export default component({
    mounted(this: HomePage) { HomePage.activate(this) },
    components: {
        BookmarkTagViewC,
        BookmarkEntryViewC
    },
    template: /**/`
<div class="row">
  <div class="col-pl-100 col-tp-50 col-tl-66">
    <bookmark-entry-view-c />
  </div>
  <div class="col-pl-100 col-tp-50 col-tl-33">
    <bookmark-tag-view-c ref="bookmark_tag_v" />
  </div>
  <div style="position:fixed; top:0; right:0">
    <i style="margin-right:-5px" class="icon ellipsis-vert" v-toggle="'.1'"></i>
    <div class="dropdown pull-right">
      <ul class="dropdown-menu mhalf">
        <div class="ui message"
            v-show="backup_msg"
            v-pclass:status-="(backup_state & ${PojoState.MASK_STATUS})">
          <i class="icon close" @click.prevent="backup_msg = null"></i>
          <span v-text="backup_msg"></span>
        </div>
        <li v-show="!(backup_state & ${PojoState.LOADING})">
          <a @click.prevent="backup$$">backup</a>
        </li>
      </ul>
    </div>
  </div>
</div>`/**/
}, HomePage)
