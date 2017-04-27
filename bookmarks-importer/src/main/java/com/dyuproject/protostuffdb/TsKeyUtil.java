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

package com.dyuproject.protostuffdb;

/**
 * TODO
 * 
 * @author David Yu
 * @created Apr 27, 2017
 */
public final class TsKeyUtil
{
    private TsKeyUtil() {}
    
    public static <T extends Entity<T>> byte[] newKey(final EntityMetadata<T> em, 
            WriteContext context,
            T entity)
    {
        byte[] key = new byte[9];
        entity.setTs(context.fillEntityKey(key, em.kind, context.ts(em), -1));
        return key;
    }
}
