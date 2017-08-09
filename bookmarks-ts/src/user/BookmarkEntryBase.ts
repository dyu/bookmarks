import { PojoStore } from 'coreds/lib/pstore/'
import { PojoState, Pager, SelectionFlags, PojoSO } from 'coreds/lib/types'
import { mergeFrom } from 'coreds/lib/diff'
import * as ui from '../ui'
import * as form from 'coreds/lib/form'
import { filters } from './context'
import { user } from '../../g/user/'
const $ = user.BookmarkEntry
const Tag = user.BookmarkTag

export const enum TagState {
    REMOVE = 32
}

export const Item = {
    name: 'Item', data() { return {} },
    props: {
         pojo: { type: Object, required: true },
         detail_id: { type: String, required: true }
    }, 
    filters,
    template: /**/`
<li ${ui.pi_attrs}>
  <div class="content right floated">
    ${ui.icon_toggle($.$.active, 32, 'circle', $.$d[$.$.active].$n)}
  </div>
  <div class="content right floated timeago">${ui.icon_timeago}</div>
  <div class="content right floated timeago hide-pp hide-tp"><i class="icon calendar"></i>{{ pojo['${$.$.date}'] | ymd }}</div>
  <div :class="'content' + (pojo['${$.$.active}'] ? '' : ' line-through')">
    <a :style="pojo['${$.$.normalized}'] | word_wrap" :href="pojo['${$.$.url}'] | href" target="_blank" rel="noreferrer">
      <span v-show="pojo['${$.$.www}']">www.</span>{{ pojo['${$.$.normalized}'] }}
    </a>
    <div v-text="pojo['${$.$.title}']"></div>
  </div>
  <div :class="'tags inline' + (!(pojo._.state & ${PojoState.UPDATE}) ? ' noop' : '')">
    <span v-for="(tag, idx) of pojo['${$.M.$.tags}']" class="ui label" :style="{ color: '#' + tag['${Tag.$.color}'] }">
      {{ tag['${Tag.$.name}'] }}
      <i class="icon action close" @click="$emit('rm_tag', idx)"></i>
    </span>
  </div>
  ${ui.pi_msg}
  <div class="detail-p" v-show="pojo._.state & ${PojoState.UPDATE}" v-append:$detail_id="pojo._.state & ${PojoState.UPDATE}"></div>
</li>
            `/**/
}

export abstract class View {
    pager: Pager
    pstore: PojoStore<user.BookmarkEntry>
    pupdate: user.BookmarkEntry
    
    onSelect(selected: user.BookmarkEntry, flags: SelectionFlags): number {
        if (!(flags & SelectionFlags.CLICKED_UPDATE))
            return 0

        let selected_ = selected['_'] as PojoSO,
            state = selected_.state,
            pupdate = this.pupdate,
            pupdate_: PojoSO,
            original

        if ((flags & SelectionFlags.REFRESH)) {
            if (!(state & PojoState.UPDATE))
                return 0
        } else if (!(state & PojoState.UPDATE)) {
            selected_.state = state | PojoState.UPDATE
            if (selected['1'] === pupdate['1'])
                return 0
        } else if (selected['1'] === pupdate['1']) {
            selected_.state = state ^ PojoState.UPDATE
            return 0
        }

        pupdate_ = pupdate['_'] as PojoSO
        original = this.pstore.getOriginal(selected)

        mergeFrom(original, selected['$d'], pupdate)
        if (pupdate_.msg)
            pupdate_.msg = ''

        return 0
    }
    
    pupdate$$S(data) {
        let pager = this.pager,
            selected = pager.pojo as user.BookmarkEntry,
            original = this.pstore.getOriginal(selected)
        form.$update_success(this.pupdate, this.pager, original, selected)
    }
    pupdate$$F(err) {
        form.$update_failed(this.pupdate, this.pager, err)
    }
    pupdate$$() {
        let pager = this.pager,
            selected = pager.pojo as user.BookmarkEntry,
            original = this.pstore.getOriginal(selected),
            mc = form.$update(this.pupdate, pager, original)

        if (!mc)
            return

        $.ForUser.updateBookmarkEntry(form.$update_req(original['1'] as string, mc))
            .then(this.pupdate$$S).then(undefined, this.pupdate$$F)
    }
    change(e, field, pojo, update, root) {
        return form.$change(e, field, pojo, update, root)
    }
    
    toggle$$S(data) {
        form.$toggle_success(this.pager, this.pupdate)
    }
    toggle$$F(err) {
        form.$toggle_failed(this.pager, err)
    }
    toggle(field) {
        let pager = this.pager,
            pojo = pager.pojo,
            mc = form.$toggle(pager, field, pojo)
        mc && $.ForUser.updateBookmarkEntry(form.$update_req(pojo['1'] as string, mc))
            .then(this.toggle$$S).then(undefined, this.toggle$$F)
    }
}
