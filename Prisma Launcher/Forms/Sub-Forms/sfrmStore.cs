using CapaEntidad;
using CapaNegocio;
using Prisma_Studios_Launcher;
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

        private void newForm(object Form)
        {
            if (this.pnlRScreen.Controls.Count > 0)
            {
                this.pnlRScreen.Controls.Clear();
            }
            Form form = Form as Form;
            form.TopLevel = false;
            form.Dock = DockStyle.Fill;
            this.pnlRScreen.Controls.Add(form);
            this.pnlRScreen.Tag = form;
            form.Show();
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
                byte[] tryout = mod.Mod_Picture;
                Image modCover = ConvertImage2D.ByteArrayToImage(tryout);
                storeItem.Mod_Pic = modCover;

                storeItem.Tag = mod; // Almacena el objeto completo

                // Eventos
                storeItem.Click += StoreItem_Click;
                storeItem.MouseEnter += StoreItem_MouseEnter;
                storeItem.MouseLeave += StoreItem_MouseLeave;

                fopContent.Controls.Add(storeItem);
            }
        }

        private void StoreItem_Click(object sender, EventArgs e)
        {
            uc_mod_store_item clickedItem = (uc_mod_store_item)sender;
            Mod mod = (Mod)clickedItem.Tag; // Recuperar el mod

            /*N_Launcher objNegocio = new N_Launcher();
            Mod devve = objNegocio.getMods(search); // Traeme al desarrollador*/

            // O abrir detalles, instalar, etc.
            newForm(new sfrmModPage(mod/*, devve*/));
        }

        private void StoreItem_MouseEnter(object sender, EventArgs e)
        {
            uc_mod_store_item item = (uc_mod_store_item)sender;
            item.BackColor = SystemColors.ControlDark; // Efecto hover
        }

        private void StoreItem_MouseLeave(object sender, EventArgs e)
        {
            uc_mod_store_item item = (uc_mod_store_item)sender;
            item.BackColor = Color.Transparent;
        }

        // Refresh the mod list after changes in the text box
        private void tbSearch_OnValueChanged(object sender, EventArgs e)
        {
            if (fopContent.Controls.Count > 0)
                fopContent.Controls.Clear();
            generateItems(tbSearch.Text);
        }

        private void tbSearch_Click(object sender, EventArgs e)
        {
            tbSearch.Text = string.Empty;
        }
    }
}
