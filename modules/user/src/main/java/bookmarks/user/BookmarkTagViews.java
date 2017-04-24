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

import com.dyuproject.protostuff.Pipe;
import com.dyuproject.protostuff.RpcHeader;
import com.dyuproject.protostuff.RpcResponse;
import com.dyuproject.protostuffdb.Datastore;
import com.dyuproject.protostuffdb.ProtostuffPipe;
import com.dyuproject.protostuffdb.Visitor;

/**
 * TODO
 * 
 * @author David Yu
 * @created Apr 24, 2017
 */
public final class BookmarkTagViews
{
    private BookmarkTagViews() {}
    
    private static final Visitor<RpcResponse> VISITOR = new Visitor<RpcResponse>()
    {
        @Override
        public boolean visit(byte[] key, byte[] v, int voffset, int vlen, 
                RpcResponse res, int index)
        {
            RpcResponse.PIPED_VISITOR.visit(key, v, voffset, vlen, res, index);
            // hack
            return ++index == res.context.type;
        }
    };

    static boolean listMostBookmarkTag(ParamInt req, Datastore store, RpcResponse res,
            Pipe.Schema<BookmarkTag.PList> resPipeSchema, RpcHeader header)
    {
        int limit = req.p;
        if (limit < 0 || limit > 1000)
            limit = 1000;
        
        // hack
        res.context.type = limit;
        
        Pipe.Schema<BookmarkTag> pipeSchema = BookmarkTag.getPipeSchema();
        final ProtostuffPipe pipe = res.context.pipe.init(
                BookmarkTag.EM, pipeSchema, BookmarkTag.PList.FN_P, true);
        try
        {
            EntityRegistry.BOOKMARK_TAG_CACHE.visit(VISITOR, res);
        }
        finally
        {
            pipe.clear();
        }
        return true;
    }
}
