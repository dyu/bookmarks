import { component } from 'vuets'
import { copyp, defp, extractMsg, bit_clear_and_set } from 'coreds/lib/util'
import { PojoState, HasState } from 'coreds/lib/types'
import { diffFieldTo } from 'coreds/lib/diff'
import { bindFocus, debounce, Keys } from 'coreds-ui/lib/dom_util'
import { nextTick } from 'vue'
import { user } from '../../g/user/'
const $ = user.BookmarkEntry,
    M = user.BookmarkEntry.M

interface Config {
    url: string
    title: string
    notes: string
}


/*function $validateUrl() {}
function $validateTitle() {}
function $validateNotes() {}*/

const MAX_TAGS = 4,
    SUGGEST_TAGS_LIMIT = 12

interface Entry extends HasState {
    '6': string // title
    '7': string // notes
    tags: user.BookmarkTag.M[]
    // suggest fields
    suggest_tags: user.BookmarkTag.M[]
    tag_idx: number
    tag_name: string
}

interface M {
    original: Entry
}

function mapId(item: user.BookmarkTag.M): number {
    return item[user.BookmarkTag.M.$.id]
}

function handleKeyEvent(e: KeyboardEvent, pojo: Entry, self: Home, fn_name: string): boolean {
    let suggest_tags: user.BookmarkTag.M[],
        tag: user.BookmarkTag.M,
        idx: number
    switch (e.which) {
        case Keys.ESCAPE:
            pojo.suggest_tags = []
            break
        case Keys.DOWN:
            idx = pojo.tag_idx
            suggest_tags = pojo.suggest_tags
            if (++idx === suggest_tags.length)
                break
            
            if (idx !== 0) {
                tag = suggest_tags[idx - 1]
            }
            
            tag = suggest_tags[idx]
            // selected idx
            pojo.tag_idx = idx
            break
        case Keys.UP:
            idx = pojo.tag_idx
            if (idx === 0)
                break
            
            suggest_tags = pojo.suggest_tags
            if (idx === -1) {
                // select last
                idx = suggest_tags.length - 1
                tag = suggest_tags[idx]
                // selected idx
                pojo.tag_idx = idx
                break
            }
            
            tag = suggest_tags[--idx]
            // selected idx
            pojo.tag_idx = idx
            break
        case Keys.ENTER:
            idx = pojo.tag_idx
            if (idx !== -1)
                self[fn_name](pojo.suggest_tags[idx])
            
            break
        default:
            return true
    }
    e.preventDefault()
    e.stopPropagation()
    return false
}

export class Home {
    config: Config
    initialized = false
    unique = false
    url = ''
    pnew = {
        '6': '',
        '7': '',
        tags: [],
        suggest_tags: [],

        tag_idx: -1,
        tag_name: '',
        state: 0,
        msg: ''
    } as Entry
    pnew$$focus_tag: any
    pnew$$F: any

    pupdate = {
        '6': '',
        '7': '',
        tags: [],
        suggest_tags: [],

        tag_idx: -1,
        tag_name: '',
        state: 0,
        msg: ''
    } as Entry
    pupdate$$focus_tag: any

    pupdate$$F: any

    pnew_tag = {
        name: '',
        state: 0,
        msg: ''
    }
    pnew_tag$$F: any
    pnew_tag$$focus: any
    
    m: M

    static created(self: Home) {
        defp(self, 'm', { original: null })
        self.config = self['$root'].config

        self.pnew$$F = Home.send$$F.bind(self.pnew)
        self.pnew$$focus_tag = bindFocus('pnew-tag')

        self.pupdate$$F = Home.send$$F.bind(self.pupdate)
        self.pupdate$$focus_tag = bindFocus('pupdate-tag')

        self.pnew_tag$$F = Home.send$$F.bind(self.pnew_tag)
        self.pnew_tag$$focus = bindFocus('tag-new')
    }

    static mounted(self: Home) {
        self.url = self.config.url
        self.checkUnique$$()
    }

    static send$$F(this: HasState, err) {
        this.state = bit_clear_and_set(this.state, PojoState.LOADING, PojoState.ERROR)
        this.msg = extractMsg(err)
    }

    prepare(pojo: HasState) {
        pojo.state = bit_clear_and_set(pojo.state, PojoState.MASK_STATUS, PojoState.LOADING)
        pojo.msg = ''
    }

    success(pojo: HasState, msg?: string) {
        if (msg) {
            pojo.state = bit_clear_and_set(pojo.state, PojoState.LOADING, PojoState.SUCCESS)
            pojo.msg = msg
        } else {
            pojo.state ^= PojoState.LOADING
        }
    }

    static watch(self: Home, update: boolean) {
        self['$watch'](function () {
            return update ? self.pupdate.tag_name : self.pnew.tag_name
        }, debounce(function (val) {
            self.fetchTag(val, update)
        }, 300))
    }

    checkUnique$$() {
        // PS
        $.$URL({"1": this.url, "4": {"1": false, "2": 1}}).then((data) => {
            this.initialized = true
            
            let array: Entry[] = data['1']
            if (!array || !array.length) {
                let config = this.config,
                    pnew = this.pnew
                
                this.unique = true
                pnew[$.$.title] = config.title
                pnew[$.$.notes] = config.notes
                Home.watch(this, false)
                nextTick(this.pnew$$focus_tag)
                return
            }

            let original = array[0],
                pupdate = this.pupdate,
                tags = original[M.$.tags],
                tagCount = tags.length
            
            this.m.original = original
            pupdate[$.$.title] = original[$.$.title]
            pupdate[$.$.notes] = original[$.$.notes]
            pupdate.tags = tags
            Home.watch(this, true)
            if (tagCount < MAX_TAGS)
                nextTick(this.pupdate$$focus_tag)
        }).then(undefined, (err) => {
            // probably down?
            this.initialized = true

            let config = this.config,
                pnew = this.pnew
            
            this.unique = true
            pnew[$.$.title] = config.title
            pnew[$.$.notes] = config.notes
        })
    }
    pupdate$$str(e, field: number) {
        let pupdate = this.pupdate,
            original = this.m.original,
            mc = {},
            req
        
        if (!diffFieldTo(mc, $.$d, original, pupdate, field))
            return
        
        req = { '1': original['1'], '2': mc }

        this.prepare(pupdate)
        
        $.ForUser.updateBookmarkEntry(req).then(() => {
            let pupdate = this.pupdate,
                original = this.m.original,
                fk = String(field)
            
            original[fk] = pupdate[fk]

            this.success(pupdate, 'Updated')
        }).then(undefined, this.pupdate$$F)
    }
    fetchTag(val: string, update: boolean) {
        let pojo = update ? this.pupdate : this.pnew,
            suggest_tags = pojo.suggest_tags
        
        if (suggest_tags.length)
            pojo.suggest_tags = []
        
        if (!val)
            return
        
        this.prepare(pojo)
        
        user.BookmarkTag.$NAME({"1": val, "4": {"1": false, "2": SUGGEST_TAGS_LIMIT}}, true).then((data) => {
            let array = data['1'] as any[]
            pojo.suggest_tags = array || []
            pojo.tag_idx = -1
            
            this.success(pojo)
            nextTick(update ? this.pupdate$$focus_tag : this.pnew$$focus_tag)
        }).then(undefined, update ? this.pupdate$$F : this.pnew$$F)
    }
    pnew$$() {
        let pnew = this.pnew,
            p = {} as user.BookmarkEntry
        
        p[$.$.url] = this.url
        copyp(p, $.$.title, pnew)
        copyp(p, $.$.notes, pnew)
        
        this.prepare(pnew)
        
        $.ForUser.create($.PNew.$new(p, pnew.tags.map(mapId))).then((data) => {
            window.close()
        }).then(undefined, this.pnew$$F)
    }
    addTag(tag: user.BookmarkTag.M) {
        let id = mapId(tag),
            pnew = this.pnew,
            tags = pnew.tags,
            i = 0,
            len = tags.length
        
        pnew.suggest_tags = []
        pnew.tag_name = ''

        for (; i < len; i++) {
            if (id === mapId(tags[i])) {
                // dup
                nextTick(this.pnew$$focus_tag)
                return
            }
        }

        tags.push(tag)
        if (tags.length < MAX_TAGS)
            nextTick(this.pnew$$focus_tag)
    }
    rmTag(tag: user.BookmarkTag.M, update?: boolean) {
        let id = mapId(tag),
            pojo = update ? this.pupdate : this.pnew,
            tags = pojo.tags,
            i = 0,
            len = tags.length
        
        for (; i < len; i++) {
            if (id === mapId(tags[i])) {
                if (!update)
                    tags.splice(i, 1)
                break
            }
        }

        if (!update) {
            nextTick(this.pnew$$focus_tag)
            return
        }

        if (i === len) {
            // not found
            nextTick(this.pupdate$$focus_tag)
            return
        }
        
        this.prepare(pojo)
        
        $.ForUser.updateTag(user.UpdateTag.$new(this.m.original['1'] as string, id, true)).then((data) => {
            tags.splice(i, 1)
            
            this.success(this.pupdate, 'Updated')
            nextTick(this.pupdate$$focus_tag)
        }).then(undefined, this.pupdate$$F)

        nextTick(this.pupdate$$focus_tag)
    }
    insertTag(tag: user.BookmarkTag.M) {
        let id = mapId(tag),
            pupdate = this.pupdate,
            tags = pupdate.tags,
            i = 0,
            len = tags.length
        
        pupdate.suggest_tags = []
        pupdate.tag_name = ''

        for (; i < len; i++) {
            if (id === mapId(tags[i])) {
                // dup
                nextTick(this.pupdate$$focus_tag)
                return
            }
        }

        this.prepare(pupdate)
        
        $.ForUser.updateTag(user.UpdateTag.$new(this.m.original['1'] as string, id, false)).then((data) => {
            tags.splice(data['1'], 0, tag)
            
            this.success(this.pupdate, 'Updated')
            nextTick(this.pupdate$$focus_tag)
        }).then(undefined, this.pupdate$$F)

        nextTick(this.pupdate$$focus_tag)
    }
    pnew$$keyup(e: KeyboardEvent): boolean {
        return handleKeyEvent(e, this.pnew, this, 'addTag')
    }
    pupdate$$keyup(e: KeyboardEvent): boolean {
        return handleKeyEvent(e, this.pupdate, this, 'insertTag')
    }
    newTag(e) {
        let pnew_tag = this.pnew_tag,
            name = pnew_tag.name
        if (!name)
            return
        
        this.prepare(pnew_tag)
        
        user.BookmarkTag.ForUser.create({ "3": name }).then((data) => {
            this.success(pnew_tag, `${pnew_tag.name} added.`)
            // clear
            pnew_tag.name = ''
            nextTick(this.pnew_tag$$focus)
        }).then(undefined, this.pnew_tag$$F)
    }
}
export default component({
    created(this: Home) { Home.created(this) },
    mounted(this: Home) { Home.mounted(this) },
    template: /**/`
<div>
<template v-if="initialized">
  <div class="mdl input">
    <input class="url" :value="url" placeholder="Url" disabled />
  </div>
  <div v-if="unique">
    <div class="mdl input">
      <input v-model.lazy.trim="pnew.title" placeholder="Title"
          :disabled="!!(pnew.state & ${PojoState.LOADING})" />
    </div>
    <div class="mdl input">
      <input v-model.lazy.trim="pnew.notes" placeholder="Notes"
          :disabled="!!(pnew.state & ${PojoState.LOADING})" />
    </div>
    <div class="msg" :class="{ error: ${PojoState.ERROR} === (pnew.state & ${PojoState.MASK_STATUS}) }"
        v-show="pnew.msg">{{pnew.msg}}<button class="b" @click.prevent="pnew.msg = null">x</button></div>
    <div class="mdl input">
      <input id="pnew-tag" placeholder="Tag(s)"
          @keyup="pnew$$keyup($event)" v-model.trim="pnew.tag_name"
          :disabled="!!(pnew.state & ${PojoState.LOADING}) || pnew.tags.length === ${MAX_TAGS}" />
    </div>
    <div class="dropdown" :class="{ active: pnew.suggest_tags.length }">
      <ul class="dropdown-menu mfluid">
        <li v-for="(tag, idx) of pnew.suggest_tags" :class="{ current: idx === pnew.tag_idx }">
          <a @click.prevent="addTag(tag)">{{ tag['${user.BookmarkTag.M.$.name}'] }}</a>
        </li>
      </ul>
    </div>
    <div class="right-floated">
      <button class="pv primary" @click.prevent="pnew$$"
          :disabled="!!(pnew.state & ${PojoState.LOADING}) || (!!pnew.tag_name && !pnew.tags.length)"><b>Submit</b></button>
    </div>
    <ul class="tags">
      <li v-for="tag of pnew.tags">
        <a>
          {{ tag['${user.BookmarkTag.M.$.name}'] }}
          <button class="b" @click.prevent="rmTag(tag, false)">x</button>
        </a>
      </li>
    </ul>
  </div>
  <div v-if="!unique">
    <div class="mdl input">
      <input v-model.lazy.trim="pupdate['${$.$.title}']" @change="pupdate$$str($event, ${$.$.title})"
          :disabled="!!(pupdate.state & ${PojoState.LOADING})" placeholder="Title" />
    </div>
    <div class="mdl input">
      <input v-model.lazy.trim="pupdate['${$.$.notes}']" @change="pupdate$$str($event, ${$.$.notes})"
          :disabled="!!(pupdate.state & ${PojoState.LOADING})" placeholder="Notes" />
    </div>
    <div class="msg" :class="{ error: ${PojoState.ERROR} === (pupdate.state & ${PojoState.MASK_STATUS}) }"
        v-show="pupdate.msg">{{pupdate.msg}}<button class="b" @click.prevent="pupdate.msg = null">x</button></div>
    <div class="mdl input">
      <input id="pupdate-tag" placeholder="Tag(s)"
          @keyup="pupdate$$keyup($event)" v-model.trim="pupdate.tag_name"
          :disabled="!!(pupdate.state & ${PojoState.LOADING}) || pupdate.tags.length === ${MAX_TAGS}" />
    </div>
    <div class="dropdown" :class="{ active: pupdate.suggest_tags.length }">
      <ul class="dropdown-menu mfluid">
        <li v-for="(tag, idx) of pupdate.suggest_tags" :class="{ current: idx === pupdate.tag_idx }">
          <a @click.prevent="insertTag(tag)">{{ tag['${user.BookmarkTag.M.$.name}'] }}</a>
        </li>
      </ul>
    </div>
    <ul class="tags">
      <li v-for="tag of pupdate.tags">
        <a>
          {{ tag['${user.BookmarkTag.M.$.name}'] }}
          <button class="b" @click.prevent="rmTag(tag, true)"
              :disabled="!!(pupdate.state & ${PojoState.LOADING})">x</button>
        </a>
      </li>
    </ul>
  </div>
  <div id="bk-tag">
    <div class="mdl input">
      <input id="tag-new" placeholder="Add tag" v-model.trim="pnew_tag.name" @change="newTag($event)"
          :disabled="!!(pnew_tag.state & ${PojoState.LOADING})" />
    </div>
    <div class="msg" :class="{ error: ${PojoState.ERROR} === (pnew_tag.state & ${PojoState.MASK_STATUS}) }"
        v-show="pnew_tag.msg">{{pnew_tag.msg}}<button class="b" @click.prevent="pnew_tag.msg = null">x</button></div>
  </div>
</template>
</div>`/**/
}, Home)
