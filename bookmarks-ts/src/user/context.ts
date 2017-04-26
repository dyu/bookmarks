import { HasToken } from 'vueds/lib/rpc/'
import { PojoStore } from 'vueds/lib/store/'
import { user } from '../../g/user/'
import { base64ToBytes, to_int32LE } from 'vueds/lib/util'

const Tag0 = user.BookmarkTag.$descriptor.$

export const HT: HasToken = {
    token: ''
}

export interface Stores {
    tag: PojoStore<user.BookmarkTag>
}
export const stores: Stores = {} as Stores

const DOMAIN_REGEX = /\b((?=[a-z0-9-]{1,63}\.)(xn--)?[a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,63}\b/

const WORD_WRAP_LIMIT = 40

export const filters = {
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
    let color = tag[Tag0.color]
    if (!color) {
        if (styles.color !== DEFAULT_TAG_COLOR)
            styles.color = DEFAULT_TAG_COLOR
    } else if (1 !== styles.color.indexOf(color, 1)) {
        styles.color = '#' + color
    }

    if (target && target.name.charAt(0) === '?') {
        target.name = tag[Tag0.name]
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
        if (t.id <= tagCount)
            updateTag(tags[tagCount - t.id], t.styles, t)
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
            color = tag && tag[Tag0.color] ? ('#' + tag[Tag0.color]) : DEFAULT_TAG_COLOR
        
        list.push({id, name, styles: { color }, state: 0 } as Tag)
    }

    return list
}
