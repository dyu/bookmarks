//========================================================================
//Copyright 2017 David Yu
//------------------------------------------------------------------------
//Licensed under the Apache License, Version 2.0 (the "License");
//you may not use this file except in compliance with the License.
//You may obtain a copy of the License at 
//http://www.apache.org/licenses/LICENSE-2.0
//Unless required by applicable law or agreed to in writing, software
//distributed under the License is distributed on an "AS IS" BASIS,
//WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//See the License for the specific language governing permissions and
//limitations under the License.
//========================================================================

package bookmarks.user;

import com.dyuproject.protostuffdb.tag.TagIndexFactory;

/**
 * TODO
 * 
 * @author David Yu
 * @created Apr 24, 2017
 */
public final class BookmarkTagIndexFactory extends
        TagIndexFactory<TagIndex1, TagIndex2, TagIndex3, TagIndex4>
{
    static final BookmarkTagIndexFactory INSTANCE = new BookmarkTagIndexFactory();

    private BookmarkTagIndexFactory()
    {
        super(true,
                TagIndex1.EM, TagIndex1.FN_TAG1_ID, TagIndex1.IDX_TAG1_ID__ENTRY_KEY,
                TagIndex1.VO_ENTRY_KEY, TagIndex2.EM, TagIndex2.FN_TAG2_ID,
                TagIndex2.IDX_TAG1_ID__TAG2_ID__ENTRY_KEY, TagIndex2.VO_ENTRY_KEY, TagIndex3.EM,
                TagIndex3.FN_TAG3_ID, TagIndex3.IDX_TAG1_ID__TAG2_ID__TAG3_ID__ENTRY_KEY,
                TagIndex3.VO_ENTRY_KEY, TagIndex4.EM, TagIndex4.FN_TAG4_ID,
                TagIndex4.IDX_TAG1_ID__TAG2_ID__TAG3_ID__TAG4_ID__ENTRY_KEY, TagIndex4.VO_ENTRY_KEY);
    }

    @Override
    public TagIndex1 newTagIndex1(byte[] entryKey, int tag1)
    {
        return new TagIndex1(entryKey, tag1);
    }

    @Override
    public TagIndex2 newTagIndex2(byte[] entryKey, int tag1, int tag2)
    {
        return new TagIndex2(entryKey, tag1, tag2);
    }

    @Override
    public TagIndex3 newTagIndex3(byte[] entryKey, int tag1, int tag2, int tag3)
    {
        return new TagIndex3(entryKey, tag1, tag2, tag3);
    }

    @Override
    public TagIndex4 newTagIndex4(byte[] entryKey, int tag1, int tag2, int tag3, int tag4)
    {
        return new TagIndex4(entryKey, tag1, tag2, tag3, tag4);
    }
}
