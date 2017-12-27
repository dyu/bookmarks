import { component } from 'vuets'
import { defg, defp, nullp, setp } from 'coreds/lib/util'
import { Pager, ItemSO, SelectionFlags, PojoState } from 'coreds/lib/types'
import { PojoStore, shallowCopyTo } from 'coreds/lib/pstore/'
import * as prk from 'coreds/lib/prk'
import * as ui from '../ui/'
import * as msg from 'coreds-ui/lib/msg'
import { MAX_TAGS, mapId } from './context'
import { merge_fn, onUpdate, Item, View, $list } from './BookmarkEntryBase'
import { user } from '../../g/user/'
const $ = user.BookmarkEntry

const PAGE_SIZE = 10,
    MULTIPLIER = 3

export class BookmarkEntryByTag extends View {
    tags = [] as user.BookmarkTag.M[]
    tag_new = setp(setp(msg.$new(), 'f', null), 'f$', null)
    
    m = defg(this, 'm', {
        tags: [] as number[]
    })
    constructor() {
        super()
        nullp(this, 'pager')
    }
    
    static created(self: BookmarkEntryByTag) {
        let pstore = defp(self, 'pstore', new PojoStore([], {
            desc: true,
            pageSize: PAGE_SIZE,
            multiplier: MULTIPLIER,
            descriptor: $.$d,
            merge_fn,
            createObservable(so: ItemSO, idx: number) {
                return setp($.$new(''), $.M.$.tags, [])
            },
            onSelect(selected: user.BookmarkEntry, flags: SelectionFlags): number {
                return self.onSelect(selected, flags)
            },
            onUpdate,
            fetch(req: prk.ParamRangeKey, pager: Pager) {
                let p = !self.tags.length ? $.ForUser.listBookmarkEntry(req) : $.ForUser.listBookmarkEntryByTag($.PTags.$new(req, self.m.tags))
                return p.then(self.fetch$$S).then(undefined, self.fetch$$F)
            }
        }))
        self.pager = pstore.pager
    }
    
    fetch$$S(data) {
        this.pstore.cbFetchSuccess(data['1'])
    }
    fetch$$F(err) {
        this.pstore.cbFetchFailed(err)
    }
    
    add_tags(tags: user.BookmarkTag.M[], entries?: user.BookmarkEntry[]) {
        this.tags = tags
        this.m.tags = tags.map(mapId)
        
        let pstore = this.pstore
        if (!entries) {
            pstore.replace([])
            pstore.requestNewer()
        } else {
            pstore.replace(entries)
        }
    }
    
    tag_new$$(fk: string, id: number, message: user.BookmarkTag.M) {
        this['$refs'].tag_new.value = ''
        
        let tags = this.tags
        if (tags.length === MAX_TAGS)
            return false
        
        for (let tag of tags) {
            if (id === tag[user.BookmarkTag.M.$.id]) return false
        }
        
        tags.push(shallowCopyTo({}, message) as user.BookmarkTag.M)
        this.m.tags.push(id)
        
        let pstore = this.pstore
        pstore.replace([])
        pstore.requestNewer()
        return false
    }
    rm_tag(idx: number) {
        let tags = this.tags,
            fetch = tags.length > 1
        
        tags.splice(idx, 1)
        this.m.tags.splice(idx, 1)
        
        let pstore = this.pstore
        pstore.replace([])
        fetch && pstore.requestNewer()
    }
    suggest(ps: any, opts: any) {
        return user.BookmarkTag.$NAME(ps, true)
    }
}
export default component({
    created(this: BookmarkEntryByTag) { BookmarkEntryByTag.created(this) },
    props: { skip_header: { type: Boolean, required: false } },
    components: {
        Item
    },
    template: /**/`
<div v-pager="pager">
<div v-if="!skip_header" class="list-header">
  <div class="right">
    <div class="icon input">
      <i class="icon tags hide-pp"></i>
      <input placeholder="Tag(s)" type="text" ref="tag_new"
          :disabled="tags.length === ${MAX_TAGS} || 0 !== (tag_new.state & ${PojoState.LOADING})"
          v-suggest="{ pojo: tag_new, field: 'f', fetch: suggest, onSelect: tag_new$$, vk: '${user.BookmarkTag.$.id}' }" />
      <div :class="'dropdown' + (!tags.length ? '' : ' active')">
        <ul class="dropdown-menu mhalf pull-right">
          <li v-for="(tag, idx) of tags" class="fluid tag">
            <span :style="{ color: '#' + tag['${user.BookmarkTag.M.$.color}'] }">
              {{ tag['${user.BookmarkTag.M.$.name}'] }}
            </span>
            <i class="icon action close" @click="rm_tag(idx)"></i>
          </li>
        </ul>
      </div>
    </div>
  </div>
  <input type="text" placeholder="BookmarksByTag" ${ui.lsearch_attrs($.$.title)} />
</div>
<div v-show="skip_header || !!pager.size">${ui.pager_controls}</div>
${ui.pager_msg}
${$list('bookmark-entry-by-tag-detail')}
</div>`/**/
}, BookmarkEntryByTag)
