// TODO copyright header

package bookmarks.user;

import static com.dyuproject.protostuffdb.SerializedValueUtil.asInt32;

import java.io.IOException;
import java.util.List;
import java.util.Properties;

import com.dyuproject.protostuff.Pipe;
import com.dyuproject.protostuff.RpcHeader;
import com.dyuproject.protostuff.RpcLogin;
import com.dyuproject.protostuff.RpcResponse;
import com.dyuproject.protostuff.RpcService;
import com.dyuproject.protostuff.RpcServiceProvider;
import com.dyuproject.protostuff.RpcWorker;
import com.dyuproject.protostuffdb.Datastore;
import com.dyuproject.protostuffdb.DatastoreManager;
import com.dyuproject.protostuffdb.WriteContext;

/**
 * User service provider.
 */
public class UserProvider extends RpcServiceProvider// implements Visitor<WriteContext>
{
    static final boolean WITH_BACKUP = Boolean.getBoolean("protostuffdb.with_backup");
    
    @Override
    public void fill(RpcService[] services, List<Integer> ids, 
            Datastore store, WriteContext context, Properties options, 
            DatastoreManager manager)
    {
        fill(services, ids, getClass());
        
        EntityRegistry.initSeq(store, context);
    }
    
    @Override
    public boolean handleLogUpdates(byte[] buf, int offset, int len)
    {
        processLogUpdates(buf, offset, len);
        return false;
    }
    
    @Override
    protected void processLogEntity(int kind, byte[] k, int koffset, 
            byte[] v, int voffset, int vlen)
    {
        int id, newId;
        switch (kind)
        {
            case BookmarkTag.KIND:
                id = asInt32(BookmarkTag.VO_ID, v, voffset, vlen);
                newId = EntityRegistry.BOOKMARK_TAG_CACHE.newId();
                if (id == newId)
                {
                    // insert
                    EntityRegistry.BOOKMARK_TAG_CACHE.add(k, koffset, v, voffset, vlen);
                }
                else if (id < newId)
                {
                    // update
                    EntityRegistry.BOOKMARK_TAG_CACHE.update(id, v, voffset, vlen);
                }
                else
                {
                    System.err.println("Unordered log update on kind: " + kind);
                    System.exit(1);
                }
                break;
        }
    }
    
    @Override
    public byte[] authenticate(RpcLogin login, Datastore store, WriteContext context)
    {
        return null;
    }

    public static final UserServices.ForUser FOR_USER = new UserServices.ForUser()
    {
        @Override
        public boolean backup(Datastore store, RpcResponse res, 
                Pipe.Schema<ParamString> resPipeSchema,
                RpcHeader header) throws IOException
        {
            if (!WITH_BACKUP)
                return res.fail("Backup not available.");
            
            String backupName = RpcWorker.get().backup(store);
            if (backupName == null)
                return res.fail("Backup failed.");
            
            res.output.writeString(ParamString.FN_P, backupName, false);
            return true;
        }
    };
}

