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

package bookmarks.importer;

import java.util.HashMap;

import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import bookmarks.user.BookmarkTag;
import bookmarks.user.ImportUtil;

import com.dyuproject.protostuff.LongHashSet;
import com.dyuproject.protostuffdb.Datastore;
import com.dyuproject.protostuffdb.WriteContext;

/**
 * TODO
 * 
 * @author David Yu
 * @created Jan 2, 2017
 */
public interface Importer
{
    int run(Document doc, 
            HashMap<String,BookmarkTag> tagMap, int tagCurrentId,
            Datastore store, WriteContext context);
    
    public enum BUILTIN implements Importer
    {
        delicious
        {
            @Override
            public int run(Document doc, 
                    HashMap<String,BookmarkTag> tagMap, int tagCurrentId,
                    Datastore store, WriteContext context)
            {
                //System.err.println(doc.title());
                
                final Elements dts = doc.select("dt");
                final int size = dts.size();
                final LongHashSet keySuffixSet = new LongHashSet(size);
                final boolean initial = tagCurrentId == 0;
                
                System.err.println("entries: " + size);
                
                for (int i = size; i-- > 0;)
                {
                    Element el = dts.get(i),
                            a = el.child(0);
                    if (a == null)
                        continue;
                    
                    tagCurrentId = ImportUtil.addBookmark(store, context, 
                            keySuffixSet, tagMap, 
                            a.attr("HREF"), a.text(), a.attr("ADD_DATE"), a.attr("TAGS"), 
                            tagCurrentId, initial);
                }
                
                return tagCurrentId;
            }
        },
        chrome
        {
            @Override
            public int run(Document doc, 
                    HashMap<String,BookmarkTag> tagMap, int tagCurrentId,
                    Datastore store, WriteContext context)
            {
                //System.err.println(doc.title());
                
                final Elements dts = doc.select("dt");
                final int size = dts.size();
                final LongHashSet keySuffixSet = new LongHashSet(size);
                
                System.err.println("entries: " + size);
                
                String tag = null, href;
                for (int i = 0; i < size; i++)
                {
                    Element el = dts.get(i),
                            a = el.child(0);
                    if (a == null)
                        continue;
                    
                    if ("h3".equalsIgnoreCase(a.nodeName()))
                    {
                        // tag
                        tag = a.text().replace(' ', '-').toLowerCase();
                        continue;
                    }
                    
                    href = a.attr("HREF");
                    if (href == null)
                        continue;
                    if (href.startsWith("javascript"))
                    {
                        System.err.println("Ignoring: " + tag + " | " + href);
                        continue;
                    }
                    
                    tagCurrentId = ImportUtil.addBookmark(store, context, 
                            keySuffixSet, tagMap, 
                            href, a.text(), a.attr("ADD_DATE"), tag, 
                            tagCurrentId, false);
                }
                
                return tagCurrentId;
            }
        };


    }

}
