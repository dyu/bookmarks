import { PojoState, PojoSO, Pager, SelectionFlags, ItemSO, PagerState } from 'vueds/lib/types'
import { bit_clear_and_set } from 'vueds/lib/util'
import { mergeVmFrom } from 'vueds/lib/diff'
import {
    formUpdate, formUpdateSuccess, nextTick,
    togglePrepare, toggleUpdateSuccess, toggleUpdate
} from 'vueds'
import { PojoStore, FetchFn } from 'vueds/lib/store/'
import { ds } from 'vueds/lib/ds/'
import { user } from '../../g/user'
import {
    MAX_TAGS, ERR_MAX_TAGS, TagState, Tag, 
    toTagArray, updateTagStyle, newTagStyle
} from './context'

import * as form from 'vueds-ui/lib/tpl/legacy/form'
import * as list from 'vueds-ui/lib/tpl/legacy/list'
import * as pager_controls from 'vueds-ui/lib/tpl/legacy/pager_controls'
import * as icons from 'vueds-ui/lib/tpl/legacy/icons'

const $ = user.BookmarkEntry,
    $0 = $.$descriptor.$,
    M0 = $.M.$descriptor.$,
    Item = $.Item,
    Item0 = Item.$descriptor.$

interface View {
    pager: Pager
    pstore: PojoStore<user.BookmarkEntry>
    fetch$$S: any
    fetch$$F: any

    pupdate: user.BookmarkEntry
    pupdate_item: user.BookmarkEntry.Item
    pupdate$$S: any
    pupdate$$F: any
    pupdate$$focus_tag: any

    toggle$$S: any
    toggle$$F: any
}

export const PAGE_SIZE = 8,
    MULTIPLIER = 4,
    INITIAL_FETCH_LIMIT = (PAGE_SIZE * MULTIPLIER) + 1;

export function newStore(self: View, fetch: FetchFn): PojoStore<user.BookmarkEntry> {
    return new PojoStore([], {
        desc: true,
        pageSize: PAGE_SIZE,
        descriptor: $.$descriptor,
        multiplier: MULTIPLIER,
        createObservable(so: ItemSO, idx: number) {
            let p = $.$createObservable()
            p['tags'] = []
            return p
        },
        onSelect(selected: user.BookmarkEntry, flags: SelectionFlags): number {
            if (!(flags & SelectionFlags.CLICKED_UPDATE))
                return 0

            let selected_ = selected['_'] as PojoSO,
                state = selected_.state,
                pupdate = self.pupdate,
                pupdate_ = pupdate['_'] as PojoSO,
                tags = selected['tags'] as Tag[],
                original

            if ((flags & SelectionFlags.REFRESH)) {
                if (!(state & PojoState.UPDATE))
                    return 0
            } else if (!(state & PojoState.UPDATE)) {
                selected_.state = state | PojoState.UPDATE
                if (selected.key === pupdate.key) {
                    if (tags.length < MAX_TAGS)
                        nextTick(self.pupdate$$focus_tag)
                    return 0
                }
            } else if (selected.key === pupdate.key) {
                selected_.state = state ^ PojoState.UPDATE
                return 0
            }

            original = self.pstore.getOriginal(selected)

            mergeVmFrom(original, selected['$d'], pupdate)
            if (pupdate_.msg)
                pupdate_.msg = ''

            if (tags.length < MAX_TAGS)
                nextTick(self.pupdate$$focus_tag)

            let pupdate_item = self.pupdate_item,
                pupdate_item_ = pupdate_item['_'] as PojoSO,
                tagIdProp = Item0.tagId

            // clear suggest
            pupdate_item_[tagIdProp] = pupdate_item_[tagIdProp] === null ? '' : null
            pupdate_item['size'] = tags.length

            // TODO
            // call renderDetail or fetchDetail based on original's props

            return 0
        },
        fetch(req: ds.ParamRangeKey, pager: Pager) {
            fetch(req, pager)
        },
        onAdd(message: user.BookmarkEntry, main: boolean, latest: boolean) {
            message['tags'] = toTagArray(message[$0.serTags], message[M0.tags])
        },
        onUpdate(message: user.BookmarkEntry, main: boolean, update: user.BookmarkEntry): boolean {
            let serTags = update[$0.serTags]
            if (serTags !== message[$0.serTags])
                message['tags'] = toTagArray(serTags, update[M0.tags])
            else
                updateTagStyle(message['tags'])

            return true
        },
        onPopulate(message: user.BookmarkEntry, main: boolean, target: user.BookmarkEntry, index: number) {
            target['tags'] = message['tags']
        }
    })
}

export function updateSuccess(this: View): boolean {
    let pager = this.pager,
        selected = pager.pojo as user.BookmarkEntry,
        original = this.pstore.getOriginal(selected)

    // TODO fetched fields check update and merge to original

    formUpdateSuccess(this.pupdate, pager, original, selected)
    return true
}

export function updateSend(self: View): boolean {
    let pager = self.pager,
        selected = pager.pojo as user.BookmarkEntry,
        original = self.pstore.getOriginal(selected),
        // TODO fetched fields
        mc = formUpdate(self.pupdate, pager, original/*, TODO*/)

    if (!mc/* && !TODO */)
        return false

    $.ForUser.updateBookmarkEntry(ds.ParamUpdate.$create(original['1'], mc))
        .then(self.pupdate$$S).then(undefined, self.pupdate$$F)
    
    return true
}

export function toggleSend(self: View, selected: user.BookmarkEntry, field: string): boolean {
    let mc = toggleUpdate(self.pager, field)
    if (!mc)
        return false
    
    let req = ds.ParamUpdate.$create(selected.key || '', mc)
    $.ForUser.updateBookmarkEntry(req)
        .then(self.toggle$$S).then(undefined, self.toggle$$F)
    
    return true
}

export function preInsertTag(name: string, id: number, pager: any,
        pojo: user.BookmarkEntry) {
    let pojo_ = pojo['_'] as PojoSO,
        tags = pojo['tags'] as Tag[]
    
    if (tags.length === MAX_TAGS) {
        pojo_.state = bit_clear_and_set(pojo_.state, PojoState.MASK_STATUS, PojoState.WARNING)
        pojo_.msg = ERR_MAX_TAGS
        return false
    }

    for (let t of tags) {
        if (t.id === id) {
            pojo_.state = bit_clear_and_set(pojo_.state, PojoState.MASK_STATUS, PojoState.WARNING)
            pojo_.msg = 'Already exists.'
            return false
        }
    }

    return togglePrepare(pager)
}

export function insertTag(self: View, name: string, id: number) {
    let pager = self.pager,
        pojo = pager.pojo
    
    return preInsertTag(name, id, pager, pojo) &&
            doInsertTag(name, id, pager, pojo, self.pstore.getOriginal(pojo),
            self.pupdate_item,
            self.pupdate$$focus_tag, self.toggle$$F)
}

export function doInsertTag(name: string, id: number, pager: any,
        pojo: user.BookmarkEntry, original: user.BookmarkEntry,
        pupdate_item: user.BookmarkEntry.Item,
        pupdate$$focus_tag: any, toggle$$F: any) {
    let pupdate_item_ = pupdate_item['_'] as PojoSO,
        tagIdProp = Item0.tagId
    
    // clear suggest
    pupdate_item_[tagIdProp] = pupdate_item_[tagIdProp] === null ? '' : null

    $.ForUser.updateTag(user.UpdateTag.$create(original['1'], id, false))
        .then(function (data) {
            let slot = data['1'] as number,
                array: Tag[] = original['tags'] || pojo['tags'],
                tag_new = { name, id, styles: newTagStyle(id), state: 0 } as Tag

            // insert
            array.splice(slot, 0, tag_new)
            //self.m.pupdate_items[name] = tag_new
            // TODO necessary?
            //pojo['tags'] = tags

            // update view
            pupdate_item['size'] = array.length

            toggleUpdateSuccess(pager, null, true)
            if (array.length < MAX_TAGS)
                nextTick(pupdate$$focus_tag)
        }).then(undefined, toggle$$F)

    return true
}

export const preRmTag = togglePrepare

export function rmTag(self: View, selected: Tag): boolean {
    let pager = self.pager

    return preRmTag(pager) &&
            doRmTag(selected, pager, pager.pojo, self.pstore.getOriginal(pager.pojo),
            self.pupdate_item,
            self.pupdate$$focus_tag, self.toggle$$F)
}

export function doRmTag(selected: Tag, pager: any, 
        pojo: user.BookmarkEntry, original: user.BookmarkEntry, 
        pupdate_item: user.BookmarkEntry.Item,
        pupdate$$focus_tag: any, toggle$$F: any): boolean {
    
    $.ForUser.updateTag(user.UpdateTag.$create(original['1'], selected.id, true))
        .then(function (data) {
            let tags: Tag[] = original['tags'] || pojo['tags'],
                id = selected.id,
                i = tags.length
            
            // update view
            pupdate_item['size'] = i - 1

            while (i-- > 0) {
                if (id === tags[i].id) {
                    tags.splice(i, 1)
                    break
                }
            }
            // TODO necessary?
            //pojo['tags'] = tags

            toggleUpdateSuccess(pager, null, true)
            nextTick(pupdate$$focus_tag)
        }).then(undefined, toggle$$F)
    
    return true
}

const enum UpdateState {
    DISCARD = 32,
    FORM = 64
}

export function list_view(detail_id: string, tag_input_id: string ): string {
    return /**/`
${pager_controls.main({ pager: 'pager', top: true })}
${list.main({ pager: 'pager' }, `
  <div class="content right floated">
    <span class="alt">${icons.timeago({ pojo: 'pojo' })}</span>
    <span class="alt hide-pp hide-tp"><i class="icon calendar"></i>{{ pojo.${$.$.date} | ymd }}</span>
    ${icons.toggle({
      pojo: 'pojo',
      field: $.$.active,
      bit: UpdateState.DISCARD,
      fn: 'toggle$$',
      title_expr: `pojo.${$.$.active} ? 'Discard?' : 'Restore?'`
    })}
  </div>
  <div class="content" v-sclass:line-through="!pojo.${$.$.active}" >
    <a :style="pojo.${$.$.normalized} | word_wrap" :href="pojo.${$.$.url} | href" target="_blank" rel="noreferrer">
      <span v-show="pojo.${$.$.www}">www.</span>{{ pojo.${$.$.normalized} }}
    </a>
    <div v-text="pojo.${$.$.title}"></div>
  </div>
  <div class="tags inline" v-sclass:noop="!(pojo._.state & ${PojoState.UPDATE})">
    <span v-for="tag in pojo.tags" class="ui label" :style="tag.styles">
      {{ tag.${$.Tag.$.name} }}
      <i class="icon action cancel-circled" v-show="(tag.state & ${TagState.REMOVE})" @click="(tag.state ^= ${TagState.REMOVE})"></i>
      <i class="icon action ok-circled" v-show="(tag.state & ${TagState.REMOVE})" @click="rmTag(tag, tag.state ^= ${TagState.REMOVE}, true)"></i>
      <i class="icon action trash" @click="(tag.state ^= ${TagState.REMOVE})"></i>
    </span>
  </div>
  <div v-show="pojo._.state & ${PojoState.UPDATE}" v-append:${detail_id}="pojo._.state & ${PojoState.UPDATE}"></div>
`
)}
<div style="display:none">
  <div id="${detail_id}">
    <div class="detail">
      <hr />
      <div v-text="pupdate.${$.$.notes}"></div>
      <div class="mdl input" v-show="pupdate_item.size < ${MAX_TAGS}">
        <input id="${tag_input_id}" placeholder="Tag(s)"
            v-disable="(pager.state & ${PagerState.LOADING})"
            v-suggest="{ pojo: pupdate_item, field: '${Item.$.tagId}', fetch: '${user.BookmarkTag.$$NAME}', onSelect: insertTag }" />
      </div>
      ${icons.drawer({ pojo: 'pupdate', bit: UpdateState.FORM }, '<i class="icon pencil dd"></i>')}
      <div v-show="(pupdate._.state & ${UpdateState.FORM})">
        <div class="dd">
        ${form.main({
          show_expr: `(pupdate._.state & ${UpdateState.FORM})`,
          pojo: 'pupdate',
          $d: $.$descriptor,
          on_submit: 'pupdate$$',
          use_switch: true,
          update: true
        })}
        </div>
      </div>
    </div>
  </div>
</div>
`/**/
}
