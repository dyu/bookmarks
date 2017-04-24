import { component } from 'vuets'
import { PojoState, PojoSO, Pager, PagerState, ItemSO, SelectionFlags } from 'vueds/lib/types'
import { defp, nullp } from 'vueds/lib/util'
import { mergeVmFrom } from 'vueds/lib/diff'
import {
    initObservable,
    formPrepare, formSuccess, bindFormFailed,
    formUpdate, formUpdateSuccess, bindFormUpdateFailed,
    toggleUpdate, bindToggleUpdateSuccess, bindToggleUpdateFailed
} from 'vueds'
import { PojoStore, bindFetchFailed } from 'vueds/lib/store/'
import { HasToken } from 'vueds/lib/rpc/'
import { focus } from 'vueds-ui/lib/dom_util'
import * as form from 'vueds-ui/lib/tpl/legacy/form'
import * as list from 'vueds-ui/lib/tpl/legacy/list'
import * as icons from 'vueds-ui/lib/tpl/legacy/icons'

import { ds } from 'vueds/lib/ds/'
import { user } from '../../g/user/'
import { qd, QForm } from '../../g/user/TodoQForm'
import * as qform from 'vueds-ui/lib/tpl/legacy/qform'

const PAGE_SIZE = 10,
    MULTIPLIER = 3

// dummy
const HT: HasToken = {
    token: ''
}

const $ = user.Todo,
    $$ = $.$

export class TodoView {
    // provided
    initialized = false
    pager: Pager
    pstore: PojoStore<user.Todo>
    qform = new QForm()

    fetch$$S: any
    fetch$$F: any

    pnew = initObservable($.$createObservable(), $.$descriptor)
    pnew$$S: any
    pnew$$F: any

    pupdate = initObservable($.$createObservable(), $.$descriptor)
    pupdate$$S: any
    pupdate$$F: any

    toggle$$S: any
    toggle$$F: any

    constructor() {
        nullp(this, 'pager')
    }

    static created(self: TodoView) {
        self.pager = defp(self, 'pstore', new PojoStore([], {
            desc: true,
            pageSize: PAGE_SIZE,
            multiplier: MULTIPLIER,
            descriptor: $.$descriptor,
            createObservable(so: ItemSO, idx: number) {
                return $.$createObservable()
            },
            onSelect(selected: user.Todo, flags: SelectionFlags): number {
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

        self.fetch$$S = TodoView.fetch$$S.bind(self)
        self.fetch$$F = bindFetchFailed(self.pstore)
        QForm.init(self.qform, self, {
            pager: self.pager, 
            cbSuccess: self.fetch$$S, 
            cbFailed: self.fetch$$F,
            hasToken: HT,
            list(prk: ds.ParamRangeKey, hasToken: HasToken): PromiseLike<any> {
                return $.ForUser.list(prk)
            }
        })
        // TODO fetched fields init

        self.pnew$$S = TodoView.pnew$$S.bind(self)
        self.pnew$$F = bindFormFailed(self.pnew)

        let update_scope = { pager: self.pager, pojo: self.pupdate }
        self.pupdate$$S = TodoView.pupdate$$S.bind(self)
        self.pupdate$$F = bindFormUpdateFailed(update_scope)

        self.toggle$$S = bindToggleUpdateSuccess(update_scope)
        self.toggle$$F = bindToggleUpdateFailed(self.pager)

        // TODO fetch fields state defaults
    }

    static activate(self: TodoView) {
        if (self.initialized || (self.pager.state & PagerState.LOADING))
            return

        self.pstore.requestNewer()
    }

    static fetch$$S(this: TodoView, data: any): boolean {
        if (!this.initialized)
            this.initialized = true

        this.pstore.cbFetchSuccess(data['1'])
        return true
    }

    static pnew$$S(this: TodoView, data): boolean {
        this.pstore.addAll(data['1'], true, true)

        // TODO reset

        let pnew = this.pnew
        pnew.key = ''

        formSuccess(pnew)
        focus('todo-pnew-ff')
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

    static pupdate$$S(this: TodoView): boolean {
        let pager = this.pager,
            selected = pager.pojo as user.Todo,
            original = this.pstore.getOriginal(selected)

        // TODO fetched fields check update and merge to original

        formUpdateSuccess(this.pupdate, pager, original, selected)
        return true
    }
    pupdate$$() {
        let pager = this.pager,
            selected = pager.pojo as user.Todo,
            original = this.pstore.getOriginal(selected),
            // TODO fetched fields
            mc = formUpdate(this.pupdate, pager, original/*, TODO*/)

        if (!mc/* && !TODO */)
            return

        $.ForUser.update(ds.ParamUpdate.$create(String(selected.key), mc))
            .then(this.pupdate$$S).then(undefined, this.pupdate$$F)
    }
    toggle$$(selected: user.Todo, field: string) {
        let mc = toggleUpdate(this.pager, field)
        if (!mc)
            return

        $.ForUser.update(ds.ParamUpdate.$create(String(selected.key), mc))
            .then(this.toggle$$S).then(undefined, this.toggle$$F)
    }
}
export default component({
    created(this: TodoView) { TodoView.created(this) },
    template: /**/`
<div class="col-pp-100 col-pl-50 col-tl-33" v-pager="pager">
<template v-if="initialized">
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
  <div class="ui tab box">
    ${form.main({
      pojo: 'pnew',
      $d: $.$descriptor,
      on_submit: 'pnew$$',
      ffid: 'todo-pnew-ff'
    })}
  </div>
  <div class="ui tab">
    ${qform.main({ qd })}
  </div>
  ${list.main({ pager: 'pager' }, `
    <div class="content right floated">
      ${icons.toggle({
        pojo: 'pojo',
        field: $$.completed,
        bit: 32,
        fn: 'toggle$$',
        title_expr: `pojo.${$$.completed} ? 'Completed' : 'Mark Completed?'`
      })}
    </div>
    <div class="content">
      <small class="description">
        ${icons.timeago({ pojo: 'pojo', skip_rev: true })}
      </small>
    </div>
    <div class="content dd" v-sclass:completed="pojo.${$$.completed}">
      {{ pojo.${$$.title} }}
    </div>
    <div v-show="pojo._.state & ${PojoState.UPDATE}" v-append:todo-detail="pojo._.state & ${PojoState.UPDATE}"></div>
  `
  )}
  <div style="display:none">
    <div id="todo-detail" class="detail" v-show="pupdate.key">
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
</template>
</div>`/**/
}, TodoView)
