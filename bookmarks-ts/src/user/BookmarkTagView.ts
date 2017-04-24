import { component } from 'vuets'
import { PojoState, PojoSO, Pager, PagerState, ItemSO, SelectionFlags } from 'vueds/lib/types'
import { defp, nullp } from 'vueds/lib/util'
import { mergeVmFrom } from 'vueds/lib/diff'
import {
    initObservable, 
    formPrepare, formSuccess, bindFormFailed,
    formUpdate, formUpdateSuccess, bindFormUpdateFailed
} from 'vueds'
import { PojoStore, bindFetchFailed } from 'vueds/lib/store/'
import { HasToken } from 'vueds/lib/rpc/'
import { focus } from 'vueds-ui/lib/dom_util'
import * as form from 'vueds-ui/lib/tpl/legacy/form'
import * as list from 'vueds-ui/lib/tpl/legacy/list'
import * as icons from 'vueds-ui/lib/tpl/legacy/icons'
import { UI_MENU_BAR } from './context'

import { ds } from 'vueds/lib/ds/'
import { user } from '../../g/user/'
import { qd, QForm } from '../../g/user/BookmarkTagQForm'
import * as qform from 'vueds-ui/lib/tpl/legacy/qform'

const PAGE_SIZE = 10,
    MULTIPLIER = 3

// dummy
const HT: HasToken = {
    token: ''
}

const $ = user.BookmarkTag,
    $$ = $.$

export class BookmarkTagView {
    // provided
    initialized = false
    pager: Pager
    pstore: PojoStore<user.BookmarkTag>
    qform = new QForm()

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
        self.pager = defp(self, 'pstore', new PojoStore([], {
            desc: true,
            pageSize: PAGE_SIZE,
            multiplier: MULTIPLIER,
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

                // TODO fetch extra fields here

                return 0
            },
            fetch(prk: ds.ParamRangeKey, pager: Pager) {
                self.qform.send(prk)
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
        if (self.initialized || (self.pager.state & PagerState.LOADING))
            return

        self.pstore.requestNewer()
    }

    static fetch$$S(this: BookmarkTagView, data: any): boolean {
        if (!this.initialized)
            this.initialized = true

        this.pstore.cbFetchSuccess(data['1'])
        return true
    }

    static pnew$$S(this: BookmarkTagView, data): boolean {
        this.pstore.addAll(data['1'], true, true)

        // TODO reset

        let pnew = this.pnew
        pnew.key = ''

        formSuccess(pnew)
        focus('bookmark-tag-pnew-ff')
        return true
    }
    pnew$$() {
        let req = this.pnew/*,
            pnew_ = pnew['_'] as PojoSO*/

        // TODO validation for fetched data

        if (!formPrepare(req))
            return

        let lastSeen = this.pstore.getLastSeenObj()

        if (lastSeen)
            req.key = lastSeen['1']

        $.ForUser.create(req)
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

        $.ForUser.update(ds.ParamUpdate.$create(original['1'], mc))
            .then(this.pupdate$$S).then(undefined, this.pupdate$$F)
    }
    // TODO toggles/actions
}
export default component({
    created(this: BookmarkTagView) { BookmarkTagView.created(this) },
    template: /**/`
<div class="col-pp-100 col-pl-50 col-tl-33" v-pager="pager">
<template v-if="initialized">
  ${UI_MENU_BAR}
  <div class="ui tab">
    <i class="icon close" v-close="'1'"></i>
    ${form.main({
      pojo: 'pnew',
      $d: $.$descriptor,
      on_submit: 'pnew$$',
      ffid: 'bookmark-tag-pnew-ff'
    })}
  </div>
  <div class="ui tab">
    ${qform.main({ qd })}
  </div>
  ${list.main({ pager: 'pager' }, `
    <div class="content">
      <small class="description">
        ${icons.timeago({ pojo: 'pojo' })}
      </small>
    </div>
    <div class="content dd">
      {{ pojo.${$$.name} }}
    </div>
    <div v-show="pojo._.state & ${PojoState.UPDATE}" v-append:bookmark-tag-detail="pojo._.state & ${PojoState.UPDATE}"></div>
  `
  )}
  <div style="display:none">
    <div id="bookmark-tag-detail" class="detail" v-show="pupdate.key">
      <hr />
      ${form.main({
        pojo: 'pupdate',
        $d: $.$descriptor,
        on_submit: 'pupdate$$',
        update: true
      })}
    </div>
  </div>
</template>
</div>`/**/
}, BookmarkTagView)