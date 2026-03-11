using CapaEntidad;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Prisma_Launcher
{
    public class LibraryJsonHandler
    {
        // TYPE - Refers to the type of mod being added
        // type 0 -> Mod obtained through the Mod Store
        // type 1 -> Mod added to library through user device
        static Random idGenerator = null;
        public static void registerNewMod(Mod mod)
        {
            if (!File.Exists(AppHandle.appDataPath + @"\gameLibrary.json"))
            {
                Console.WriteLine("gameLibrary NO existe.");

                // This is to wrap the mod object inside a dictionary to make it look like this
                /*
                    "mod_name"
                    {
                        ...mod_data...
                    }
                */
                var wrapper = new Dictionary<string, Mod>
                {
                    { mod.Mod_Name.ToLower().Replace(" ", "_").Replace(":",""), mod }
                };

                string json = JsonConvert.SerializeObject(wrapper, Formatting.Indented);

                File.WriteAllText(AppHandle.appDataPath + @"\gameLibrary.json", json);
            }
            else 
            {
                Console.WriteLine("gameLibrary SI existe.");
            }
        }
    }
}
