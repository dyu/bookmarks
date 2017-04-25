import { component } from 'vuets'

import { BookmarkTagView, default as BookmarkTagViewC } from './BookmarkTagView'
import { default as BookmarkEntryViewC } from './BookmarkEntryView'

export class HomePage {
    bookmark_tag_v: BookmarkTagView

    static activate(self: HomePage) {
        let bookmark_tag_v = self.bookmark_tag_v || (self.bookmark_tag_v = self['$refs']['bookmark_tag_v'])
        BookmarkTagView.activate(bookmark_tag_v)
    }
}
export default component({
    mounted(this: HomePage) { HomePage.activate(this) },
    components: {
        BookmarkTagViewC,
        BookmarkEntryViewC
    },
    template: /**/`
<div class="row">
  <div class="col-pl-100 col-tp-50 col-tl-66">
    <bookmark-entry-view-c />
  </div>
  <div class="col-pl-100 col-tp-50 col-tl-33">
    <bookmark-tag-view-c ref="bookmark_tag_v" />
  </div>
</div>`/**/
}, HomePage)
