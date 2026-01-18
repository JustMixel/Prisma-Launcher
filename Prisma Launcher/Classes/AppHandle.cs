using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Prisma_Launcher
{
    public static class AppHandle
    {
        private static string filePath = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        public static readonly string appDataPath = Path.Combine(path1: filePath, path2: ".prisma");
        public static string currentWorkshopFolder = null;

        // Return disk volume label (the name of the drive)
        public static string getDiskName(string driveName) 
        {
            foreach (DriveInfo drive in DriveInfo.GetDrives()) 
            {
                if(drive.IsReady && drive.Name == driveName) 
                {
                    return drive.ToString();
                }
            }
            return null;
        }
        
        // Return free disk space in a selected drive
        public static long getDiskSpace(string driveName)
        {
            foreach (DriveInfo drive in DriveInfo.GetDrives()) 
            {
                if (drive.IsReady && drive.Name == driveName) 
                {                 
                    return drive.TotalFreeSpace; // bytes libres reales
                }
            }
            return -1;
        }

        public static void generateWorkshopFolder(string disk) 
        {
            if (!Directory.Exists(Path.Combine(path1: disk, path2: @"Prisma Workshop Folder")))
            {
                Directory.CreateDirectory(Path.Combine(path1: disk, path2: @"Prisma Workshop Folder"));
                currentWorkshopFolder = Path.Combine(path1: disk, path2: @"Prisma Workshop Folder");
            }           
            // ALSO ON TOP OF THAT, CREATE A JSON WHERE THE FOLDER ADRESS WILL BE SAVED
        }
    }
}
