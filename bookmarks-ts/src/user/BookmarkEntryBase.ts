import { nextTick } from 'vue'
import { defg, setp } from 'coreds/lib/util'
import { PojoStore, shallowCopyTo } from 'coreds/lib/pstore/'
import { PojoState, Pager, SelectionFlags, PojoSO } from 'coreds/lib/types'
import { mergeFrom } from 'coreds/lib/diff'
import * as ui from '../ui'
import * as msg from 'coreds-ui/lib/msg'
import * as form from 'coreds/lib/form'
import { filters, MAX_TAGS } from './context'
import { user } from '../../g/user/'
const $ = user.BookmarkEntry

const empty_array = []

export function merge_fn(src: any, descriptor: any, target: user.BookmarkEntry) {
    let tags = src[$.M.$.tags]
    target[$.M.$.tags] = tags || empty_array
    return mergeFrom(src, descriptor, target)
}

export function onUpdate(message: user.BookmarkEntry, main: boolean, update: user.BookmarkEntry) {
    merge_fn(update, $.$d, message)
    return false
}

export abstract class View {
    pager: Pager
    pstore: PojoStore<user.BookmarkEntry>

    tag_upd = setp(setp(msg.$new(), 'f', null), 'f$', null)
    pupdate = setp(form.initObservable($.$new0(), $.$d), 'tag_count', null)
    
    _m = defg(this, '_m', {
        tag_upd: null as any,
        tag_upd_idx: 0
    })
    
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
        
        let tags = original[$.M.$.tags]
        pupdate['tag_count'] = !tags ? 0 : tags.length
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
    
    tag_upd$$rm(idx: number) {
        if (!this.pstore.loading(true)) return false
        
        this._m.tag_upd = null
        this._m.tag_upd_idx = idx
        
        let pstore = this.pstore,
            selected = pstore.pager.pojo,
            tags = selected[$.M.$.tags] as user.BookmarkTag.M[],
            tag_id = tags[idx][user.BookmarkTag.$.id]
        
        $.ForUser.updateTag(user.UpdateTag.$new(selected['1'], tag_id, true))
                .then(this.tag_upd$$S).then(undefined, this.tag_upd$$F)
    }
    tag_upd$$focus() {
        this['$refs'].tag_upd.focus()
    }
    tag_upd$$S(data: user.ParamInt) {
        let pstore = this.pstore,
            selected = pstore.pager.pojo,
            array = selected[$.M.$.tags] as user.BookmarkTag.M[],
            entry = this._m.tag_upd,
            copy = entry && shallowCopyTo({}, entry) as user.BookmarkTag.M
        
        if (!entry) {
            // remove
            array.splice(this._m.tag_upd_idx, 1)
        } else if (!array.length) {
            // initialize array
            array = [copy]
            pstore.getOriginal(selected)[$.M.$.tags] = array
            selected[$.M.$.tags] = array
        } else {
            // insert
            array.splice(data['1'], 0, copy)
        }
        // update count
        this.pupdate['tag_count'] = array.length
        
        this.pstore.loading(false)
        if (entry) {
            msg.$success(this.tag_upd)
            nextTick(this.tag_upd$$focus)
        }
    }
    tag_upd$$F(err) {
        this.pstore.loading(false)
        msg.$failed(this.tag_upd, err)
        this._m.tag_upd && nextTick(this.tag_upd$$focus)
    }
    tag_upd$$(fk: string, id: number, name: string, message: user.BookmarkTag.M) {
        if (!this.pstore.loading(true)) return false
        
        // clear suggest input
        this['$refs'].tag_upd.value = ''
        // store selected message
        this._m.tag_upd = message
        
        let pstore = this.pstore,
            selected = pstore.pager.pojo
        
        $.ForUser.updateTag(user.UpdateTag.$new(selected['1'], id))
                .then(this.tag_upd$$S).then(undefined, this.tag_upd$$F)
        
        msg.$prepare(this.tag_upd)
        return false
    }
}

const Tag = user.BookmarkTag
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

export function $list(detail_id: string) {
    return /**/`
<ul class="ui small divided selection list">
  <item v-for="pojo of pager.array" :pojo="pojo" :detail_id="'${detail_id}'"
      @toggle="toggle" @rm_tag="tag_upd$$rm" />
</ul>
<div style="display:none">
  <div id="${detail_id}" class="detail">
    <hr />
    <div class="field suggest" v-clear="tag_upd" v-show="pupdate.tag_count < ${MAX_TAGS}">
      <i class="icon plus"></i>
      <input placeholder="Tag" type="text" ref="tag_upd"
          :disabled="0 !== (tag_upd.state & ${PojoState.LOADING})"
          v-suggest="{ pojo: tag_upd, field: 'f', fetch: suggest, onSelect: tag_upd$$, vk: '${user.BookmarkTag.$.id}' }" />
      ${msg.ui('tag_upd')}
    </div>
    ${ui.form('pupdate', $.$d, null)}
  </div>
</div>
    `/**/
}
