// TODO copyright header

package bookmarks.cli;

import io.airlift.command.Cli.CliBuilder;
import io.airlift.command.ParseException;

import com.dyuproject.protostuffdb.EntityMetadataRegistry;
import com.dyuproject.protostuffdb.TagMetadata;
import com.dyuproject.protostuffdb.CliUtil;
import com.dyuproject.protostuffdb.DSTool;

/**
 * The main class.
 */
public final class Main
{
    private Main() {}

    public enum Modules implements TagMetadata
    {
        USER(bookmarks.user.EntityRegistry.REGISTRY)
        {
            @Override
            public boolean isUserManaged(int tag)
            {
                return false;
            }

            @Override
            public String getName(int tag)
            {
                return null;
            }

            @Override
            void configure(CliBuilder<Runnable> builder)
            {
                // you can add custom commands to append to the builder
            }
        }
        // add another enum value for your other modules

        ;

        abstract void configure(CliBuilder<Runnable> builder);

        public final EntityMetadataRegistry registry;

        private Modules(EntityMetadataRegistry registry)
        {
            this.registry = registry;
        }
    }

    public static void main(String[] args)
    {
        final CliBuilder<Runnable> builder = DSTool.newBuilder();

        for(Modules m : Modules.values())
        {
            DSTool.register(m.name().toLowerCase(), m.registry, m);

            m.configure(builder);
        }

        try
        {
            for(Runnable r : CliUtil.getRunnables(args, builder.build()))
                r.run();
        }
        catch(IllegalArgumentException e)
        {
            System.err.println(e.getMessage());
        }
        catch (ParseException e)
        {
            System.err.println(e.getMessage());
        }
    }

}
