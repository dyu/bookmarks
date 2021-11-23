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

import com.dyuproject.protostuff.ds.CAS;
import com.dyuproject.protostuff.ds.MultiCAS;
import com.dyuproject.protostuff.ds.ParamUpdate;
import com.dyuproject.protostuffdb.DSRuntimeExceptions;
import com.dyuproject.protostuffdb.OpChain;

/**
 * TODO
 * 
 * @author David Yu
 * @created Apr 24, 2017
 */
public final class BookmarkTagOps
{
    private BookmarkTagOps() {}
    
    static BookmarkTag validateAndProvide(BookmarkTag param, long now, OpChain chain)
    {
        if (chain.vs().exists(true, 
                BookmarkTag.$$NAME(chain.context.kb(), param.name).$push()))
        {
            throw DSRuntimeExceptions.operationFailure("Tag already exists.");
        }
        
        if (!param.color.isEmpty())
            param.color = BookmarkUtil.normalizeColor(param.color);
        
        return param.provide(now, EntityRegistry.BOOKMARK_TAG_CACHE.newId());
    }

    static MultiCAS validate(ParamUpdate param, byte[] value, OpChain chain)
    {
        if (param.mc.isSet(BookmarkTag.FN_NAME))
        {
            CAS.StringOp op = (CAS.StringOp)param.mc.findOp(BookmarkTag.FN_NAME);
            if (!op.s.isEmpty() &&
                    BookmarkTag.EM.isValid(BookmarkTag.FN_NAME, op.s) &&
                    chain.vs().exists(true, BookmarkTag.$$NAME(chain.context.kb(), op.s).$push()))
            {
                throw DSRuntimeExceptions.operationFailure("Tag already exists.");
            }
        }
        if (param.mc.isSet(BookmarkTag.FN_COLOR))
        {
            CAS.StringOp op = (CAS.StringOp)param.mc.findOp(BookmarkTag.FN_COLOR);
            if (!op.s.isEmpty())
                op.s = BookmarkUtil.normalizeColor(op.s);
        }
        return param.mc;
    }
}
