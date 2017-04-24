import { PagerState } from 'vueds/lib/types'

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