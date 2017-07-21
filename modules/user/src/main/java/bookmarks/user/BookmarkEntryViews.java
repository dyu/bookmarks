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

import static com.dyuproject.protostuffdb.SerializedValueUtil.readBAO$len;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;

import com.dyuproject.protostuff.Input;
import com.dyuproject.protostuff.Output;
import com.dyuproject.protostuff.Pipe;
import com.dyuproject.protostuff.RpcHeader;
import com.dyuproject.protostuff.RpcResponse;
import com.dyuproject.protostuff.RpcWorker;
import com.dyuproject.protostuffdb.Datastore;
import com.dyuproject.protostuffdb.KV;
import com.dyuproject.protostuffdb.MustBeUnique;
import com.dyuproject.protostuffdb.ProtostuffPipe;
import com.dyuproject.protostuffdb.ValueUtil;
import com.dyuproject.protostuffdb.VisitorSession;
import com.dyuproject.protostuffdb.WriteContext;
import com.dyuproject.protostuffdb.tag.TagVisit;

/**
 * TODO
 * 
 * @author David Yu
 * @created Apr 24, 2017
 */
public final class BookmarkEntryViews
{
    private BookmarkEntryViews() {}

    private static void writeTagNameTo(Output output, int field, 
            int tagId, boolean repeated, WriteContext context) throws IOException
    {
        byte[] tag = EntityRegistry.BOOKMARK_TAG_CACHE.get(tagId).value;
        
        output.writeByteRange(true, field, tag, 
                readBAO$len(BookmarkTag.FN_NAME, tag, context), context.$len, repeated);
    }
    
    private static void transferField(int number, Pipe pipe, Input input, Output output,
            WriteContext context) throws IOException
    {
        if (number != BookmarkEntry.M.FN_SER_TAGS)
        {
            BookmarkEntry.M.transferField(number, pipe, input, output, BookmarkEntry.M.getSchema());
            return;
        }
        
        byte[] serTags = input.readByteArray();
        
        output.writeByteArray(number, serTags, false);
        
        // lazy
        if (context == null)
            context = RpcWorker.get().context;
        
        for (int i = 0; i < serTags.length; i += 4)
        {
            writeTagNameTo(output, BookmarkEntry.M.FN_TAGS, 
                    ValueUtil.toInt32LE(serTags, i), true, context);
        }
    }
    
    static final Pipe.Schema<BookmarkEntry.M> PS = new Pipe.Schema<BookmarkEntry.M>(BookmarkEntry.M.getSchema())
    {
        protected void transfer(final Pipe pipe, final Input input, final Output output) throws IOException
        {
            for (int number = input.readFieldNumber(wrappedSchema);
                    number != 0;
                    number = input.readFieldNumber(wrappedSchema))
            {
                transferField(number, pipe, input, output, null);
            }
        }
    };
    
    static Pipe.Schema<BookmarkEntry.M> psBookmarkEntry(RpcHeader header)
    {
        return PS;
    }
    
    static final TagVisit TV = TagVisit.create(BookmarkEntry.EM, BookmarkTagIndexFactory.INSTANCE);
    
    static final class VSH extends Pipe.Schema<BookmarkEntry.M> 
            implements VisitorSession.Handler<Void>
    {
        final BookmarkEntry.PTags req;
        final RpcResponse res;
        
        final ArrayList<KV> list = new ArrayList<KV>();
        int idx;
        
        VSH(BookmarkEntry.PTags req, RpcResponse res)
        {
            super(BookmarkEntry.M.getSchema());
            this.req = req;
            this.res = res;
        }
        
        @Override
        public void handle(VisitorSession session, Void param)
        {
            if (!TV.visit(req.tagId, req.prk, session, res.context, list) || 
                    list.isEmpty())
            {
                return;
            }
            
            final ProtostuffPipe pipe = res.context.pipe.init(
                    BookmarkEntry.EM, this, BookmarkEntry.M.PList.FN_P, true);
            try
            {
                session.visitHasKeys(list, false, false, RpcResponse.PIPED_VISITOR, res);
            }
            finally
            {
                pipe.clear();
            }
        }
        
        protected void transfer(final Pipe pipe, final Input input, final Output output) throws IOException
        {
            for (int number = input.readFieldNumber(wrappedSchema);
                    number != 0;
                    number = input.readFieldNumber(wrappedSchema))
            {
                transferField(number, pipe, input, output, res.context);
                if (number != BookmarkEntry.LAST_FN)
                    continue;
                
                byte[] k = list.get(idx++).value;
                output.writeByteRange(false, BookmarkEntry.M.FN_PAGE_KEY, 
                        k, k.length - 9, 9, false);
            }
        }
    }
    
    static boolean listBookmarkEntryByTag(final BookmarkEntry.PTags req, Datastore store,
            final RpcResponse res, Pipe.Schema<BookmarkEntry.M.PList> resPipeSchema, 
            final RpcHeader header) throws IOException
    {
        if (req.tagId.size() > 1)
        {
            try
            {
                Collections.sort(req.tagId, MustBeUnique.CMP_ID);
            }
            catch (MustBeUnique e)
            {
                return res.fail("The tags must be unique.");
            }
        }
        
        store.session(res.context, new VSH(req, res), null);
        
        return true;
    }
}
