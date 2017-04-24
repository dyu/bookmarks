// TODO copyright header

package bookmarks.user;

import java.util.List;
import java.util.Properties;

import com.dyuproject.protostuff.RpcLogin;
import com.dyuproject.protostuff.RpcService;
import com.dyuproject.protostuff.RpcServiceProvider;
import com.dyuproject.protostuffdb.Datastore;
import com.dyuproject.protostuffdb.DatastoreManager;
import com.dyuproject.protostuffdb.WriteContext;

/**
 * User service provider.
 */
public class UserProvider extends RpcServiceProvider
{

    @Override
    public void fill(RpcService[] services, List<Integer> ids, 
            Datastore store, WriteContext context, Properties options, 
            DatastoreManager manager)
    {
        fill(services, ids, getClass());
    }

    @Override
    public byte[] authenticate(RpcLogin login, Datastore store, WriteContext context)
    {
        return null;
    }

    public static final UserServices.ForUser FOR_USER = new UserServices.ForUser(){};
}

