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

/**
 * TODO
 * 
 * @author David Yu
 * @created Apr 24, 2017
 */
public final class BookmarkUtil
{
    private BookmarkUtil() {}
    
    static String normalizeColor(String color)
    {
        return color.toLowerCase();
    }
    
    public static boolean normalize(BookmarkEntry p)
    {
        final String url = p.url,
                normalized;
        int len = url.length(),
                idx = url.indexOf("www.");
        boolean www = false;
        if (idx != -1)
        {
            if ((idx != 0 && (idx - 3) != url.lastIndexOf("://", idx)) || 
                    len == idx + 4 ||
                    (len > idx + 4 && !Character.isLetterOrDigit(url.charAt(idx + 4))))
            {
                p.normalized = normalized = len > 127 ? 
                        truncate(url, 0, 127).toLowerCase() : url.toLowerCase();
            }
            else if (len > idx + 4 + 127)
            {
                www = true;
                p.normalized = normalized = truncate(url, idx + 4, 127).toLowerCase();
            }
            else
            {
                www = true;
                p.normalized = normalized = url.substring(idx + 4).toLowerCase();
            }
        }
        else if ((idx = url.indexOf("://")) != -1)
        {
            if (len == idx + 3)
                return false;
            
            if (len > idx + 3 + 127)
                p.normalized = normalized = truncate(url, idx + 3, 127).toLowerCase();
            else
                p.normalized = normalized = url.substring(idx + 3).toLowerCase();
        }
        else if (len > 127)
        {
            p.normalized = normalized = truncate(url, 0, 127).toLowerCase();
        }
        else
        {
            p.normalized = normalized = url.toLowerCase();
        }
        
        p.identifier = extractIdentifier(normalized);
        p.www = www;
        
        return true;
    }
    
    private static String extractIdentifier(String normalized)
    {
        int endIdx = normalized.indexOf('/'),
                dotIdx,
                startIdx;
        if (endIdx == 0)
            return extractPrefix(normalized, 1);
        
        final boolean withSlash = endIdx != -1;
        if (withSlash)
            endIdx--;
        else
            endIdx = normalized.length() - 1;
        
        final String identifier;
        if (-1 == (dotIdx = normalized.lastIndexOf('.', endIdx)))
        {
            identifier = Character.isLetterOrDigit(normalized.charAt(0)) ?
                    normalized : extractPrefix(normalized, 1);
        }
        else if (!isValidDomainChar(normalized.charAt(0), true, false))
        {
            identifier = extractPrefix(normalized, 1);
        }
        else if (endIdx == dotIdx)
        {
            identifier = withSlash ? normalized : "*.";
        }
        else if (-1 == (startIdx = normalized.lastIndexOf('.', dotIdx - 1)))
        {
            // root domain
            identifier = withSlash ? normalized.substring(0, endIdx + 1) : normalized;
        }
        else
        {
            // with cname
            identifier = normalized.substring(startIdx + 1, endIdx + 1);
        }
        
        return identifier;
    }
    
    private static boolean isValidDomainChar(char c, boolean start, boolean end)
    {
        return Character.isLetterOrDigit(c) || (c == '-' && !start && !end);
    }
    
    private static String extractPrefix(String normalized, int i)
    {
        for (int len = normalized.length(); i < len; i++)
        {
            if (Character.isLetterOrDigit(normalized.charAt(i)))
                return normalized.substring(0, i);
        }
        
        return normalized;
    }
    
    private static String truncate(String url, int offset, int size)
    {
        return url.substring(offset, offset + size - 3) + "...";
    }
}
