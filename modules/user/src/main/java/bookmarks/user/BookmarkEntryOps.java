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

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

import com.dyuproject.protostuff.ByteString;
import com.dyuproject.protostuff.KeyBuilder;
import com.dyuproject.protostuff.Pipe;
import com.dyuproject.protostuff.RpcHeader;
import com.dyuproject.protostuff.RpcResponse;
import com.dyuproject.protostuff.ds.CAS;
import com.dyuproject.protostuff.ds.MultiCAS;
import com.dyuproject.protostuff.ds.ParamUpdate;
import com.dyuproject.protostuff.ds.SingleCAS;
import com.dyuproject.protostuffdb.DSRuntimeExceptions;
import com.dyuproject.protostuffdb.Datastore;
import com.dyuproject.protostuffdb.DateTimeUtil;
import com.dyuproject.protostuffdb.HasKV;
import com.dyuproject.protostuffdb.KeyUtil;
import com.dyuproject.protostuffdb.Op;
import com.dyuproject.protostuffdb.OpChain;
import com.dyuproject.protostuffdb.ValueUtil;
import com.dyuproject.protostuffdb.Visitor;
import com.dyuproject.protostuffdb.WriteContext;
import com.dyuproject.protostuffdb.tag.TagUtil;

/**
 * TODO
 * 
 * @author David Yu
 * @created Apr 24, 2017
 */
public final class BookmarkEntryOps
{
    private BookmarkEntryOps() {}
    
    static final Comparator<Integer> CMP = new Comparator<Integer>()
    {
        @Override
        public int compare(Integer a, Integer b)
        {
            if (a.intValue() == b.intValue())
                throw DSRuntimeExceptions.operationFailure("Duplicate tag.");
            
            return a.intValue() - b.intValue();
        }
    };
    
    static boolean create(BookmarkEntry.PNew req, Datastore store, RpcResponse res,
            Pipe.Schema<BookmarkEntry.M.PList> resPipeSchema, RpcHeader header) throws IOException
    {
        if (!BookmarkUtil.normalize(req.p))
            return res.fail("Invalid url.");
        
        int size, tagId;
        if (req.tags != null && 0 != (size = req.tags.size()))
        {
            if (size != 1)
                Collections.sort(req.tags, CMP);
            
            tagId = req.tags.get(0);
            if (tagId < 1)
                return res.fail("Invalid tag.");
            
            if (size != 1)
                tagId = req.tags.get(size - 1);
            
            if (tagId > EntityRegistry.BOOKMARK_TAG_CACHE.size())
                return res.fail("Unknown tag.");
        }
        
        return XBookmarkEntryOps.create(req, store, res, resPipeSchema, header);
    }
    
    static BookmarkEntry validateAndProvide(BookmarkEntry.PNew param, 
            final long now, final byte[] key, OpChain chain)
    {
        if (chain.vs().exists(true, 
                BookmarkEntry.$$URL(chain.context.kb(), param.p.url).$push()))
        {
            throw DSRuntimeExceptions.operationFailure(
                    "That url already exists.  Update that one instead.");
        }
        
        final List<Integer> tags = param.tags;
        final int tagCount = tags == null ? 0 : tags.size();
        final byte[] serTags = tagCount == 0 ? ByteString.EMPTY_BYTE_ARRAY : 
                TagUtil.insert(tags, BookmarkTagIndexFactory.INSTANCE, chain, now, key);
        
        return param.p.provide(
                now,
                param.p.normalized,
                param.p.identifier,
                serTags,
                tagCount,
                param.p.www,
                DateTimeUtil.startOfDayMS(now),
                now);
    }
    
    static String updateBookmarkEntry(ParamUpdate req, Datastore store,
            WriteContext context, RpcHeader header) throws IOException
    {
        if (BookmarkEntry.KIND != KeyUtil.getKind(req.key))
            return "Invalid op";
        
        final int idx = req.mc.indexOf(BookmarkEntry.FN_ACTIVE);
        if (idx == -1)
            return XBookmarkEntryOps.update(req, store, context, header);
        
        final CAS.BoolOp op = (CAS.BoolOp)req.mc.ops.get(idx);
        
        if (op.getC() == op.getS())
            return "Invalid op.";
        
        // store it
        req.id = idx;
        
        final long value = XBookmarkEntryOps.LOCK.acquire(req.key);
        try
        {

            if (!store.chain(null, OP_UPDATE, req, 0, context, req.key))
                return "Update failed.  Please refresh and try again.";
        }
        finally
        {
            XBookmarkEntryOps.LOCK.release(value);
        }


        return null;
    }
    
    private static final Op<ParamUpdate> OP_UPDATE = new Op<ParamUpdate>()
    {
        @Override
        public boolean handle(OpChain chain, final byte[] key, 
                byte[] value, int offset, int len,
                ParamUpdate req)
        {
            final CAS.BoolOp opActive = (CAS.BoolOp)req.mc.ops.get(req.id);
            final boolean oldVal = opActive.getC(),
                    newVal = !oldVal;
            
            final ArrayList<HasKV> list = new ArrayList<HasKV>();
            
            final KeyBuilder kb = BookmarkEntry.$$ACTIVE(chain.context.kb(), oldVal)
                    .$append(key)
                    .$pushRange();
            
            if (0 == chain.vs().visitRange(false, -1, false, null,
                    Visitor.APPEND_EXTRACTED_KV, list, 
                    kb.buf(), kb.offset(-1), kb.len(-1), 
                    kb.buf(), kb.offset(), kb.len()))
            {
                throw DSRuntimeExceptions.operationFailure("Not found.");
            }
            
            HasKV kv = list.get(0);
            if (!ValueUtil.isEqual(key, kv.getKey()))
            {
                System.err.println("Error kind " + BookmarkEntry.KIND + " != " + 
                        KeyUtil.getKind(kv.getKey()));
                throw DSRuntimeExceptions.runtime("Corrupt index.");
            }
            
            value = kv.getValue();
            
            if (!chain.updateWithValue(value, key, BookmarkEntry.EM, 
                    XBookmarkEntryOps.cas(req.mc), null,
                    null, null, null))
            {
                return false;
            }
            
            byte[] k;
            for (int i = 1, l = list.size(); i < l; i++)
            {
                kv = list.get(i);
                k = kv.getKey();
                switch (KeyUtil.getKind(k))
                {
                    case TagIndex1.KIND:
                        if (!chain.updateWithValue(kv.getValue(), k, TagIndex1.EM, 
                                new SingleCAS(new CAS.BoolOp(TagIndex1.FN_ACTIVE, oldVal, newVal)), 
                                null, null, null))
                        {
                            return false;
                        }
                        break;
                    case TagIndex2.KIND:
                        if (!chain.updateWithValue(kv.getValue(), k, TagIndex2.EM, 
                                new SingleCAS(new CAS.BoolOp(TagIndex2.FN_ACTIVE, oldVal, newVal)), 
                                null, null, null))
                        {
                            return false;
                        }
                        break;
                    case TagIndex3.KIND:
                        if (!chain.updateWithValue(kv.getValue(), k, TagIndex3.EM, 
                                new SingleCAS(new CAS.BoolOp(TagIndex3.FN_ACTIVE, oldVal, newVal)), 
                                null, null, null))
                        {
                            return false;
                        }
                        break;
                    case TagIndex4.KIND:
                        if (!chain.updateWithValue(kv.getValue(), k, TagIndex4.EM, 
                                new SingleCAS(new CAS.BoolOp(TagIndex4.FN_ACTIVE, oldVal, newVal)), 
                                null, null, null))
                        {
                            return false;
                        }
                        break;
                    default:
                        System.err.println("corrupt kind: " + KeyUtil.getKind(k));
                        throw DSRuntimeExceptions.runtime("Corrupt index.");
                }
            }
            
            return true;
        }
    };
    
    static boolean updateTag(UpdateTag req, 
            Datastore store, RpcResponse res,
            Pipe.Schema<ParamInt> resPipeSchema, RpcHeader header) throws IOException
    {
        if (!EntityRegistry.BOOKMARK_TAG_CACHE.exists(req.tagId))
            return res.fail("Unknown tag.");
        
        final long lv = XBookmarkEntryOps.LOCK.acquire(req.key);
        try
        {
            if (!store.chain(null, OP_UPDATE_TAG, req, 0, res.context, req.key))
                return res.fail("Update failed.  Please refresh and try again.");
        }
        finally
        {
            XBookmarkEntryOps.LOCK.release(lv);
        }
        
        if (!req.remove)
            res.output.writeInt32(ParamInt.FN_P, req.tagId.intValue(), false);
        
        return true;
    }
    
    static final Op<UpdateTag> OP_UPDATE_TAG = new Op<UpdateTag>()
    {
        @Override
        public boolean handle(final OpChain chain, final byte[] key, 
                byte[] value, int offset, int len, 
                final UpdateTag param)
        {
            value = chain.vs().get(key, BookmarkEntry.EM, null);
            if (value == null)
                throw DSRuntimeExceptions.operationFailure("Not found.");
            
            final MultiCAS mc = new MultiCAS();
            
            final int insertIdx = TagUtil.update(param.tagId, param.remove, 
                    BookmarkTagIndexFactory.INSTANCE, BookmarkEntry.FN_SER_TAGS, 
                    chain, key,
                    mc, BookmarkEntry.FN_SER_TAGS, value);
            
            // store insert index as tagId
            if (insertIdx != -1)
                param.tagId = insertIdx;
            
            mc.addOp(CAS.Fixed32Op.asIncrement(BookmarkEntry.FN_TAG_COUNT, 
                    param.remove ? -1 : 1));
            
            return chain.updateWithValue(value, key, BookmarkEntry.EM, 
                    XBookmarkEntryOps.casComputed(mc), 
                    null, null, null);
        }
    };

    static boolean replaceTag(ReplaceTag req, Datastore store, RpcResponse res,
            Pipe.Schema<ParamInt> resPipeSchema, RpcHeader header) throws IOException
    {
        if (!EntityRegistry.BOOKMARK_TAG_CACHE.exists(req.tagId))
            return res.fail("Unknown tag.");
        
        if (!EntityRegistry.BOOKMARK_TAG_CACHE.exists(req.replacementTagId))
            return res.fail("Unknown replacement tag.");
        
        final long lv = XBookmarkEntryOps.LOCK.acquire(req.key);
        try
        {
            if (!store.chain(null, OP_REPLACE_TAG, req, 0, res.context, req.key))
                return res.fail("Update failed.  Please refresh and try again.");
        }
        finally
        {
            XBookmarkEntryOps.LOCK.release(lv);
        }
        
        res.output.writeInt32(ParamInt.FN_P, req.tagId.intValue(), false);
        
        return true;
    }
    
    static final Op<ReplaceTag> OP_REPLACE_TAG = new Op<ReplaceTag>()
    {
        @Override
        public boolean handle(final OpChain chain, final byte[] key, 
                byte[] value, int offset, int len, 
                final ReplaceTag param)
        {
            value = chain.vs().get(key, BookmarkEntry.EM, null);
            if (value == null)
                throw DSRuntimeExceptions.operationFailure("Not found.");
            
            final MultiCAS mc = new MultiCAS();
            
            // store insert index as tagId
            param.tagId = TagUtil.replace(param.tagId, param.replacementTagId, 
                    BookmarkTagIndexFactory.INSTANCE, BookmarkEntry.FN_SER_TAGS, 
                    chain, key, 
                    mc, BookmarkEntry.FN_SER_TAGS, value);
            
            return chain.updateWithValue(value, key, BookmarkEntry.EM, 
                    XBookmarkEntryOps.casComputed(mc), 
                    null, null, null);
        }
    };
}
