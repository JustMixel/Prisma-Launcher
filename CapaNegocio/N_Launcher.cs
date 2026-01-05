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
    }
}
