using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Drawing;

namespace CapaEntidad
{
    public class User
    {
        public int User_ID { get ; set; }
        public int User_Type { get; set; }
        public string User_Name { get; set; }
        public byte[] User_Picture { get; set; }
    }
    
    public class Mod
    {
        public int Mod_ID { get; set; }
        public string Mod_Name { get; set; }
        public string Mod_Desc { get; set; }
        public string Mod_Dev { get; set; }
        public string Mod_Logo { get; set; }
        public int Mod_Dwnlds { get; set; }
        public string Mod_Link { get; set; }
        public byte[] Mod_Picture { get; set; }
        public byte[] Mod_Banner { get; set; }
        public byte[] Mod_Portrait1 { get; set; }
        public byte[] Mod_Portrait2 { get; set; }
        public byte[] Mod_Portrait3 { get; set; }
        public DateTime Mod_ReleaseYear { get; set; }
        public float Mod_Size { get; set; }
        public string Mod_Route { get; set; }   // THIS ONE IS USED LOCALLY TO REGISTER THE PATH TO THE MOD EXECUTABLE
        public string Mod_Executable { get; set; }
        public int Mod_Status { get; set; }
        public DateTime Mod_DOR { get; set; }
    }

    public class UserDevGroup 
    {
        public string userName { get; set; }
        public byte[] userPicture { get; set; }
        public string userGroup { get; set; }
        public string userRole { get; set; }
    }
}
