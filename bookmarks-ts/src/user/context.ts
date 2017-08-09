import { PojoStore } from 'coreds/lib/pstore/'
import { user } from '../../g/user/'

export const MAX_TAGS = 4
//export const ERR_MAX_TAGS = `Maximum of ${MAX_TAGS} tags allowed.`

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
