import { ContentSlot } from './util'
import { PojoState, FieldType } from 'coreds/lib/types'

export const enum FormFlags {
    PLACEHOLDER = 1,
    REF_AND_ID = 2
}

function msg_show(pojo: string): string {
    return ` && (${pojo}._.state & ${PojoState.MASK_STATUS})`
}

export function msg(pojo: string, update: boolean): string {
    return /**/`
<div :class="'ui msg status-' + (${pojo}._.state & ${PojoState.MASK_STATUS})"
    v-show="${pojo}._.msg${update && msg_show(pojo) || ''}">
  <i class="icon close" @click.prevent="${pojo}._.msg = null"></i>
  <span v-text="${pojo}._.msg"></span>
</div>
`/**/
}

export function form(pojo: string, $d: any, ffid: string|null, 
        content?: string, content_slot?: ContentSlot, formFlags?: FormFlags): string {
    let update = ffid === null,
        flags = formFlags || 0,
        class_prefix = `ui form${(flags & FormFlags.PLACEHOLDER) && ' placeholder' || ''} status-`
    
    if (content && content_slot === undefined)
        content_slot = ContentSlot.TOP

    return /**/`
<form v-clear="${pojo}._" :class="'${class_prefix}' + (${pojo}._.state & ${PojoState.MASK_STATUS})">
  ${content_slot === ContentSlot.TOP && content || ''}
  ${body(pojo, $d, update, { pojo, ffid, flags })}
  ${content_slot === ContentSlot.BOTTOM && content || ''}
  ${msg(pojo, update)}
  <button type="submit" class="outlined" @click.prevent="${pojo}$$">
    ${update ? 'Update' : 'Submit'}
  </button>
</form>
`/**/
}

interface FormRoot {
    pojo: string
    ffid: string|null
    flags: FormFlags
}

function body(pojo: string, $d: any, update: boolean, root: FormRoot): string {
    let out = '',
        array = $d.$fdf

    if ($d.$fmf) {
        for (let fk of $d.$fmf) {
            out += body(`${pojo}['${fk}']`, $d[fk].d_fn(), update, root)
        }
    }

    if (!array)
        return out

    let mask = update ? 13 : 3, 
        ffid = root.ffid

    if (ffid && array.length)
        root.ffid = null

    for (var i = 0, len = array.length; i < len; i++) {
        let fk = array[i],
            fd = $d[fk]
        if (!fd.t || (fd.a & mask)) continue

        out += `<div ${field_class(pojo, fd)}>${field_switch(pojo, fd, update, root, i, ffid)}</div>`
        ffid = null
    }

    return out
}

function field_class(pojo: string, fd: any): string {
    let base = fd.m === 2 ? 'field required' : 'field'
    if (fd.t === FieldType.BOOL || fd.t === FieldType.ENUM)
        return `class="${base}"`
    else
        return `:class="'${base}' + ((${pojo}._.vfbs & ${1 << (fd._ - 1)}) && ${pojo}._['${fd._}'] && ' error' || '')"`
}

function field_switch(pojo: string, fd: any, update: boolean, root: FormRoot, idx: number, ffid: any): string {
    let buf = '',
        t = fd.t

    if (t !== FieldType.BOOL && 0 === (root.flags & FormFlags.PLACEHOLDER))
        buf += `<label>${fd.$n}${fd.m === 2 && ' *' || ''}</label>`

    if (t === FieldType.BOOL)
        buf += field_bool(pojo, fd, update, root, ffid)
    else if (t === FieldType.ENUM)
        buf += field_enum(pojo, fd, update, root, ffid)
    else if (t !== FieldType.STRING)
        buf += field_num(pojo, fd, update, root, ffid)
    else if (fd.ta)
        buf += field_textarea(pojo, fd, update, root, ffid)
    else
        buf += field_default(pojo, fd, update, root, ffid)

    return buf
}

function ffid_attr(ffid, flags: number): string {
    return ` ref="${ffid}"${(flags & FormFlags.REF_AND_ID) && (' id="' + ffid + '"') || ''}`
}

function help_text(str): string {
    return /**/`<div class="help-text">${str}</div>`/**/
}

function placeholder(fd: any) {
    return ` placeholder="${fd.$n}${fd.m === 2 && ' *' || ''}"`
}

function field_bool(pojo: string, fd: any, update: boolean, root: FormRoot, ffid: any): string {
    return /**/`
<label class="switch">
  <input${ffid && ffid_attr(ffid, root.flags) || ''} type="checkbox" v-sval:${fd.t}="${pojo}['${fd._}']"
      @change="change($event, '${fd._}', ${pojo}, ${update}, ${root.pojo})" />
  <i></i> ${fd.$n}
</label>
`/**/
}

export const option_empty = '<option value=""></option>'
function enum_option(fd: any) {
    return `<option value="">${fd.$n}${fd.m === 2 && ' *' || ''}</option>`
}
export function enum_options(arrayValue: any[], arrayDisplay: any[]): string {
    let out = ''
    for (var i = 0, len = arrayValue.length; i < len; i++) {
        out += `<option value="${arrayValue[i]}">${arrayDisplay[i]}</option>`
    }
    return out
}
function field_enum(pojo: string, fd: any, update: boolean, root: FormRoot, ffid: any): string {
    return /**/`
<div class="fluid picker">
  <select${ffid && ffid_attr(ffid, root.flags) || ''} v-sval:${fd.t}="${pojo}['${fd._}']"
      ${!update && 'class="resettable"' || ''}
      @change="change($event, '${fd._}', ${pojo}, ${update}, ${root.pojo})">
      ${update ? '' : ((root.flags & FormFlags.PLACEHOLDER) && enum_option(fd) || '')}
      ${enum_options(fd.v_fn(), fd.$v_fn())}
  </select>
</div>
`/**/
}

// datepicker flags copied here
export const enum DPFlags {
    UPDATE = 16,
    TRIGGER_CHANGE_ON_SELECT = 32
}
export function dpicker(pojo: string, field: number, update: boolean): string {
    return ` v-dpicker:${DPFlags.TRIGGER_CHANGE_ON_SELECT | (update ? DPFlags.UPDATE : 0)}="{ pojo: ${pojo}, field: '${field}' }"`
}
function field_num(pojo: string, fd: any, update: boolean, root: FormRoot, ffid: any): string {
    return /**/`
<div class="ui input">
  <input${ffid && ffid_attr(ffid, root.flags) || ''} type="text"${fd.o === 2 && dpicker(pojo, fd._, update) || ''}
      ${(root.flags & FormFlags.PLACEHOLDER) && placeholder(fd) || ''}
      v-sval:${!fd.o ? fd.t : (fd.t + ',' + fd.o)}="${pojo}['${fd._}']"
      @change="change($event, '${fd._}', ${pojo}, ${update}, ${root.pojo})" />
  ${fd.$h && help_text(fd.$h) || ''}
  <div v-text="!(${pojo}._.vfbs & ${1 << (fd._ - 1)}) ? '' : ${pojo}._['${fd._}']"></div>
</div>
`/**/
}

function field_textarea(pojo: string, fd: any, update: boolean, root: FormRoot, ffid: any): string {
    return /**/`
<div class="ui input">
  <textarea${ffid && ffid_attr(ffid, root.flags) || ''} v-sval:${fd.t}="${pojo}['${fd._}']"
      ${(root.flags & FormFlags.PLACEHOLDER) && placeholder(fd) || ''}
      @change="change($event, '${fd._}', ${pojo}, ${update}, ${root.pojo})"></textarea>
  ${fd.$h && help_text(fd.$h) || ''}
  <div v-text="!(${pojo}._.vfbs & ${1 << (fd._ - 1)}) ? '' : ${pojo}._['${fd._}']"></div>
</div>
`/**/
}

function field_default(pojo: string, fd: any, update: boolean, root: FormRoot, ffid: any): string {
    return /**/`
<div class="ui input">
  <input${ffid && ffid_attr(ffid, root.flags) || ''} type="${fd.pw ? 'password' : 'text'}"
      ${(root.flags & FormFlags.PLACEHOLDER) && placeholder(fd) || ''}
      v-sval:${fd.t}="${pojo}['${fd._}']"
      @change="change($event, '${fd._}', ${pojo}, ${update}, ${root.pojo})" />
  ${fd.$h && help_text(fd.$h) || ''}
  <div v-text="!(${pojo}._.vfbs & ${1 << (fd._ - 1)}) ? '' : ${pojo}._['${fd._}']"></div>
</div>
`/**/
}
