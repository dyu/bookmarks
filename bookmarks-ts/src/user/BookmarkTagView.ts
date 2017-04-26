import { component } from 'vuets'
import { PojoState, PojoSO, Pager, PagerState, ItemSO, SelectionFlags } from 'vueds/lib/types'
import { defp, nullp } from 'vueds/lib/util'
import { mergeVmFrom } from 'vueds/lib/diff'
import {
    initObservable, 
    formPrepare, formSuccess, bindFormFailed, 
    formUpdate, formUpdateSuccess, bindFormUpdateFailed
} from 'vueds'
import {
    PojoStore, bindFetchFailed
} from 'vueds/lib/store/'
import { HasToken } from 'vueds/lib/rpc/'
import { focus } from 'vueds-ui/lib/dom_util'
import * as menu from 'vueds-ui/lib/tpl/legacy/menu'
import * as form from 'vueds-ui/lib/tpl/legacy/form'
import * as list from 'vueds-ui/lib/tpl/legacy/list'
import * as pager_controls from 'vueds-ui/lib/tpl/legacy/pager_controls'
import * as icons from 'vueds-ui/lib/tpl/legacy/icons'

import { ds } from 'vueds/lib/ds/'
// TODO import common module
import { HT, stores } from './context'
import { user } from '../../g/user/'
import { qd, QForm } from '../../g/user/BookmarkTagQForm'
import * as qform from 'vueds-ui/lib/tpl/legacy/qform'

const $ = user.BookmarkTag,
    $$ = $.$,
    $0 = $.$descriptor.$

const FETCH_INITIAL = 900,
    PAGE_SIZE = 10

export class BookmarkTagView {

    lazy_count = 0
    initialized = false
    pager: Pager
    pstore: PojoStore<user.BookmarkTag>
    qform = new QForm()

    fetched_all = false
    fetch$$S: any
    fetch$$F: any

    pnew = initObservable($.$createObservable(), $.$descriptor)
    pnew$$S: any
    pnew$$F: any

    pupdate = initObservable($.$createObservable(), $.$descriptor)
    pupdate$$S: any
    pupdate$$F: any

    constructor() {
        nullp(this, 'pager')
    }

    static created(self: BookmarkTagView) {
        self.pager = defp(self, 'pstore', stores.tag = new PojoStore([], {
            desc: true,
            pageSize: PAGE_SIZE,
            descriptor: $.$descriptor,
            createObservable(so: ItemSO, idx: number) {
                return $.$createObservable()
            },
            onSelect(selected: user.BookmarkTag, flags: SelectionFlags): number {
                if (!(flags & SelectionFlags.CLICKED_UPDATE))
                    return 0

                let selected_ = selected['_'] as PojoSO,
                    state = selected_.state,
                    pupdate = self.pupdate,
                    pupdate_: PojoSO,
                    original

                if ((flags & SelectionFlags.REFRESH)) {
                    if (!(state & PojoState.UPDATE))
                        return 0
                } else if (!(state & PojoState.UPDATE)) {
                    selected_.state = state | PojoState.UPDATE
                    if (selected.key === pupdate.key)
                        return 0
                } else if (selected.key === pupdate.key) {
                    selected_.state = state ^ PojoState.UPDATE
                    return 0
                }

                pupdate_ = pupdate['_'] as PojoSO
                original = self.pstore.getOriginal(selected)

                mergeVmFrom(original, selected['$d'], pupdate)
                if (pupdate_.msg)
                    pupdate_.msg = ''

                // TODO
                // call renderDetail or fetchDetail based on original's props

                return 0
            },
            fetch(req: ds.ParamRangeKey, pager: Pager) {
                if (req.limit && !(pager.state & PagerState.RELOAD))
                    req.limit = 500
                
                self.qform.send(req)
            }
        })).pager

        self.fetch$$S = BookmarkTagView.fetch$$S.bind(self)
        self.fetch$$F = bindFetchFailed(self.pstore)
        QForm.init(self.qform, self, {
            pager: self.pager, 
            cbSuccess: self.fetch$$S, 
            cbFailed: self.fetch$$F,
            hasToken: HT,
            list(prk: ds.ParamRangeKey, hasToken: HasToken): PromiseLike<any> {
                return $.ForUser.listBookmarkTag(prk)
            }
        })
        // TODO fetched fields init

        self.pnew$$S = BookmarkTagView.pnew$$S.bind(self)
        self.pnew$$F = bindFormFailed(self.pnew)

        let update_scope = { pager: self.pager, pojo: self.pupdate }
        self.pupdate$$S = BookmarkTagView.pupdate$$S.bind(self)
        self.pupdate$$F = bindFormUpdateFailed(update_scope)

        // TODO toggles/actions init

        // TODO fetch fields state defaults
    }

    static activate(self: BookmarkTagView) {
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
        $.ForUser.listMostBookmarkTag(user.ParamInt.$create(FETCH_INITIAL))
            .then(this.fetch$$S).then(undefined, this.fetch$$F)
    }

    static fetch$$S(this: BookmarkTagView, data: any): boolean {
        if (!this.initialized) {
            this.initialized = true
            this.pager.msg = ''
            this.pager.state ^= PagerState.LOADING
            this.pstore.addAll(data['1'], false, false)
        } else if (this.fetched_all) {
            this.pstore.cbFetchSuccess(data['1'])
        } else {
            this.fetched_all = 0 !== (this.pager.state & PagerState.LOAD_NEWER) &&
                    (!data['1'] || !data['1'].length)
            
            this.pstore.cbFetchSuccess(data['1'])
        }

        return true
    }

    static pnew$$S(this: BookmarkTagView, data): boolean {
        let pnew = this.pnew
        if (pnew.key) {
            pnew.key = ''
            this.pstore.addAll(data['1'], true, true)
        }
        
        formSuccess(pnew)
        focus('bookmark-tag-pnew-ff')
        return true
    }
    pnew$$() {
        let pnew = this.pnew

        // TODO validation for fetched data

        if (!formPrepare(pnew))
            return

        let lastSeen = this.pstore.getLastSeenObj()

        if (this.fetched_all && lastSeen)
            pnew.key = lastSeen['1']
        
        $.ForUser.create(pnew)
            .then(this.pnew$$S).then(undefined, this.pnew$$F)
    }
    static pupdate$$S(this: BookmarkTagView): boolean {
        let pager = this.pager,
            selected = pager.pojo as user.BookmarkTag,
            original = this.pstore.getOriginal(selected)

        // TODO fetched fields check update and merge to original

        formUpdateSuccess(this.pupdate, pager, original, selected)
        return true
    }
    pupdate$$() {
        let pager = this.pager,
            selected = pager.pojo as user.BookmarkTag,
            original = this.pstore.getOriginal(selected),
            // TODO fetched fields
            mc = formUpdate(this.pupdate, pager, original/*, TODO*/)

        if (!mc/* && !TODO */)
            return
        
        $.ForUser.update(ds.ParamUpdate.$create(original['1'], mc, selected.id))
            .then(this.pupdate$$S).then(undefined, this.pupdate$$F)
    }
    // TODO toggles/actions
}
export default component({
    created(this: BookmarkTagView) { BookmarkTagView.created(this) },
    template: /**/`
<div v-pager="pager">
  ${menu.pager_lazy({ title: 'Tags', pager: 'pager', search_fk: $0.name }, `
    <li v-toggle="'5__.2__0.0'"><a><i class="icon filter"></i></a></li>
  `
  ,
  `
    <div class="item">
      <a v-toggle="'3__.1'"><i class="icon plus"></i></a>
    </div>
  `
  )}
  <div class="ui tab attached message">
    <i class="icon close" v-close="'1'"></i>
    ${form.main({
      pojo: 'pnew',
      $d: $.$descriptor,
      on_submit: 'pnew$$',
      use_switch: true,
      ffid: 'bookmark-tag-pnew-ff'
    })}
  </div>
  <div v-if="initialized" v-show="lazy_count % 2">
    <div class="ui tab">
      ${qform.main({ qd })}
    </div>
    ${pager_controls.main({ pager: 'pager', top: true })}
    ${list.main({ pager: 'pager' }, `
      <div class="content right floated alt">
        ${icons.timeago({ pojo: 'pojo' })}
      </div>
      <div class="content main">
        <span :style="{ color: '#' + (pojo.${$$.color} || '555555') }">{{ pojo.${$$.name} }}</span>
      </div>
      <div v-show="pojo._.state & ${PojoState.UPDATE}" v-append:bookmark-tag-detail="pojo._.state & ${PojoState.UPDATE}"></div>
    `
    )}
    <div style="display:none">
      <div id="bookmark-tag-detail">
        <div class="detail">
          <hr />
          ${form.main({
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
</div>`/**/
}, BookmarkTagView)