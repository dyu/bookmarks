import { FieldType, PagerState, ChangeFlags } from 'coreds/lib/types'
import { enum_options, option_empty, dpicker } from './form'
import { Flags } from 'coreds-ui/lib/_suggest'

function field_enum(pojo: string, fd: any, display: string): string {
    return /**/`
<div class="fluid picker">
  <select :disable="${pojo}.disable_" v-sval:${fd.t}="${pojo}['${fd._}']"
      @change="qform.change($event, '${fd._}', ${pojo}, false, null, 0, ${pojo}$$)">
    <option value="">${display}</option>${enum_options(fd.v_fn(), fd.$v_fn())}
  </select>
</div>
`/**/
}

function field_bool(pojo: string, fd: any, display: string): string {
    return /**/`
<div class="fluid picker">
<select v-sval:${fd.t}="${pojo}['${fd._}']" :disable="${pojo}.disable_" 
    :class="'icons' + (!${pojo}['${fd._}'] ? '' : ' active') + (!${pojo}.disable_ ? '' : ' disabled')"
    @change="qform.change($event, '${fd._}', ${pojo}, false, null, 0, ${pojo}$$)">
  <option value="">${display}:</option>
  <option value="1">${fd.$n} &#xe9fc;</option>
  <option value="0">${fd.$n} &#xea00;</option>
</select>
</div>
`/**/
}

function field_suggest(pojo: string, fd: any, display: string): string {
    return /**/`
<div class="ui input">
  <input type="text" :disabled="${pojo}.disable_" placeholder="${display}"
      :class="!${pojo}.disable_ ? '' : 'disabled'"
      v-suggest:${Flags.CBFN_AFTER_SET}="{ pojo: ${pojo}, field: '${fd._}', fetch: suggest, onSelect: ${pojo}$$ }" />
</div>
`/**/
}

function field_num(pojo: string, fd: any, display: string): string {
    return /**/`
<div class="ui input">
  <input type="text"${fd.o === 2 && dpicker(pojo, fd._, false) || ''}
      :disabled="${pojo}.disable_" placeholder="${display}"
      :class="!${pojo}.disable_ ? '' : 'disabled'"
      v-sval:${fd.t}${!fd.o ? '' : (',' + fd.o)}="${pojo}['${fd._}']"
      @change="qform.change($event, '${fd._}', ${pojo}, false, null, 0, ${pojo}$$)" />
</div>
`/**/
}

function field_num_range(pojo: string, fd: any, display: string): string {
    let sval = `${fd.t}${!fd.o ? '' : (',' + fd.o)}`
    return /**/`
<div class="ui input">
  <input type="text"${fd.o === 2 && dpicker(pojo, fd._, false) || ''}
      :disabled="${pojo}.disable_" placeholder="${display}"
      :class="!${pojo}.disable_ ? '' : 'disabled'"
      v-sval:${sval}="${pojo}['${fd._}']"
      @change="qform.change($event, '${fd._}', ${pojo}, false, null, 0, ${pojo}$$)" />
</div>
<div class="ui input">
  <input type="text"${fd.o === 2 && dpicker(pojo + '$', fd._, false) || ''}
      :disabled="${pojo}.disable_" placeholder="End ${display}"
      :class="!${pojo}.disable_ ? '' : 'disabled'"
      v-sval:${sval}="${pojo}$['${fd._}']"
      @change="qform.change($event, '${fd._}', ${pojo}$, false, null, 0, ${pojo}$$)" />
</div>
`/**/
}

function field_default(pojo: string, fd: any, display: string, flags: number): string {
    return /**/`
<div class="ui input">
  <input type="text" :disabled="${pojo}.disable_" placeholder="${display}"
      :class="!${pojo}.disable_ ? '' : 'disabled'"
      v-sval:${fd.t}${!fd.o ? '' : (',' + fd.o)}="${pojo}['${fd._}']"
      @change="qform.change($event, '${fd._}', ${pojo}, false, null, ${flags}, ${pojo}$$)" />
</div>
`/**/
}

function filter_fields(qd: any, jso: any, fields: number[], pojo: string, nf: string): string {
    let buf = '',
        descriptor = qd.$d,
        fd,
        fk,
        disable,
        display,
        suggestKind

    buf += `<div class="field" v-show="${pojo}.show__ && ${pojo}.show_">`
    for (let i = 0, len = fields.length; i < len; i++) {
        fk = String(fields[i])
        if (jso['i' + fk])
            continue

        fd = descriptor[fk]
        disable = pojo + '.disable_'
        if (jso['r' + fk])
            display = fd.$n + ' *'
        else
            display = fd.$n

        suggestKind = jso['s' + fk]
        if (suggestKind) {
            buf += field_suggest(pojo, fd, display)
        } else if (fd.t === FieldType.BOOL) {
            buf += field_bool(pojo, fd, display)
        } else if (fd.t === FieldType.ENUM) {
            buf += field_enum(pojo, fd, display)
        } else if (fd.t !== FieldType.STRING) {
            // check range
            buf += (jso['e' + fk] ? field_num_range(pojo, fd, display) : field_num(pojo, fd, display))
        } else if (jso['p' + fk]) {
            buf += field_default(pojo, fd, display, ChangeFlags.SKIP_VALIDATE)
        } else {
            buf += field_default(pojo, fd, display, 0)
            // TODO range for string?
            /*if (jso['e' + fk]) {

            }*/
        }
    }

    buf += '</div>'
    return buf
}

function items(qd: any, values: any[]): string {
    let buf = '',
        key_array = qd.key_array,
        jso

    for (let i = 0, len = key_array.length; i < len; i++) {
        jso = qd[key_array[i]]
        if (!jso || !jso.fields)
            continue
        buf += filter_fields(qd, jso, jso.fields, `qform.${jso.$}`, String(values[i]))
    }

    return buf
}

export function qform(qd: any) {
    let values = qd.value_array
    return /**/`
<div class="fluid picker">
  <select :disabled="0 !== (pager.state & ${PagerState.MASK_RPC_DISABLE})" @change="qform.change($event)">
  ${option_empty}
  ${enum_options(values, qd.display_array)}
  </select>
</div>
<form class="ui form" onsubmit="return false;">
  ${items(qd, values)}
</form>
`/**/
}
