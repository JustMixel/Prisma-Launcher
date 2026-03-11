using CapaDatos;
using CapaEntidad;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CapaNegocio
{
    public class N_Launcher
    {
        private D_Launcher objDatos;

        public N_Launcher()
        {
            objDatos = new D_Launcher();
        }
        public List<Mod> getMods(string name) 
        {
            return objDatos.getMod(name);
        }

        public UserDevGroup getDev(int ID)
        {
            return objDatos.getDev(ID);
        }

        public Mod givePicture(byte[] image, int ID)
        {
            return objDatos.givePicture(image, ID);
        }

        public User givePFP(byte[] image, int ID)
        {
            return objDatos.givePFP(image, ID);
        }

        public Mod giveBanner(byte[] image, int ID)
        {
            return objDatos.giveBanner(image, ID);
        }

        public Mod updateDesc(int ID, string content)
        {
            return objDatos.updateDesc(ID, content);
        }
    }
}
