import { PojoState } from 'coreds/lib/types'
import { PojoStore } from 'coreds/lib/pstore/'
import { base64ToBytes, to_int32LE } from 'coreds/lib/util'
import * as ui from '../ui'
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
    name: 'Item', props: { pojo: { type: Object, required: true } }, data() { return {} },
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
  ${ui.pi_msg}
  <div class="detail-p" v-show="pojo._.state & ${PojoState.UPDATE}" v-append:bookmark-entry-detail="pojo._.state & ${PojoState.UPDATE}"></div>
</li>
            `/**/
}
