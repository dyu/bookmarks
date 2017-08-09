import { component } from 'vuets'
import { defp, nullp, setp } from 'coreds/lib/util'
import { Pager, ItemSO, SelectionFlags/*, PojoSO*/, PojoState } from 'coreds/lib/types'
import { PojoStore } from 'coreds/lib/pstore/'
//import { mergeFrom } from 'coreds/lib/diff'
import { ParamRangeKey } from 'coreds/lib/prk'
import * as msg from 'coreds-ui/lib/msg'
import * as form from 'coreds/lib/form'
import * as ui from '../ui/'
import { IdAndName, MAX_TAGS, mapId } from './context'
import { Item, View } from './BookmarkEntryBase'
import { qd, QForm } from '../../g/user/BookmarkEntryQForm'
import { user } from '../../g/user/'
const $ = user.BookmarkEntry

const PAGE_SIZE = 10,
    MULTIPLIER = 3

export class BookmarkEntryPage extends View {
    qform = new QForm()
    
    tags = [] as IdAndName[]
    tag_new = setp(setp(msg.$new(), 'f', null), 'f$', null)
    pnew = form.initObservable($.$new0(), $.$d)
    pupdate = form.initObservable($.$new0(), $.$d)
    constructor() {
        super()
        nullp(this, 'pager')
    }

    static created(self: BookmarkEntryPage) {
        let pstore = defp(self, 'pstore', new PojoStore([], {
            desc: true,
            pageSize: PAGE_SIZE,
            multiplier: MULTIPLIER,
            descriptor: $.$d,
            createObservable(so: ItemSO, idx: number) {
                return setp($.$new(''), $.M.$.tags, [])
            },
            onSelect(selected: user.BookmarkEntry, flags: SelectionFlags): number {
                return self.onSelect(selected, flags)
            },
            fetch(prk: ParamRangeKey, pager: Pager) {
                return self.qform.send(prk)
            }
        }))
        QForm.init(self.qform, self, {
            pager: pstore.pager, 
            cbSuccess: self.fetch$$S, 
            cbFailed: self.fetch$$F,
            list(prk: ParamRangeKey): PromiseLike<any> {
                return $.ForUser.listBookmarkEntry(prk)
            }
        })
        self.pager = pstore.pager
    }

    static mounted(self: BookmarkEntryPage) {
        self.pstore.requestNewer()
    }

    fetch$$S(data) {
        this.pstore.cbFetchSuccess(data['1'])
    }
    fetch$$F(err) {
        this.pstore.cbFetchFailed(err)
    }

    pnew$$S(data) {
        let pnew = this.pnew,
            tags = this.tags
        
        // reset
        if (tags.length) tags.length = 0

        this.pstore.addAll(data['1'], true, true)
        form.$success(pnew)
        this['$refs'].bookmark_entry_ff.focus()
    }
    pnew$$F(err) {
        form.$failed(this.pnew, err)
    }
    pnew$$() {
        let pnew = this.pnew,
            tags = this.tags,
            newTags = !tags.length ? undefined : tags.map(mapId),
            lastSeen
        if (!form.$prepare(pnew))
            return

        pnew['1'] = (lastSeen = this.pstore.getLastSeenObj()) && lastSeen['1']
        
        $.ForUser.create($.PNew.$new(pnew, newTags))
            .then(this.pnew$$S).then(undefined, this.pnew$$F)
    }
    
    tag_new$$(fk: string, id: number, name: string, message: user.BookmarkTag.M) {
        this['$refs'].tag_new.value = ''
        
        let tags = this.tags
        if (tags.length === MAX_TAGS)
            return false
        
        for (let tag of tags) {
            if (id === tag.id) return false
        }
        
        tags.push({ id, name })
        return false
    }
    rm_tag(idx: number) {
        this.tags.splice(idx, 1)
    }
    suggest(ps: any, opts: any) {
        return user.BookmarkTag.$NAME(ps, true)
    }
    upd_tag(idx: number) {
        console.log('upd_tag: ' + idx)
    }
}
export default component({
    created(this: BookmarkEntryPage) { BookmarkEntryPage.created(this) },
    mounted(this: BookmarkEntryPage) { BookmarkEntryPage.mounted(this) },
    components: {
        Item
    },
    template: /**/`
<div v-pager="pager">
<div class="list-header">
  <div class="right">
    <a><i class="icon filter" title="filter" v-toggle="'3__.1'"></i></a>
    <a>
      <i class="icon plus" title="add" v-toggle:click,1,bookmark_entry_ff="'.1'"></i>
      <div class="dropdown">
        <div class="dropdown-menu mfluid2 pull-right">
          ${ui.form('pnew', $.$d, 'bookmark_entry_ff', /**/`
          <div class="tags inline">
            <span v-for="(tag, idx) of tags" class="ui label" :style="tag.styles">
              {{ tag.name }}
              <i class="icon action close" @click="rm_tag(idx, true)"></i>
            </span>
          </div>
          <div class="field suggest" v-clear="tag_new">
            <i class="icon plus"></i>
            <input placeholder="Tag" type="text" ref="tag_new"
                :disabled="tags.length === ${MAX_TAGS} || 0 !== (tag_new.state & ${PojoState.LOADING})"
                v-suggest="{ pojo: tag_new, field: 'f', fetch: suggest, onSelect: tag_new$$, vk: '${user.BookmarkTag.$.id}' }" />
          </div>
          `/**/, 1, 3)}
        </div>
      </div>
    </a>
  </div>
  <input type="text" placeholder="Bookmarks" ${ui.lsearch_attrs($.$.title)} />
</div>
<div class="ui tab">
  ${ui.qform(qd)}
</div>
${ui.pager_controls}
${ui.pager_msg}
<ul class="ui small divided selection list">
  <item v-for="pojo of pager.array" :pojo="pojo" :detail_id="'bookmark-entry-detail'"
      @toggle="toggle" @rm_tag="upd_tag" />
</ul>
<div style="display:none">
  <div id="bookmark-entry-detail" class="detail">
    <hr />
    ${ui.form('pupdate', $.$d, null)}
  </div>
</div>
</div>`/**/
}, BookmarkEntryPage)
