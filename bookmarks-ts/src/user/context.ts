import { PojoState, Pager, SelectionFlags, PojoSO } from 'coreds/lib/types'
import { PojoStore } from 'coreds/lib/pstore/'
import { base64ToBytes, to_int32LE } from 'coreds/lib/util'
import { mergeFrom } from 'coreds/lib/diff'
import * as ui from '../ui'
import * as form from 'coreds/lib/form'
import { user } from '../../g/user/'
const Tag$ = user.BookmarkTag

export interface IdAndName {
    id: number
    name: string
}

export function mapId(item: IdAndName) {
    return item.id
}

export interface Stores {
    tag: PojoStore<user.BookmarkTag>
}
export const stores: Stores = {} as Stores

const DOMAIN_REGEX = /\b((?=[a-z0-9-]{1,63}\.)(xn--)?[a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,63}\b/

const WORD_WRAP_LIMIT = 40

export const filters = {
    color(color: string) {
        return '#' + (color || '555555')
    },
    href(url: string) {
        if (url.indexOf('http') === 0)
            return url
        else if (DOMAIN_REGEX.test(url))
            return 'http://' + url
        else
            return null
    },
    word_wrap_next_line(url: string) {
        let space = url.indexOf(' ')
        return space > WORD_WRAP_LIMIT || (space === -1 && url.length > WORD_WRAP_LIMIT) ? 'display:block;margin-top:1em;word-wrap:break-word' : ''
    },
    word_wrap(url: string) {
        if (!url)
            return ''
        let space = url.indexOf(' ')
        return space > WORD_WRAP_LIMIT || (space === -1 && url.length > WORD_WRAP_LIMIT) ? 'word-wrap:break-word' : ''
    }
}

export const MAX_TAGS = 4;
export const ERR_MAX_TAGS = `Maximum of ${MAX_TAGS} tags allowed.`

export const enum TagState {
    REMOVE = 32
}

export interface Tag extends user.BookmarkEntry.Tag {
    styles: any
}

const DEFAULT_TAG_COLOR = '#777777'

function updateTag(tag: user.BookmarkTag, styles: any, target?: Tag) {
    let color = tag[Tag$.$.color]
    if (!color) {
        if (styles.color !== DEFAULT_TAG_COLOR)
            styles.color = DEFAULT_TAG_COLOR
    } else if (1 !== styles.color.indexOf(color, 1)) {
        styles.color = '#' + color
    }

    if (target && target[Tag$.$.name].charAt(0) === '?') {
        target[Tag$.$.name] = tag[Tag$.$.name]
    }

    return styles
}

export function newTagStyle(tagId: number) {
    let tags = stores.tag.mainArray,
        tagCount = tags.length,
        styles = { color: DEFAULT_TAG_COLOR }
    
    return tagId > tagCount ? styles : updateTag(tags[tagCount - tagId], styles)
}

export function updateTagStyle(list: Tag[]) {
    let tags = stores.tag.mainArray,
        tagCount = tags.length
    
    for (let t of list) {
        if (t[Tag$.$.id] <= tagCount)
            updateTag(tags[tagCount - t[Tag$.$.id]], t.styles, t)
    }
}

export function toTagArray(serTags: string, names: string[]): Tag[] {
    let list: Tag[] = [],
        bytes = base64ToBytes(serTags),
        tags = stores.tag.mainArray,
        tagCount = tags.length
    
    for (let i = 0, j = 0, len = bytes.length; i < len; i += 4, j++) {
        let id = to_int32LE(bytes, i),
            idx = tagCount - id, 
            tag = idx < 0 ? null : tags[idx],
            //name = tag && tag[Tag0.name] || ('? ' + id),
            name = names[j],
            color = tag && tag[Tag$.$.color] ? ('#' + tag[Tag$.$.color]) : DEFAULT_TAG_COLOR,
            entry = Tag$.$new(name, undefined, undefined, color, id) as any
        
        entry['styles'] = { color }
        entry['state'] = 0
        list.push(entry as Tag)
    }

    return list
}

const $ = user.BookmarkEntry
export const BookmarkEntryItem = {
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
    <span v-for="(tag, idx) of pojo['${$.M.$.tags}']" class="ui label" :style="{ color: '#' + tag['${Tag$.$.color}'] }">
      {{ tag['${Tag$.$.name}'] }}
      <i class="icon action cancel-circled" v-show="(tag.state & ${TagState.REMOVE})" @click="(tag.state ^= ${TagState.REMOVE})"></i>
      <i class="icon action ok-circled" v-show="(tag.state & ${TagState.REMOVE})" @click="0 <= (pojo._.state ^= ${TagState.REMOVE}) && $emit('rm_tag', idx)"></i>
      <i class="icon action trash" @click="(tag.state ^= ${TagState.REMOVE})"></i>
    </span>
  </div>
  ${ui.pi_msg}
  <div class="detail-p" v-show="pojo._.state & ${PojoState.UPDATE}" v-append:$detail_id="pojo._.state & ${PojoState.UPDATE}"></div>
</li>
            `/**/
}

export abstract class BookmarkEntryView {
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
