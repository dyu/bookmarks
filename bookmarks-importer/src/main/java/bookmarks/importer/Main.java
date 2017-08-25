package bookmarks.importer;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;

import protostuffdb.Jni;
import bookmarks.user.BookmarkTag;
import bookmarks.user.ImportUtil;

import com.dyuproject.protostuffdb.DSTool;
import com.dyuproject.protostuffdb.Datastore;
import com.dyuproject.protostuffdb.LsmdbDatastoreManager;
import com.dyuproject.protostuffdb.WriteContext;

public final class Main
{
    static void check(String path, String[] args, int offset) throws Exception
    {
        if ("-h".equals(path))
        {
            System.err.println(
                    "java -jar importer.jar path/to/input/file [out_dir] [type]");
            System.exit(1);
        }
        else if (path.indexOf(',') < 1) // comma must at least be in the index: 1
        {
            System.err.println(path + " does not exist.");
            System.exit(1);
        }
        else
        {
            // multiple input
            runMulti(ImportUtil.COMMA.split(path), args, offset);
        }
    }
    
    public static void main(String[] args) throws Exception
    {
        File f;
        if (args.length != 0)
        {
            if (!(f = new File(args[0])).exists())
            {
                check(args[0], args, 1);
                return;
            }
            
            FileInputStream in = new FileInputStream(f);
            try
            {
                run(in, 
                        args.length > 1 ? args[1] : genOutDir(),
                        args.length > 2 ? args[2] : "/");
            }
            finally
            {
                in.close();
            }
        }
        else if ((f = new File("target/import.html")).exists())
        {
            FileInputStream in = new FileInputStream(f);
            try
            {
                run(in, genOutDir(), "/");
            }
            finally
            {
                in.close();
            }
        }
        else
        {
            run(System.in, genOutDir(), "/");
        }
    }
    
    static String genOutDir()
    {
        return "target/data/" + new SimpleDateFormat("YYYY-MM-dd_HH-mm-ss").format(
                new Date(System.currentTimeMillis()));
    }
    
    static void persistTo(Datastore store, WriteContext context, 
            Datastore tmp, WriteContext tmpContext, 
            HashMap<String,BookmarkTag> tagMap)
    {
        ImportUtil.addEntries(store, context, tmp, tmpContext);
        ImportUtil.addTags(store, context, tagMap.values());
    }
    
    static File verifyDirs(String outDir)
    {
        final File dir = new File(outDir);
        File f;
        if (!dir.exists())
        {
            dir.mkdirs();
        }
        else if ((f=new File(dir, "tmp")).exists()
                || (f=new File(dir, "user")).exists())
        {
            System.err.println(f + " already exists.");
            System.exit(1);
        }
        
        return dir;
    }
    
    static void run(InputStream in, String outDir, String typeOrUri) throws Exception
    {
        final boolean slashStart = typeOrUri.charAt(0) == '/';
        final Importer importer = slashStart ? Importer.BUILTIN.delicious : 
                Importer.BUILTIN.valueOf(typeOrUri);
        
        final Document doc = Jsoup.parse(in, null, slashStart ? typeOrUri : "/");
        final File dir = verifyDirs(outDir);
        
        // load jni
        final WriteContext context = DSTool.CONTEXT;
        final LsmdbDatastoreManager manager = new LsmdbDatastoreManager(
                Jni.buf(0), dir);
        final WriteContext tmpContext = new WriteContext(
                Jni.bufDb(0), Jni.bufTmp(0), 0, Jni.PARTITION_SIZE);
        final HashMap<String,BookmarkTag> tagMap = new HashMap<String,BookmarkTag>();
        Datastore store;
        try
        {
            store = manager.getStore("tmp", LsmdbDatastoreManager.CREATE_IF_MISSING);
            
            importer.run(doc, tagMap, 0, store, context);
            
            persistTo(manager.getStore("user", LsmdbDatastoreManager.CREATE_IF_MISSING),
                    context, store, tmpContext, tagMap);
            
            System.err.println("Successfully imported to " + outDir);
        }
        finally
        {
            manager.close();
        }
    }
    
    static void runMulti(String[] types, String[] args, int offset) throws Exception
    {
        int count = args.length - offset - 1; // 1 for the outDir
        if (count != types.length)
        {
            System.err.println("The typeCSV does not match the trailing args.");
            System.err.println("Run with: delicious,chrome outDir path/to/delicious.html path/to/bookmarks.html");
            System.exit(1);
            return;
        }
        
        final String outDir = args[offset++];
        final File dir = verifyDirs(outDir);
        
        // load jni
        final WriteContext context = DSTool.CONTEXT;
        final LsmdbDatastoreManager manager = new LsmdbDatastoreManager(
                Jni.buf(0), dir);
        final WriteContext tmpContext = new WriteContext(
                Jni.bufDb(0), Jni.bufTmp(0), 0, Jni.PARTITION_SIZE);
        final HashMap<String,BookmarkTag> tagMap = new HashMap<String,BookmarkTag>();
        int tagCurrentId = 0;
        final Datastore store;
        Importer importer;
        FileInputStream in;
        Document doc;
        try
        {
            store = manager.getStore("tmp", LsmdbDatastoreManager.CREATE_IF_MISSING);
            for (int i = 0, len = types.length; i < len; i++)
            {
                importer = Importer.BUILTIN.valueOf(types[i]);
                in = new FileInputStream(new File(args[offset++]));
                try
                {
                    doc = Jsoup.parse(in, null, "/");
                    
                    tagCurrentId = importer.run(doc, tagMap, tagCurrentId, store, context);
                }
                finally
                {
                    in.close();
                }
            }
            
            persistTo(manager.getStore("user", LsmdbDatastoreManager.CREATE_IF_MISSING),
                    context, store, tmpContext, tagMap);
            
            System.err.println("Successfully imported to " + outDir);
        }
        finally
        {
            manager.close();
        }
    }
}
