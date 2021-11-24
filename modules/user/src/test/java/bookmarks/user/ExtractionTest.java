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

import org.junit.Test;

import junit.framework.TestCase;

/**
 * TODO
 * 
 * @author David Yu
 * @created Apr 24, 2017
 */
public class ExtractionTest extends TestCase
{
    static void verify(BookmarkEntry entry, 
            String expectedNormalized, String expectedIdentifier)
    {
        assertEquals(expectedNormalized, entry.normalized);
        assertEquals(expectedIdentifier, entry.identifier);
    }
    
    static void verify(String url, String expectedNormalized, String expectedIdentifier)
    {
        BookmarkEntry p = new BookmarkEntry(url);
        assertTrue(BookmarkUtil.normalize(p));
        verify(p, expectedNormalized, expectedIdentifier);
    }
    
    @Test
    public void testIt()
    {
        verify("http://foo.com", "foo.com", "foo.com");
        verify("https://foo.com", "foo.com", "foo.com");
        verify("www.foo.com", "foo.com", "foo.com");
        verify("http://www.foo.com", "foo.com", "foo.com");
        verify("https://www.foo.com", "foo.com", "foo.com");
        verify("foo.com", "foo.com", "foo.com");
        
        verify("bar.foo.com", "bar.foo.com", "foo.com");
        
        verify("https://to", "to", "to");
        verify("http://to", "to", "to");
        verify("to", "to", "to");
        
        verify(".foo.com", ".foo.com", ".");
        verify(".foo", ".foo", ".");
        verify("-foo", "-foo", "-");
        verify("--foo", "--foo", "--");
        
        verify("/foo", "/foo", "/");
        verify("/@foo", "/@foo", "/@");
        
        verify("bar/foo", "bar/foo", "bar/foo");
        verify("bar.com/foo", "bar.com/foo", "bar.com");
        
        verify("www.", "www.", "*.");
        verify("www./", "www./", "www./");
        verify("www../", "www../", "www../");
        verify("g...", "g...", "*.");
        verify("#...", "#...", "#...");
        verify("/...", "/...", "/...");
        verify("...", "...", "...");
    }
}
