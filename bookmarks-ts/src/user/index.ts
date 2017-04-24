import { component } from 'vuets'

import { BookmarkTagView, default as BookmarkTagViewC } from './BookmarkTagView'

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
        BookmarkTagViewC
    },
    template: /**/`
<div class="row">
  <bookmark-tag-view-c ref="bookmark_tag_v"></bookmark-tag-view-c>
</div>`/**/
}, HomePage)
