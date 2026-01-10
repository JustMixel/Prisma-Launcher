using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Prisma_Launcher
{
    public static class AppPath
    {
        private static string filePath = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        public static readonly string appDataPath = Path.Combine(path1: filePath, path2: ".prisma");
    }
}
