// TODO copyright header

package bookmarks.user;

import static com.dyuproject.protostuffdb.SerializedValueUtil.asBool;
import static com.dyuproject.protostuffdb.SerializedValueUtil.asInt32;
import static com.dyuproject.protostuffdb.SerializedValueUtil.readByteArray;
import static com.dyuproject.protostuffdb.SerializedValueUtil.readString;

import java.io.IOException;

import com.dyuproject.protostuff.KeyBuilder;
import com.dyuproject.protostuff.ds.CAS;
import com.dyuproject.protostuff.ds.MultiCAS;
import com.dyuproject.protostuff.ds.ParamRangeKey;
import com.dyuproject.protostuff.ds.ParamUpdate;
import com.dyuproject.protostuffdb.AbstractStoreTest;
import com.dyuproject.protostuffdb.DSRuntimeExceptions;
import com.dyuproject.protostuffdb.ValueUtil;

/**
 * User test.
 */
public class UserTest extends AbstractStoreTest
{

    UserProvider provider;

    public UserTest()
    {

    }

    public UserTest(UserProvider provider)
    {
        this.provider = provider;
    }

    @Override
    protected void init()
    {
        provider = new UserProvider();
        
        EntityRegistry.clearCacheForTests();
    }

    BookmarkTag newTag(String name) throws IOException
    {
        BookmarkTag message = new BookmarkTag(name);
        assertInitialized(message);
        
        assertTrue(XBookmarkTagOps.create(message, store, res, 
                BookmarkTag.PList.getPipeSchema(), header));
        
        assertNotNull(message.key);
        
        return message;
    }

    public void testUniqueTag() throws IOException
    {
        BookmarkTag entity = newTag("foo");
        
        byte[] value = store.get(entity.key, entity.em(), null, context);
        assertNotNull(value);
        
        assertEquals(entity.name, readString(BookmarkTag.FN_NAME, value, context));
        
        BookmarkTag same = new BookmarkTag(entity.name);
        assertInitialized(same);
        
        try
        {
            XBookmarkTagOps.create(entity, store, res, 
                    BookmarkTag.PList.getPipeSchema(), header);
            fail("Expected exception");
        }
        catch (DSRuntimeExceptions.Operation e)
        {
            assertTrue(e.getMessage().indexOf("exists") != -1);
        }
    }
    
    public void testEntryRegex() throws IOException
    {
        BookmarkEntry entity = new BookmarkEntry("http://example.com");
        entity.title = "\"'[]";
        assertInitialized(entity);
    }
    
    public void testNonAscii() throws IOException
    {
        BookmarkEntry entity = new BookmarkEntry("http://example.com");
        entity.title = "你好";
        assertTrue(entity.cachedSchema().isInitialized(entity));
    }
    
    public void testUniqueUrl() throws IOException
    {
        BookmarkTag t1 = newTag("t1");
        assertEquals(1, t1.id);
        
        BookmarkEntry entity = new BookmarkEntry("http://example.com");
        assertInitialized(entity);
        BookmarkEntry.PNew pnew = new BookmarkEntry.PNew(entity);
        pnew.addTags(t1.id);
        assertInitialized(pnew);
        
        assertTrue(BookmarkEntryOps.create(pnew, store, res, 
                BookmarkEntry.M.PList.getPipeSchema(), header));
        
        assertNotNull(entity.key);
        byte[] value = store.get(entity.key, entity.em(), null, context);
        assertNotNull(value);
        
        byte[] serTags = readByteArray(BookmarkEntry.FN_SER_TAGS, value, context);
        assertEquals(4, serTags.length);
        assertEquals(1, ValueUtil.toInt32LE(serTags, 0));
        
        pnew = new BookmarkEntry.PNew(new BookmarkEntry(entity.url));
        pnew.addTags(t1.id);
        assertInitialized(pnew);
        
        try
        {
            BookmarkEntryOps.create(pnew, store, res, 
                    BookmarkEntry.M.PList.getPipeSchema(), header);
            fail("Expected exception");
        }
        catch (DSRuntimeExceptions.Operation e)
        {
            assertTrue(e.getMessage().indexOf("exists") != -1);
        }
    }
    
    public void testOptionalTags() throws IOException
    {
        BookmarkTag t1 = newTag("t1");
        assertEquals(1, t1.id);
        
        BookmarkEntry entity = new BookmarkEntry("http://example.com");
        assertInitialized(entity);
        // no tags
        BookmarkEntry.PNew pnew = new BookmarkEntry.PNew(entity);
        assertInitialized(pnew);
        
        assertTrue(BookmarkEntryOps.create(pnew, store, res, 
                BookmarkEntry.M.PList.getPipeSchema(), header));
        
        assertNotNull(entity.key);
        byte[] value = store.get(entity.key, entity.em(), null, context);
        assertNotNull(value);
        assertEquals(0, asInt32(BookmarkEntry.VO_TAG_COUNT, value));
        
        byte[] serTags = readByteArray(BookmarkEntry.FN_SER_TAGS, value, context);
        assertEquals(0, serTags.length);
        
        // add tag
        UpdateTag req = new UpdateTag(entity.key, t1.id);
        assertInitialized(req);
        
        assertTrue(BookmarkEntryOps.updateTag(req, store, res, ParamInt.getPipeSchema(), header));
        
        value = store.get(entity.key, entity.em(), null, context);
        assertNotNull(value);
        assertEquals(1, asInt32(BookmarkEntry.VO_TAG_COUNT, value));
        
        serTags = readByteArray(BookmarkEntry.FN_SER_TAGS, value, context);
        assertEquals(4, serTags.length);
        
        KeyBuilder kb = TagIndex1.$$ACTIVE__TAG1_ID__ENTRY_KEY(context.kb(), 
                true, t1.id, entity.key, 0).$push();
        assertNotNull(store.rawGet(kb.buf(), kb.offset(), kb.len(), context));
        
        req = new UpdateTag(entity.key, t1.id);
        req.remove = true;
        assertInitialized(req);
        
        assertTrue(BookmarkEntryOps.updateTag(req, store, res, ParamInt.getPipeSchema(), header));
        
        value = store.get(entity.key, entity.em(), null, context);
        assertNotNull(value);
        assertEquals(0, asInt32(BookmarkEntry.VO_TAG_COUNT, value));
        
        serTags = readByteArray(BookmarkEntry.FN_SER_TAGS, value, context);
        assertEquals(0, serTags.length);
        
        assertFalse(store.exists(true, context, 
                TagIndex1.$$ACTIVE__TAG1_ID__ENTRY_KEY(context.kb(), true, t1.id, entity.key, 0)
                .$append8(TagIndex1.KIND).$push()));
    }
    
    BookmarkEntry newBookmarkEntry(BookmarkTag t1) throws IOException
    {
        BookmarkEntry entity = new BookmarkEntry("https://example.com");
        assertInitialized(entity);
        BookmarkEntry.PNew pnew = new BookmarkEntry.PNew(entity);
        pnew.addTags(t1.id);
        assertInitialized(pnew);
        
        assertTrue(BookmarkEntryOps.create(pnew, store, res, 
                BookmarkEntry.M.PList.getPipeSchema(), header));
        
        assertEquals("example.com", entity.normalized);
        
        KeyBuilder kb = TagIndex1.$$ACTIVE__TAG1_ID__ENTRY_KEY(context.kb(), 
                true, t1.id, entity.key, 0).$push();
        assertNotNull(store.rawGet(kb.buf(), kb.offset(), kb.len(), context));
        
        return entity;
    }
    
    public void testTag1() throws IOException
    {
        BookmarkTag t1 = newTag("t1");
        newBookmarkEntry(t1);
        
        // test view
        BookmarkEntry.PTags req = new BookmarkEntry.PTags(new ParamRangeKey(true));
        req.addTagId(t1.id);
        assertInitialized(req);
        assertTrue(BookmarkEntryViews.listBookmarkEntryByTag(req, store, reset(res), 
                BookmarkEntry.M.PList.getPipeSchema(), header));
        
        assertEquals(1, res.rawNestedCount);
    }
    
    BookmarkEntry newBookmarkEntry(BookmarkTag t1, BookmarkTag t2) throws IOException
    {
        BookmarkEntry entity = new BookmarkEntry("http://www.example.com");
        assertInitialized(entity);
        BookmarkEntry.PNew pnew = new BookmarkEntry.PNew(entity);
        pnew.addTags(t1.id);
        pnew.addTags(t2.id);
        assertInitialized(pnew);
        
        assertTrue(BookmarkEntryOps.create(pnew, store, res, 
                BookmarkEntry.M.PList.getPipeSchema(), header));
        
        assertEquals("example.com", entity.normalized);
        
        KeyBuilder kb = TagIndex1.$$ACTIVE__TAG1_ID__ENTRY_KEY(context.kb(), 
                true, t1.id, entity.key, 0).$push();
        assertNotNull(store.rawGet(kb.buf(), kb.offset(), kb.len(), context));
        
        kb = TagIndex1.$$ACTIVE__TAG1_ID__ENTRY_KEY(context.kb(), 
                true, t2.id, entity.key, 0).$push();
        assertNotNull(store.rawGet(kb.buf(), kb.offset(), kb.len(), context));
        
        kb = TagIndex2.$$ACTIVE__TAG1_ID__TAG2_ID__ENTRY_KEY(context.kb(), 
                true, t1.id, t2.id, entity.key, 0).$push();
        assertNotNull(store.rawGet(kb.buf(), kb.offset(), kb.len(), context));
        
        return entity;
    }
    
    public void testTag2() throws IOException
    {
        BookmarkTag t1, t2;
        newBookmarkEntry(t1 = newTag("t1"), t2 = newTag("t2"));
        
        // test view
        BookmarkEntry.PTags req = new BookmarkEntry.PTags(new ParamRangeKey(true));
        req.addTagId(t1.id);
        req.addTagId(t2.id);
        assertInitialized(req);
        assertTrue(BookmarkEntryViews.listBookmarkEntryByTag(req, store, reset(res), 
                BookmarkEntry.M.PList.getPipeSchema(), header));
        
        assertEquals(1, res.rawNestedCount);
    }
    
    public void testUpdate() throws IOException
    {
        BookmarkEntry entity = new BookmarkEntry("https://example.com");
        assertInitialized(entity);
        BookmarkEntry.PNew pnew = new BookmarkEntry.PNew(entity);
        assertInitialized(pnew);
        
        assertTrue(BookmarkEntryOps.create(pnew, store, res, 
                BookmarkEntry.M.PList.getPipeSchema(), header));
        
        assertNotNull(entity.key);
        MultiCAS mc = new MultiCAS()
            .addOp(new CAS.StringOp(BookmarkEntry.FN_TITLE, "", "title"));
        ParamUpdate req = new ParamUpdate(entity.key, mc);
        assertInitialized(req);
        assertNull(BookmarkEntryOps.updateBookmarkEntry(req, store, context, header));
        
        byte[] value = store.get(entity.key, BookmarkEntry.EM, null, context);
        assertNotNull(value);
        assertTrue(asBool(BookmarkEntry.VO_ACTIVE, value));
        assertEquals("title", readString(BookmarkEntry.FN_TITLE, value, context));
    }
    
    public void testUpdateActive() throws IOException
    {
        BookmarkEntry entity = new BookmarkEntry("https://example.com");
        assertInitialized(entity);
        BookmarkEntry.PNew pnew = new BookmarkEntry.PNew(entity);
        assertInitialized(pnew);
        
        assertTrue(BookmarkEntryOps.create(pnew, store, res, 
                BookmarkEntry.M.PList.getPipeSchema(), header));
        
        assertNotNull(entity.key);
        MultiCAS mc = new MultiCAS()
            .addOp(new CAS.BoolOp(BookmarkEntry.FN_ACTIVE, true, false));
        ParamUpdate req = new ParamUpdate(entity.key, mc);
        assertInitialized(req);
        assertNull(BookmarkEntryOps.updateBookmarkEntry(req, store, context, header));
        
        byte[] value = store.get(entity.key, BookmarkEntry.EM, null, context);
        assertNotNull(value);
        assertFalse(asBool(BookmarkEntry.VO_ACTIVE, value));
    }
    
    public void testUpdateActive1() throws IOException
    {
        BookmarkTag t1 = newTag("t1");
        BookmarkEntry entity = newBookmarkEntry(t1);
        
        // test view
        BookmarkEntry.PTags req = new BookmarkEntry.PTags(new ParamRangeKey(true));
        req.addTagId(t1.id);
        assertInitialized(req);
        assertTrue(BookmarkEntryViews.listBookmarkEntryByTag(req, store, reset(res), 
                BookmarkEntry.M.PList.getPipeSchema(), header));
        
        assertEquals(1, res.rawNestedCount);
        
        assertNotNull(entity.key);
        MultiCAS mc = new MultiCAS()
            .addOp(new CAS.BoolOp(BookmarkEntry.FN_ACTIVE, true, false));
        
        ParamUpdate reqUpdate = new ParamUpdate(entity.key, mc);
        assertInitialized(reqUpdate);
        assertNull(BookmarkEntryOps.updateBookmarkEntry(reqUpdate, store, context, header));
        
        byte[] value = store.get(entity.key, BookmarkEntry.EM, null, context);
        assertNotNull(value);
        assertFalse(asBool(BookmarkEntry.VO_ACTIVE, value));
        
        assertTrue(BookmarkEntryViews.listBookmarkEntryByTag(req, store, reset(res), 
                BookmarkEntry.M.PList.getPipeSchema(), header));
        
        assertEquals(0, res.rawNestedCount);
    }
}
