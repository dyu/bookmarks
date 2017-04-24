// TODO copyright header

package bookmarks.user;

import com.dyuproject.protostuff.RpcHeader;
import com.dyuproject.protostuffdb.Datastore;
import com.dyuproject.protostuffdb.WriteContext;

/**
 * Todo ops.
 */
public final class TodoOps
{
    private TodoOps() {}

    static String validateAndProvide(Todo req, long now,
            Datastore store, WriteContext context, RpcHeader header)
    {
        req.provide();
        return null;
    }
}
