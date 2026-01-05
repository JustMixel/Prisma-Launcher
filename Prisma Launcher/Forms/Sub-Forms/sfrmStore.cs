using CapaEntidad;
using CapaNegocio;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace Prisma_Launcher
{
    public partial class sfrmStore : Form
    {
        public sfrmStore()
        {
            InitializeComponent();
            lblStore.BackColor = Color.Transparent;
            generateItems("");
        }

        private void generateItems(string search)
        {
            N_Launcher objNegocio = new N_Launcher();
            List<Mod> modList = objNegocio.getMods(search);
            
            foreach (var mod in modList) 
            {
                uc_mod_store_item storeItem = new uc_mod_store_item();
                storeItem.Mod_Name = mod.Mod_Name;
                storeItem.Mod_Dev = mod.Mod_Dev;
                storeItem.Mod_BKC = Color.WhiteSmoke;
                fopContent.Controls.Add(storeItem);
            }
        }

        // Refresh the mod list after changes in the text box
        private void tbSearch_OnValueChanged(object sender, EventArgs e)
        {
            if (fopContent.Controls.Count > 0)
                fopContent.Controls.Clear();
            generateItems(tbSearch.Text);
        }
    }
}
