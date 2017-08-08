import { component } from 'vuets'
import { defg, defp, nullp } from 'coreds/lib/util'
import { Pager, ItemSO, SelectionFlags } from 'coreds/lib/types'
import { PojoStore } from 'coreds/lib/pstore/'
import { ParamRangeKey } from 'coreds/lib/prk'
import * as ui from '../ui/'
import { user } from '../../g/user/'
const $ = user.BookmarkEntry

const PAGE_SIZE = 10,
    MULTIPLIER = 3

export class BookmarkEntryList {
    pager: Pager
    pstore: PojoStore<user.BookmarkEntry>

    m = defg(this, 'm', {
        tags: [] as number[]
    })
    constructor() {
        nullp(this, 'pager')
    }

    static created(self: BookmarkEntryList) {
        let pstore = defp(self, 'pstore', new PojoStore([], {
            desc: true,
            pageSize: PAGE_SIZE,
            multiplier: MULTIPLIER,
            descriptor: $.$d,
            createObservable(so: ItemSO, idx: number) {
                return $.$new('')
            },
            onSelect(selected: user.BookmarkEntry, flags: SelectionFlags): number {
                return 0
            },
            fetch(prk: ParamRangeKey, pager: Pager) {
                return $.ForUser.listBookmarkEntryByTag($.PTags.$new(prk, self.m.tags))
                        .then(self.fetch$$S).then(undefined, self.fetch$$F)
            }
        }))
        self.pager = pstore.pager
    }
    
    update(tags: number[]) {
        this.m.tags = tags
        let pstore = this.pstore
        pstore.replace([])
        pstore.requestNewer()
    }

    fetch$$S(data) {
        this.pstore.cbFetchSuccess(data['1'])
    }
    fetch$$F(err) {
        this.pstore.cbFetchFailed(err)
    }
}
export default component({
    created(this: BookmarkEntryList) { BookmarkEntryList.created(this) },
    components: {
        item: {
            name: 'Item', props: { pojo: { type: Object, required: true } }, data() { return {} },
            template: /**/`
<li ${ui.pi_attrs}>
  TODO
</li>
            `/**/
        }
    },
    template: /**/`
<div v-pager="pager">
<div class="list-header">
  <input type="text" placeholder="BookmarkEntry" ${ui.lsearch_attrs($.$.title)} />
</div>
${ui.pager_controls}
${ui.pager_msg}
<ul class="ui small divided selection list">
  <item v-for="pojo of pager.array" :pojo="pojo" />
</ul>
</div>`/**/
}, BookmarkEntryList)
