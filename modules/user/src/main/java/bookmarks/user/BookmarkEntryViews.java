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

import static com.dyuproject.protostuffdb.SerializedValueUtil.asInt32;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import com.dyuproject.protostuff.Input;
import com.dyuproject.protostuff.KeyBuilder;
import com.dyuproject.protostuff.Output;
import com.dyuproject.protostuff.Pipe;
import com.dyuproject.protostuff.RpcHeader;
import com.dyuproject.protostuff.RpcResponse;
import com.dyuproject.protostuff.RpcRuntimeExceptions;
import com.dyuproject.protostuff.RpcWorker;
import com.dyuproject.protostuff.ds.ParamRangeKey;
import com.dyuproject.protostuffdb.DSRuntimeExceptions;
import com.dyuproject.protostuffdb.Datastore;
import com.dyuproject.protostuffdb.KV;
import com.dyuproject.protostuffdb.MustBeUnique;
import com.dyuproject.protostuffdb.ProtostuffPipe;
import com.dyuproject.protostuffdb.ValueUtil;
import com.dyuproject.protostuffdb.VisitorSession;
import com.dyuproject.protostuffdb.WriteContext;

/**
 * TODO
 * 
 * @author David Yu
 * @created Apr 24, 2017
 */
public final class BookmarkEntryViews
{
    private BookmarkEntryViews() {}
    
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
            context.$field = ValueUtil.toInt32LE(serTags, i);
            output.writeObject(BookmarkEntry.M.FN_TAGS, 
                    context, BookmarkTagViews.M_CONTEXT_SCHEMA, true);
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
    
    static boolean listBookmarkEntryByTag(final BookmarkEntry.PTags req, Datastore store,
            final RpcResponse res, Pipe.Schema<BookmarkEntry.M.PList> resPipeSchema, 
            final RpcHeader header) throws IOException
    {
        final List<Integer> tags = req.tagId;
        if (tags.size() > 1)
        {
            try
            {
                Collections.sort(tags, MustBeUnique.CMP_ID);
            }
            catch (MustBeUnique e)
            {
                return res.fail("The tags must be unique.");
            }
        }
        
        final WriteContext context = res.context;
        final KeyBuilder kb = context.kb();
        switch (tags.size())
        {
            case 1:
                kb.begin(TagIndex1.IDX_TAG1_ID__ENTRY_KEY, TagIndex1.EM)
                        .$append(tags.get(0))
                        .$pushRange();
                break;
            case 2:
                kb.begin(TagIndex2.IDX_TAG1_ID__TAG2_ID__ENTRY_KEY, TagIndex2.EM)
                        .$append(tags.get(0))
                        .$append(tags.get(1))
                        .$pushRange();
                break;
            case 3:
                kb.begin(TagIndex3.IDX_TAG1_ID__TAG2_ID__TAG3_ID__ENTRY_KEY, TagIndex3.EM)
                        .$append(tags.get(0))
                        .$append(tags.get(1))
                        .$append(tags.get(2))
                        .$pushRange();
                break;
            case 4:
                kb.begin(TagIndex4.IDX_TAG1_ID__TAG2_ID__TAG3_ID__TAG4_ID__ENTRY_KEY, TagIndex4.EM)
                        .$append(tags.get(0))
                        .$append(tags.get(1))
                        .$append(tags.get(2))
                        .$append(tags.get(3))
                        .$pushRange();
                break;
            default:
                return res.fail("The tags cannot exceed 4.");
        }
        
        final ParamRangeKey prk = req.prk;
        
        byte[] startKey = prk.startKey;
        if (startKey != null)
            startKey = kb.copy(-1, startKey);
        
        final ProtostuffPipe pipe = context.pipe.init(BookmarkEntry.EM, 
                PS, BookmarkEntry.M.PList.FN_P, true);
        try
        {
            store.visitRange(false, prk.limit, prk.desc, 
                    startKey, context, 
                    RpcResponse.PIPED_VISITOR, res, 
                    true, false,
                    kb.buf(), kb.offset(-1), kb.len(-1),
                    kb.buf(), kb.offset(), kb.len());
        }
        finally
        {
            pipe.clear();
        }
        
        return true;
    }
    
    static void pipeTo(RpcResponse res, 
            VisitorSession session, List<KV> tags) throws IOException
    {
        final WriteContext context = res.context;
        final KeyBuilder kb = context.kb();
        switch (tags.size())
        {
            case 1:
                kb.begin(TagIndex1.IDX_TAG1_ID__ENTRY_KEY, TagIndex1.EM)
                        .$append(asInt32(BookmarkTag.VO_ID, tags.get(0).value))
                        .$pushRange();
                break;
            case 2:
                kb.begin(TagIndex2.IDX_TAG1_ID__TAG2_ID__ENTRY_KEY, TagIndex2.EM)
                        .$append(asInt32(BookmarkTag.VO_ID, tags.get(0).value))
                        .$append(asInt32(BookmarkTag.VO_ID, tags.get(1).value))
                        .$pushRange();
                break;
            case 3:
                kb.begin(TagIndex3.IDX_TAG1_ID__TAG2_ID__TAG3_ID__ENTRY_KEY, TagIndex3.EM)
                        .$append(asInt32(BookmarkTag.VO_ID, tags.get(0).value))
                        .$append(asInt32(BookmarkTag.VO_ID, tags.get(1).value))
                        .$append(asInt32(BookmarkTag.VO_ID, tags.get(2).value))
                        .$pushRange();
                break;
            case 4:
                kb.begin(TagIndex4.IDX_TAG1_ID__TAG2_ID__TAG3_ID__TAG4_ID__ENTRY_KEY, TagIndex4.EM)
                        .$append(asInt32(BookmarkTag.VO_ID, tags.get(0).value))
                        .$append(asInt32(BookmarkTag.VO_ID, tags.get(1).value))
                        .$append(asInt32(BookmarkTag.VO_ID, tags.get(2).value))
                        .$append(asInt32(BookmarkTag.VO_ID, tags.get(3).value))
                        .$pushRange();
                break;
            default:
                throw DSRuntimeExceptions.operationFailure("The tags cannot exceed 4.");
        }
        
        final ProtostuffPipe pipe = context.pipe.init(BookmarkEntry.EM, 
                PS, BookmarkEntry.M.PList.FN_P, true);
        try
        {
            session.visitRange(false, 31, true, 
                    null, 
                    RpcResponse.PIPED_VISITOR, res, 
                    true, false,
                    kb.buf(), kb.offset(-1), kb.len(-1),
                    kb.buf(), kb.offset(), kb.len());
        }
        finally
        {
            pipe.clear();
        }
    }
    
    static ArrayList<KV> appendTo(ArrayList<KV> listOut,
            List<String> tags, VisitorSession session, 
            RpcResponse res, int fieldNumber,
            WriteContext context) throws IOException
    {
        final KeyBuilder kb = context.kb();
        final KV kv = new KV();
        if (listOut == null && tags.size() > 1)
            listOut = new ArrayList<KV>(4);
        
        for (String name : tags)
        {
            if (!session.pget(kv, BookmarkTag.$$NAME(kb, name).$push()))
                throw DSRuntimeExceptions.operationFailure(name + " not found.");
            
            if (listOut != null)
                listOut.add(new KV(kv.key, kv.value));
        }
        
        if (res == null)
            return listOut;
        
        final ProtostuffPipe pipe = context.pipe.em(BookmarkTag.EM);
        try
        {
            if (listOut == null)
            {
                res.output.writeObject(fieldNumber, 
                        pipe.set(kv.key, kv.value),
                        BookmarkTag.M.getPipeSchema(), 
                        true);
            }
            else
            {
                Collections.sort(listOut, MustBeUnique.CMP_HK_END);
                for (KV entry : listOut)
                {
                    res.output.writeObject(fieldNumber, 
                            pipe.set(entry.key, entry.value),
                            BookmarkTag.M.getPipeSchema(), 
                            true);
                }
            }
        }
        finally
        {
            pipe.clear();
        }
        
        return listOut;
    }
    
    static boolean listBookmarkEntryByTagName(final BookmarkEntry.PTags.Names req, Datastore store,
            final RpcResponse res, Pipe.Schema<BookmarkEntry.M.PList> resPipeSchema, 
            final RpcHeader header) throws IOException
    {
        if (req.tag.size() > 1)
        {
            try
            {
                Collections.sort(req.tag, MustBeUnique.CMP_STRING);
            }
            catch (MustBeUnique e)
            {
                return res.fail("The tags must be unique.");
            }
        }
        
        store.session(res.context, new VisitorSession.Handler<Void>()
        {
            @Override
            public void handle(VisitorSession session, Void param)
            {
                try
                {
                    pipeTo(res, session, appendTo(new ArrayList<KV>(), req.tag, 
                            session, res, BookmarkEntry.M.PList.FN_T, res.context));
                }
                catch (IOException e)
                {
                    throw RpcRuntimeExceptions.pipe(e);
                }
            }
        }, null);
        
        return true;
    }
}
