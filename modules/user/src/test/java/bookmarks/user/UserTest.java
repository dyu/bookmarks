// TODO copyright header

package bookmarks.user;

import java.io.IOException;

import com.dyuproject.protostuffdb.AbstractStoreTest;

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
    }

    Todo newTodo(String title) throws IOException
    {
        Todo message = new Todo(title);
        assertInitialized(message);

        assertTrue(XTodoOps.create(message, store, res, 
                Todo.PList.getPipeSchema(), header));

        assertNotNull(message.key);

        return message;
    }

    public void testTodo() throws IOException
    {
        newTodo("hello");
    }
}
