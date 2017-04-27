import { component } from 'vuets'
import { PojoState, PojoSO, Pager, PagerState } from 'vueds/lib/types'
import { defp, nullp } from 'vueds/lib/util'
import {
    initObservable, nextTick,
    bindFormUpdateFailed, bindToggleUpdateSuccess, bindToggleUpdateFailed
} from 'vueds'
import { PojoStore, bindFetchFailed } from 'vueds/lib/store/'
import { bit_clear_and_set } from 'vueds/lib/util'
import { bindFocus } from 'vueds-ui/lib/dom_util'
import * as menu from 'vueds-ui/lib/tpl/legacy/menu'
import * as form from 'vueds-ui/lib/tpl/legacy/form'
import * as input from 'vueds-ui/lib/tpl/legacy/input'

import { ds } from 'vueds/lib/ds/'
// TODO import common module
import {
    filters, MAX_TAGS, ERR_MAX_TAGS,
    Tag, newTagStyle
} from './context'
import {
    newStore, updateSend, updateSuccess, toggleSend,
    insertTag, rmTag, list_view, INITIAL_FETCH_LIMIT
} from './entry'
import { user } from '../../g/user/'

const $ = user.BookmarkEntry,
    $0 = $.$descriptor.$,
    Item$ = $.Item.$,
    Item0 = $.Item.$descriptor.$,
    M$ = $.M.$,
    M0 = $.M.$descriptor.$

const enum PTagState {
    HIDE = 32
}

function mapId(t: Tag) {
    return t.id
}

interface Mutable {
    lastSeenKey: string|undefined
    //pnew_items: any
    //pupdate_items: any
}

export class BookmarkEntryTagView {
    initialized = false
    pager: Pager
    pstore: PojoStore<user.BookmarkEntry>

    fetch$$S: any
    fetch$$F: any

    pnew$$focus_tag: any

    pnew = initObservable($.Item.$createObservable(), $.Item.$descriptor)
    pnew_tags: Tag[] = []
    
    pupdate = initObservable($.$createObservable(), $.$descriptor)
    pupdate$$S: any
    pupdate$$F: any
    pupdate$$focus_tag: any
    
    pupdate_item = initObservable($.Item.$createObservable(), $.Item.$descriptor)
    
    toggle$$S: any
    toggle$$F: any

    m: Mutable

    constructor() {
        nullp(this, 'pager')

        this.pupdate_item['size'] = 0
    }

    static created(self: BookmarkEntryTagView) {
        defp(self, 'm', {
            lastSeenKey: undefined,
            //pnew_items: {},
            //pupdate_items: {}
        } as Mutable)

        self.pager = defp(self, 'pstore', newStore(self, function(req: ds.ParamRangeKey, pager: Pager) {
            let startObj
            if (req.startKey) {
                // set as entryKey
                req.parentKey = req.startKey
                startObj = self.pstore.startObj
                // the real startKey
                req.startKey = startObj.$d ? startObj[M$.pageKey] : startObj[M0.pageKey]
            }
            self.fetch(req, self.pnew_tags.map(mapId))
        })).pager

        self.fetch$$S = BookmarkEntryTagView.fetch$$S.bind(self)
        self.fetch$$F = bindFetchFailed(self.pstore)
        // TODO fetched fields init

        self.pnew$$focus_tag = bindFocus('bookmark-entry-tag-pnew-tag')

        let update_scope = { pager: self.pager, pojo: self.pupdate }
        self.pupdate$$S = updateSuccess.bind(self)
        self.pupdate$$F = bindFormUpdateFailed(update_scope)
        self.pupdate$$focus_tag = bindFocus('bookmark-entry-tag-pupdate-tag')

        // TODO toggles/actions init
        self.toggle$$S = bindToggleUpdateSuccess(update_scope)
        self.toggle$$F = bindToggleUpdateFailed(self.pager)

        // TODO fetch fields state defaults
    }
    
    static activate(self: BookmarkEntryTagView) {

    }

    static fetch$$S(this: BookmarkEntryTagView, data: any): boolean {
        if (!this.initialized)
            this.initialized = true
        
        this.pstore.cbFetchSuccess(data['1'])
        return true
    }
    fetch(prk: ds.ParamRangeKey, tags: number[]) {
        $.ForUser.listBookmarkEntryByTag($.PTags.$create(prk, tags))
            .then(this.fetch$$S).then(undefined, this.fetch$$F)
    }

    pupdate$$() {
        updateSend(this)
    }
    // TODO toggles/actions
    addTag(name: string, id: number) {
        let pnew = this.pnew,
            pnew_ = pnew['_'] as PojoSO,
            tags = this.pnew_tags,
            pager = this.pager,
            tagIdProp
        
        if (tags.length === MAX_TAGS) {
            pnew_.state = bit_clear_and_set(pnew_.state, PojoState.MASK_STATUS, PojoState.WARNING)
            pnew_.msg = ERR_MAX_TAGS
            return
        }

        for (let t of tags) {
            if (t.id !== id)
                continue
            pnew_.state = bit_clear_and_set(pnew_.state, PojoState.MASK_STATUS, PojoState.WARNING)
            pnew_.msg = 'Duplicate.'
            return false
        }
        
        tags.push({ name, id, styles: newTagStyle(id), state: 0 } as Tag)
        tagIdProp = Item0.tagId
        pnew_[tagIdProp] = pnew_[tagIdProp] === null ? '' : null
        if (pnew_.msg) pnew_.msg = ''

        if (!this.pstore.isEmpty())
            this.pstore.clear()
        if (pager.msg)
            pager.msg = ''
        pager.state = bit_clear_and_set(pager.state, PagerState.MASK_STATUS, PagerState.LOADING | PagerState.LOAD_NEWER)
        
        this.fetch(ds.ParamRangeKey.$create(true, INITIAL_FETCH_LIMIT), tags.map(mapId))
        return false
    }
    rmTag(selected: Tag, ignore?: number, update?: boolean) {
        if (update) {
            rmTag(this, selected)
            return
        }
        
        let pnew = this.pnew,
            pnew_ = pnew['_'] as PojoSO,
            tags = this.pnew_tags,
            len = tags.length,
            pager = this.pager,
            idx = 0,
            id = selected.id
        
        for (let t of tags) {
            if (t.id === id)
                break
            
            idx++
        }
        // remove
        tags.splice(idx, 1)
        
        if (pnew_.msg)
            pnew_.msg = ''
        
        if (!this.pstore.isEmpty())
            this.pstore.clear()
        if (pager.msg)
            pager.msg = ''
        
        if (len === 1)
            return
        
        pager.state = bit_clear_and_set(pager.state, PagerState.MASK_STATUS, PagerState.LOADING | PagerState.LOAD_NEWER)
        
        this.fetch(ds.ParamRangeKey.$create(true, INITIAL_FETCH_LIMIT), tags.map(mapId))
        
        nextTick(this.pnew$$focus_tag)
    }
    insertTag(name: string, id: number) {
        insertTag(this, name, id)
        return false
    }
    toggle$$(selected: user.BookmarkEntry, field: string) {
        toggleSend(this, selected, field)        
    }
}
export default component({
    created(this: BookmarkEntryTagView) { BookmarkEntryTagView.created(this) },
    filters,
    template: /**/`
<div v-pager="pager">
  ${menu.pager({ title: 'BookmarksByTag', pager: 'pager', search_fk: $0.url, content_loc: menu.ContentLoc.RIGHT_MENU, item_raw_attrs: 'v-rclass:long,pl' }, `
    <div class="item" v-rclass:long,pl>
      <div class="ui small left icon input">
        ${input.suggest({
          pojo: 'pnew',
          field: Item$.tagId,
          handler: 'addTag',
          fetch: user.BookmarkTag.$$NAME,
          id: 'bookmark-entry-tag-pnew-tag',
          placeholder: 'Tag(s)'
        })}
        <i class="icon tags" @click="(pnew_tags.length && (pnew._.state ^= ${PTagState.HIDE}))"
            v-sclass:toggle="pnew_tags.length"></i>
        <div class="dropdown" v-sclass:active="pnew._.msg || (pnew_tags.length && !(pnew._.state & ${PTagState.HIDE}))">
          <ul class="dropdown-menu">
            <li class="tags" v-for="tag in pnew_tags">
              <span class="ui label tag" :style="tag.styles" v-sclass:noop="(pager.state & ${PagerState.LOADING})">
                {{ tag.${$.Tag.$.name} }}
                <i class="icon action close" @click="rmTag(tag)"></i>
              </span>
            </li>
            ${form.msg('pnew')}
          </ul>
        </div>
      </div>
    </div>
  `
  )}
  <div v-if="initialized" v-show="pager.size">
    ${list_view('bookmark-entry-tag-detail', 'bookmark-entry-tag-pupdate-tag')}
  </div>
</div>`/**/
}, BookmarkEntryTagView)
