import { component } from 'vuets'
import { PojoState, PojoSO, FieldType, Pager, PagerState, ItemSO, SelectionFlags } from 'vueds/lib/types'
import { defp, nullp } from 'vueds/lib/util'
import { mergeFrom } from 'vueds/lib/diff'
import {
    initObservable, nextTick,
    formPrepare, formSuccess, bindFormFailed,
    bindFormUpdateFailed,
    
    bindToggleUpdateSuccess, bindToggleUpdateFailed
} from 'vueds'
import {
    PojoStore, bindFetchFailed
} from 'vueds/lib/store/'
import { HasToken } from 'vueds/lib/rpc/'
import { bit_clear_and_set, bit_unset } from 'vueds/lib/util'
import { focus, bindFocus } from 'vueds-ui/lib/dom_util'
import * as menu from 'vueds-ui/lib/tpl/legacy/menu'
import * as form from 'vueds-ui/lib/tpl/legacy/form'
import * as list from 'vueds-ui/lib/tpl/legacy/list'
import * as input from 'vueds-ui/lib/tpl/legacy/input'

import { ds } from 'vueds/lib/ds/'
// TODO import common module
import {
    HT, filters, MAX_TAGS, ERR_MAX_TAGS,
    Tag, TagState, newTagStyle
} from './context'
import {
    newStore, updateSend, updateSuccess, toggleSend,
    insertTag, rmTag, list_view, fetchLimit
} from './entry'
import { user } from '../../g/user/'
import { qd, QForm } from '../../g/user/BookmarkEntryQForm'
import * as qform from 'vueds-ui/lib/tpl/legacy/qform'

const $ = user.BookmarkEntry,
    $0 = $.$descriptor.$,
    Item$ = $.Item.$,
    Item0 = $.Item.$descriptor.$

interface Mutable {
    lastSeenKey: string|undefined
    pnew_items: any
    //pupdate_items: any
}

export class BookmarkEntryView {
    lazy_count = 0
    initialized = false
    pager: Pager
    pstore: PojoStore<user.BookmarkEntry>
    qform = new QForm()

    fetch$$S: any
    fetch$$F: any

    pnew = initObservable($.Item.$createObservable(), $.Item.$descriptor)
    pnew$$S: any
    pnew$$F: any

    pnew_title = ''
    pnew_notes = ''
    pnew$$focus_tag: any

    pnew_pager: Pager
    pnew_pstore: PojoStore<Tag>
    
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
        nullp(this, 'pnew_pager')

        this.pupdate_item['size'] = 0
    }

    static created(self: BookmarkEntryView) {
        defp(self, 'm', {
            lastSeenKey: undefined,
            pnew_items: {},
            pupdate_items: {}
        } as Mutable)

        self.pager = defp(self, 'pstore', newStore(self, function(req: ds.ParamRangeKey, pager: Pager) {
            self.qform.send(req)
        })).pager

        self.fetch$$S = BookmarkEntryView.fetch$$S.bind(self)
        self.fetch$$F = bindFetchFailed(self.pstore)
        QForm.init(self.qform, self, {
            pager: self.pager, 
            cbSuccess: self.fetch$$S, 
            cbFailed: self.fetch$$F,
            hasToken: HT,
            list(prk: ds.ParamRangeKey, hasToken: HasToken): PromiseLike<any> {
                return $.ForUser.listBookmarkEntry(prk)
            }
        })
        // TODO fetched fields init

        self.pnew$$S = BookmarkEntryView.pnew$$S.bind(self)
        self.pnew$$F = bindFormFailed(self.pnew)
        self.pnew$$focus_tag = bindFocus('bookmark-entry-pnew-tag')

        self.pnew_pager = defp(self, 'pnew_pstore', new PojoStore([], {
            desc: true,
            pageSize: 5,
            descriptor: $.Tag.$descriptor,
            keyProperty: $.Tag.$.name,
            $keyProperty: $.Tag.$.name,
            merge_fn: mergeFrom,
            createObservable(so: ItemSO, idx: number) {
                let p = $.Tag.$createObservable()
                p['styles'] = null
                return p
            },
            onSelect(selected: Tag, flags: SelectionFlags): number {
                return 0
            },
            fetch(req: ds.ParamRangeKey, pager: Pager) {
                // not used
            },
            page(next: boolean, pager: Pager) {
                // noop
            },
            onAdd(message: Tag, main: boolean, latest: boolean) {
                self.m.pnew_items[message.name] = message
            },
            onRemove(message: Tag, main: boolean) {
                self.m.pnew_items[message.name] = null
                nextTick(self.pnew$$focus_tag)
            },
            onRemoveArray(array: Array<Tag>, main: boolean) {
                self.m.pnew_items = {}
            },
            onPopulate(message: Tag, main: boolean, target: Tag, index: number) {
                let target_ = target['_'] as PojoSO
                target_.state = bit_unset(target_.state, TagState.REMOVE)
            }
        })).pager

        let update_scope = { pager: self.pager, pojo: self.pupdate }
        self.pupdate$$S = updateSuccess.bind(self)
        self.pupdate$$F = bindFormUpdateFailed(update_scope)
        self.pupdate$$focus_tag = bindFocus('bookmark-entry-pupdate-tag')

        // TODO toggles/actions init
        self.toggle$$S = bindToggleUpdateSuccess(update_scope)
        self.toggle$$F = bindToggleUpdateFailed(self.pager)

        // TODO fetch fields state defaults
    }

    static activate(self: BookmarkEntryView) {
        if (!self.lazy_count || (self.pager.state & PagerState.LOADING))
            return

        // reload existing or retry the initial fetch
        if (self.initialized)
            self.pstore.reload()
        else
            self.lazy_init(true)
    }

    lazy_init(from_activate?: boolean) {
        if (!from_activate && this.lazy_count++)
            return

        let pager = this.pager
        if (pager.msg)
            pager.msg = ''
        pager.state |= PagerState.LOADING
        $.ForUser.listBookmarkEntry(ds.ParamRangeKey.$create(true, fetchLimit(pager.array.length)))
            .then(this.fetch$$S).then(undefined, this.fetch$$F)
    }

    static fetch$$S(this: BookmarkEntryView, data: any): boolean {
        if (this.initialized) {
            this.pstore.cbFetchSuccess(data['1'])
        } else {
            this.initialized = true
            this.pager.msg = ''
            this.pager.state ^= PagerState.LOADING
            this.pstore.addNewer(data['1'])
        }

        return true
    }

    static pnew$$S(this: BookmarkEntryView, data): boolean {
        if (this.m.lastSeenKey)
            this.pstore.addAll(data['1'], true, true)
        
        let pnew = this.pnew,
            pnew_ = pnew['_'] as PojoSO,
            tagIdProp = Item0.tagId
        
        if (this.pnew_title)
            this.pnew_title = ''
        if (this.pnew_notes)
            this.pnew_notes = ''
        
        formSuccess(pnew)
        pnew_[tagIdProp] = pnew_[tagIdProp] === null ? '' : null
        this.pnew_pstore.clear()
        focus('bookmark-entry-pnew-ff')
        return true
    }
    pnew$$() {
        let pnew = this.pnew,
            pnew_pstore = this.pnew_pstore
        
        if (!formPrepare(pnew))
            return
        
        let lastSeen = this.pstore.getLastSeenObj(),
            lastSeenKey = this.m.lastSeenKey = lastSeen && lastSeen['1'],
            req = $.PNew.$create($.$create(pnew.url, lastSeenKey)),
            title = this.pnew_title,
            notes = this.pnew_notes,
            tags: number[] = req.tags = []
        
        if (title)
            req.p.title = title
        if (notes)
            req.p.notes = notes
        
        for (let tag of pnew_pstore.mainArray) {
            tags.push(tag.id || 0)
        }

        $.ForUser.create(req)
            .then(this.pnew$$S).then(undefined, this.pnew$$F)
    }

    pupdate$$() {
        updateSend(this)
    }
    // TODO toggles/actions
    addTag(name: string, id: number) {
        let pnew = this.pnew,
            pnew_ = pnew['_'] as PojoSO,
            tagIdProp
        
        if (this.m.pnew_items[name]) {
            pnew_.state = bit_clear_and_set(pnew_.state, PojoState.MASK_STATUS, PojoState.WARNING)
            pnew_.msg = 'Already added.'
        } else if (this.pnew_pstore.size() === MAX_TAGS) {
            pnew_.state = bit_clear_and_set(pnew_.state, PojoState.MASK_STATUS, PojoState.WARNING)
            pnew_.msg = ERR_MAX_TAGS
        } else {
            this.pnew_pstore.add({name, id, styles: newTagStyle(id)}, false, false)
            tagIdProp = Item0.tagId
            pnew_[tagIdProp] = pnew_[tagIdProp] === null ? '' : null
            if (pnew_.msg) pnew_.msg = ''
        }
        
        return false
    }
    rmTag(selected: Tag, ignore?: number, update?: boolean) {
        if (update) {
            rmTag(this, selected)
            return
        }
        
        let pnew = this.pnew,
            pnew_ = pnew['_'] as PojoSO
        
        this.pnew_pstore.remove(this.pnew_pstore.getStoreIndex(selected))
        
        if (pnew_.msg)
            pnew_.msg = ''
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
    created(this: BookmarkEntryView) { BookmarkEntryView.created(this) },
    filters,
    template: /**/`
<div v-pager="pager">
  ${menu.pager_lazy({ title: 'Bookmarks', pager: 'pager', search_fk: $0.url }, `
    <li v-toggle="'5__.2__0.0'"><a><i class="icon filter"></i></a></li>
  `
  ,
  `
    <div class="item">
      <a v-toggle="'3__.1'"><i class="icon plus"></i></a>
    </div> 
  `
  )}
  <div class="dropdown">
    <ul class="dropdown-menu fluid">
      <i class="icon close" v-close="'2'"></i>
      <li>
        <div class="mdl input">
          <input id="bookmark-entry-pnew-ff" type="text" placeholder="Url"
              v-sval:${FieldType.STRING}="pnew.${Item$.url}"
              @change="pnew.$d.$change($event, pnew, ${Item0.url}, false, null)" />
        </div>
      </li>
      <li>
        <div class="mdl input">
          <input placeholder="Title" v-model.lazy.trim="pnew_title"/>
        </div>
      </li>
      <li>
        <div class="mdl input">
          <input placeholder="Notes" v-model.lazy.trim="pnew_notes"/>
        </div>
      </li>
      <li>
        <div class="mdl input">
          ${input.suggest({
            pojo: 'pnew',
            field: Item$.tagId,
            handler: 'addTag',
            fetch: user.BookmarkTag.$$NAME,
            id: 'bookmark-entry-pnew-tag',
            placeholder: 'Tag(s)'
          })}
        </div>
      </li>
      <li class="padded">
        ${list.main({ pager: 'pnew_pager' }, `
          <span class="ui label tag">
            <span :style="pojo.styles">{{ pojo.${$.Tag.$.name} }}</span>
            <i class="icon action cancel-circled" v-show="(pojo._.state & ${TagState.REMOVE})" @click="(pojo._.state ^= ${TagState.REMOVE})"></i>
            <i class="icon action ok-circled" v-show="(pojo._.state & ${TagState.REMOVE})" @click="rmTag(pojo, pojo._.state ^= ${TagState.REMOVE})"></i>
            <i class="icon action trash" @click="(pojo._.state ^= ${TagState.REMOVE})"></i>
          </span>
        `
        )}
        ${form.msg('pnew')}
      </li>
      <li class="padded right">
        <button class="ui icon button"
            v-disable="((pnew._.state & ${PojoState.LOADING}) || !pnew.${Item$.url})"
            @click="pnew$$"><i class="icon large plus"></i></button>
      </li>
    </ul>
  </div>
  <div v-if="initialized" v-show="lazy_count % 2">
    <div class="ui tab">
      ${qform.main({ qd })}
    </div>
    ${list_view('bookmark-entry-detail', 'bookmark-entry-pupdate-tag')}
  </div>
</div>`/**/
}, BookmarkEntryView)
