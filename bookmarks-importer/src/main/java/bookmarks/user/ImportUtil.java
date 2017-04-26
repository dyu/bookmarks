//========================================================================
//Copyright 2016 David Yu
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

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.regex.Pattern;

import com.dyuproject.protostuff.LongHashSet;
import com.dyuproject.protostuffdb.TsKeyUtil;
import com.dyuproject.protostuffdb.DSRuntimeExceptions;
import com.dyuproject.protostuffdb.Datastore;
import com.dyuproject.protostuffdb.EntityMetadata;
import com.dyuproject.protostuffdb.HasKeyAndTs;
import com.dyuproject.protostuffdb.KeyUtil;
import com.dyuproject.protostuffdb.Op;
import com.dyuproject.protostuffdb.OpChain;
import com.dyuproject.protostuffdb.WriteContext;

/**
 * TODO
 * 
 * @author David Yu
 * @created Dec 30, 2016
 */
public final class ImportUtil
{
    private ImportUtil() {}
    
    private static final String DEFAULT_TAG = "~pending";
    private static final String[] DEFAULT_TAGS = new String[] { DEFAULT_TAG };
    
    public static final Pattern COMMA = Pattern.compile(",");
    
    // temporary workaround
    static final Pattern UNICODE = Pattern.compile("[^\\x00-\\x7F]", 
            Pattern.UNICODE_CASE | Pattern.CANON_EQ | Pattern.CASE_INSENSITIVE);
    
    static final Comparator<BookmarkTag> CMP_TAG = new Comparator<BookmarkTag>()
    {
        @Override
        public int compare(BookmarkTag o1, BookmarkTag o2)
        {
            if (o1.id == o2.id)
                throw new RuntimeException(o1.name + " has same id as " + o2.name);
            
            return o1.id - o2.id;
        }
    };
    
    public static void addTags(Datastore store, WriteContext context, 
            Collection<BookmarkTag> tags)
    {
        final int size = tags.size();
        System.err.println("Inserting " + size + " tags ...");
        
        long startNs = System.nanoTime(), insertNs, endNs;
        
        final ArrayList<BookmarkTag> sorted = new ArrayList<BookmarkTag>(tags);
        Collections.sort(sorted, CMP_TAG);
        if (sorted.get(0).id != 1 || sorted.get(size - 1).id != size)
            throw new RuntimeException("The tag ids must be sequential starting at 1.");
        
        insertNs = System.nanoTime();
        
        for (BookmarkTag bt : sorted)
        {
            byte[] key = bt.key;
            BookmarkUtil.normalize(bt);
            bt.provide(bt.ts, bt.id);
            // set to zero
            bt.ts = 0;
            store.insertWithKey(key, bt, bt.em(), null, context);
        }
        
        endNs = System.nanoTime();
        
        System.err.println("Tag sort time: " + ((insertNs - startNs)/1000000) + "ms");
        System.err.println("Tag insert time: " + ((endNs - insertNs)/1000000) + "ms");
    }
    
    static String filterTitle(String title)
    {
        return title;
        /*if (Validation.isAsciiSafeHtml(title))
            return title;
        
        return UNICODE.matcher(title).replaceAll(" ")
                .replaceAll("&", "and")
                .replace('<', '{')
                .replace('>', '}')
                .replace('\\', '/');*/
    }
    
    public static int addBookmark(Datastore store, WriteContext context, 
            LongHashSet keySuffixSet, HashMap<String,BookmarkTag> tagMap, 
            String url, String title, String tsSec, String tagCSV,
            int tagCurrentId, boolean sorted)
    {
        final BookmarkEntry entry = new BookmarkEntry(url);
        final BookmarkEntry.PNew pnew = new BookmarkEntry.PNew(entry);
        
        final long ts = Long.parseLong(tsSec) * 1000;
        final String[] tags = tagCSV != null && !tagCSV.isEmpty() ? 
                COMMA.split(tagCSV) : DEFAULT_TAGS;
        
        int concurrentStart = 0;
        BookmarkTag bt;
        if (sorted && tagCurrentId == 0)
        {
            // insert the first auto tag
            bt = new BookmarkTag(DEFAULT_TAG);
            bt.key = newKey(ts, context.exclusiveLast, keySuffixSet, 
                    bt, BookmarkTag.EM, bt.name, concurrentStart++);
            bt.id = ++tagCurrentId;
            tagMap.put(bt.name, bt);
        }
        
        for (String tag : tags)
        {
            // normalize
            tag = tag.toLowerCase();
            bt = tagMap.get(tag);
            if (bt == null)
            {
                bt = new BookmarkTag(tag);
                bt.key = sorted ? newKey(ts, context.exclusiveLast, keySuffixSet, 
                        bt, BookmarkTag.EM, bt.name, concurrentStart++) : 
                            TsKeyUtil.newKey(BookmarkTag.EM, context);
                bt.id = ++tagCurrentId;
                tagMap.put(bt.name, bt);
            }
            
            pnew.addTags(bt.id);
        }
        
        if (!BookmarkEntry.PATTERN_url.matcher(url).matches() || 
                !BookmarkUtil.normalize(entry) || 
                !entry.cachedSchema().isInitialized(entry))
        {
            System.err.println("Excluding! " + pnew.tags.size() + " | " + 
                    tagCSV + " | " + url);
            return tagCurrentId;
        }
        
        if (title != null && !title.isEmpty())
        {
            if (null == (title = filterTitle(title)))
            {
                System.err.println("Excluding!! " + pnew.tags.size() + " | " + 
                        tagCSV + " | " + url);
                return tagCurrentId;
            }
            
            entry.title = title;
        }
        
        if (pnew.tags.size() > 4)
        {
            pnew.tags.clear();
            pnew.tags.add(Integer.valueOf(sorted ? 1 : tagMap.get(DEFAULT_TAG).id));
            entry.notes = tagCSV;
        }
        else if (pnew.tags.size() > 1)
        {
            try
            {
                Collections.sort(pnew.tags, BookmarkEntryOps.CMP);
            }
            catch (DSRuntimeExceptions.Operation e)
            {
                pnew.tags.clear();
                pnew.tags.add(Integer.valueOf(sorted ? 1 : tagMap.get(DEFAULT_TAG).id));
                entry.notes = tagCSV;
                
                System.err.println("Duplicate tag: " + pnew.tags.size() + " | " + 
                        tagCSV + " | " + url);
            }
        }
        
        // supply the ts and key
        final byte[] key = newKey(ts, context.exclusiveLast, keySuffixSet, 
                entry, BookmarkEntry.EM, entry.url, concurrentStart);
        try
        {
            if (!store.chain(null, OP_ENTRY_NEW, pnew, 0, context, key))
                throw new RuntimeException("Failed to insert entry: " + url);
        }
        catch (DSRuntimeExceptions.Operation e)
        {
            if (!e.getMessage().startsWith("That url already exists"))
                throw e;
            
            System.err.println("Duplicate: " + pnew.tags.size() + " | " + 
                    tagCSV + " | " + url);
        }
        
        return tagCurrentId;
    }
    
    private static byte[] newKey(long ts, int exclusiveLast, LongHashSet keySuffixSet, 
            HasKeyAndTs entry, EntityMetadata<?> em, 
            String entryName, int concurrentStart)
    {
        long keySuffix = ts << 16;
        
        if (keySuffixSet.add(keySuffix))
        {
            entry.setTs(ts);
            return KeyUtil.newEntityKey(em.kind, ts, 0);
        }
        
        final long origTs = ts;
        for (int modCount = 0; modCount < exclusiveLast; modCount++)
        {
            // we can add up to 999 millis before it becomes the next second
            for (int i = 0; i < 999; i++)
            {
                keySuffix = (++ts << 16) | modCount;
                if (keySuffixSet.add(keySuffix))
                {
                    entry.setTs(ts);
                    return KeyUtil.newEntityKey(em.kind, ts, modCount);
                }
                
                if (i == concurrentStart && modCount == 0 && BookmarkEntry.KIND == em.kind)
                    System.err.println("Concurrent entry: " + entryName);
            }
            
            // reset ts for the next modCount
            ts = origTs;
        }
        
        throw new RuntimeException("Could not add " + entryName + " due to timestamp.");
    }
    
    static final Op<BookmarkEntry.PNew> OP_ENTRY_NEW = new Op<BookmarkEntry.PNew>()
    {
        @Override
        public boolean handle(final OpChain chain, final byte[] key, 
                byte[] value, int offset, int len,
                final BookmarkEntry.PNew param)
        {
            final long now = chain.context.ts(BookmarkEntry.EM);
            
            final BookmarkEntry entity = BookmarkEntryOps.validateAndProvide(
                    param.p.ts, // timestamp override
                    param,
                    now,
                    key, chain);
            
            // set to zero
            entity.ts = 0;
            
            return chain.insertWithKey(key, entity, BookmarkEntry.EM, 
                    null, null, null);
        }
    };
}
