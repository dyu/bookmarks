// TODO copyright header

package bookmarks.all;

import protostuffdb.Jni;

/**
 * The main class.
 */
public final class Main
{
    public static void main(String[] args) throws Exception
    {
        // pre init logic ...

        Jni.main(args.length != 0 ? args : new String[]{new java.io.File(".").getCanonicalPath()});

        // post init logic ...
    }
}
