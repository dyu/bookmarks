import { component } from 'vuets'

import { PojoState } from 'coreds/lib/types'
import { defg, $any, extractMsg } from 'coreds/lib/util'
import { user } from '../g/user/'

import Navigo from 'navigo'

import { BookmarkEntryByTag, default as BookmarkEntryByTagV } from '../src/user/BookmarkEntryByTag'

const HASH = '#'

export class HomePage {
    backup_enabled = true
    backup_msg = ''
    backup_state = 0
    
    m = defg(this, 'm', {
        navigo: null as any,
        bytag: $any(null) as BookmarkEntryByTag
    })
    
    routeHome() {
        this.m.bytag.add_tags([])
    }
    
    routeTags$$S(data) {
        this.m.bytag.add_tags(data['2'], data['1'])
    }
    
    routeTags$$F(err) {
        this.m.bytag.fetch$$F(err)
    }
    
    routeTags(params) {
        let array = [] as string[],
            t4 = params.t4,
            t3 = params.t3,
            t2 = params.t2
        
        array.push(params.t1)
        t2 && array.push(params.t2)
        t3 && array.push(params.t3)
        t4 && array.push(params.t4)
        
        user.BookmarkEntry.ForUser.listBookmarkEntryByTagName({ '1': array })
                .then(this.routeTags$$S).then(undefined, this.routeTags$$F)
    }
    
    newNavigo() {
        return new Navigo(null, true, HASH)
            .on(this.routeHome)
            .on('/:t1', this.routeTags)
            .on('/:t1/:t2', this.routeTags)
            .on('/:t1/:t2/:t3', this.routeTags)
            .on('/:t1/:t2/:t3/:t4', this.routeTags)
    }

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
        let m = self.m
        
        m.bytag = self['$refs'].bytag;
        
        (m.navigo = self.newNavigo()).resolve()
    }
}
export default component({
    mounted(this: HomePage) { HomePage.mounted(this) },
    components: {
        BookmarkEntryByTagV
    },
    template: /**/`
<div>
  <BookmarkEntryByTagV ref="bytag" :skip_tag_input="true" />
  <div v-if="backup_enabled" style="position:fixed; top:0; right:0">
    <i style="margin-right:-5px" class="icon ellipsis-vert" v-toggle="'.1'"></i>
    <div class="dropdown pull-right">
      <ul class="dropdown-menu mhalf">
        <div :class="'ui msg status-' + (backup_state & ${PojoState.MASK_STATUS})" 
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
</div>`/**/
}, HomePage)
