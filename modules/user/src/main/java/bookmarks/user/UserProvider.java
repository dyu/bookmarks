// TODO copyright header

package bookmarks.user;

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
    
    /*final Object[] visitorsByKind = new Object[64];
    
    @SuppressWarnings("unchecked")
    @Override
    public boolean visit(byte[] key, byte[] v, int voffset, int vlen, 
            WriteContext context, int index)
    {
        Visitor<WriteContext> vkind = null;
        final int tag = 0xFF&key[1];
        
        switch(tag)
        {
            case Tags.INIT:
                // TODO leverage initialization?
                return false;
                
            case Tags.ENTITY_INIT:
                // add to list if product
                vkind = (Visitor<WriteContext>)visitorsByKind[key[2]];
                if (vkind != null)
                    vkind.visit(key, v, voffset, vlen, context, 0);
                return false;
                
            case Tags.POST_ENTITY_INIT:
                // TODO do something after init and entity init?
                return false;
        }
        
        return false;
    }*/
    
    @Override
    public void fill(RpcService[] services, List<Integer> ids, 
            Datastore store, WriteContext context, Properties options, 
            DatastoreManager manager)
    {
        fill(services, ids, getClass());
        
        // init
        /*EntityRegistry.fill(visitorsByKind);
        
        store.scan(false, -1, false, 
                KeyUtil.newTagIndexRangeKeyStart(Tags.POST_ENTITY_INIT + 1), 
                context, this, null);*/
        
        EntityRegistry.initSeq(store, context);
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

