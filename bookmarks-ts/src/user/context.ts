import { PagerState } from 'vueds/lib/types'
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

export const filters = {
    href(url: string) {
        return url.indexOf('http') === 0 ? url : null
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

const DEFAULT_TAG_COLOR = '#888888'

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

export const UI_MENU_BAR = /**/`
<ul class="ui right floated horizontal list">
  <li class="item" title="sort">
    <a v-disable="2 > pager.size || (pager.state & ${PagerState.LOADING})"
        @click.prevent="pager.store.repaint((pager.state ^= ${PagerState.DESC}))">
      <i class="icon" v-pclass:desc-="(pager.state & ${PagerState.DESC}) ? 'yes' : 'no'"></i>
    </a>
  </li>
  <li class="item" title="refresh">
    <a v-disable="(pager.state & ${PagerState.MASK_RPC_DISABLE}) || pager.size === 0"
        @click.prevent="pager.store.reload()">
      <i class="icon cw"></i>
    </a>
  </li>
  <li class="item">
    <a v-disable="(pager.state & ${PagerState.LOADING}) || pager.page === 0"
        @click.prevent="pager.store.repaint((pager.page = 0))">
      <i class="icon angle-double-left"></i>
    </a>
  </li>
  <li class="item">
    <a v-disable="(pager.state & ${PagerState.MASK_RPC_DISABLE})"
        @click.prevent="pager.store.pagePrevOrLoad(0)">
      <i class="icon angle-left"></i>
    </a>
  </li>
  <li class="item">
    <a v-disable="(pager.state & ${PagerState.MASK_RPC_DISABLE}) || pager.size === 0"
        @click.prevent="pager.store.pageNextOrLoad(0)">
      <i class="icon angle-right"></i>
    </a>
  </li>
  <li class="item">
    <a v-disable="(pager.state & ${PagerState.LOADING}) || pager.page === pager.page_count"
        @click.prevent="pager.store.repaint((pager.page = pager.page_count))">
      <i class="icon angle-double-right"></i>
    </a>
  </li>
  <li class="item" title="add" v-toggle="'1__.2'">
    <a><i class="icon plus"></i></a>
  </li>
  <li class="item" title="filter" v-toggle="'1__.3'">
    <a><i class="icon filter"></i></a>
  </li>
</ul>
<ul class="ui horizontal list">
  <li class="item">
    <sup>
      <span v-show="pager.size !== 0" v-text="pager.page_from"></span>
      <span v-show="pager.page_from !== pager.page_to">
        <span v-show="pager.size !== 0" >-</span>
        <span v-text="pager.page_to"></span>
      </span> of <span v-text="pager.size"></span>
    </sup>
  </li>
</ul>
`/**/