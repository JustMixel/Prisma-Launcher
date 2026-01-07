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
        public string User_DevGroup { get; set; }
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
    }
}
