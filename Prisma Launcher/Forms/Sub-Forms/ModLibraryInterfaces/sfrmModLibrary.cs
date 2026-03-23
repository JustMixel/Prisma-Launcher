using CapaEntidad;
using CapaNegocio;
using Newtonsoft.Json;
using Prisma_Studios_Launcher;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace Prisma_Launcher
{
    public partial class sfrmLibrary : Form
    {
        public sfrmLibrary()
        {
            InitializeComponent();
            lblLibrary.BackColor = Color.Transparent;
            generateItems("");  /// This parses the "gameLibrary.json" data to generate the mods
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
            // Read the JSON BOY!!!
            string json = File.ReadAllText(AppHandle.appDataPath + @"\gameLibrary.json");
            Dictionary<string, Mod> mods = JsonConvert.DeserializeObject<Dictionary<string, Mod>>(json);

            foreach (var mod in mods) 
            {
                uc_mod_store_item storeItem = new uc_mod_store_item();
                Mod mod_data = mod.Value;

                storeItem.Mod_Name = mod_data.Mod_Name;
                storeItem.Mod_Dev = mod_data.Mod_Dev;
                byte[] tryout = mod_data.Mod_Picture;
                Image modCover = ConvertImage2D.ByteArrayToImage(tryout);
                storeItem.Mod_Pic = modCover;

                storeItem.Tag = mod_data; // Almacena el objeto completo

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
            Mod mod = (Mod)clickedItem.Tag; // Recupera el mod del sender

            newForm(new sfrmModPlayPage(mod));
        }
 
        private void StoreItem_MouseEnter(object sender, EventArgs e)
        {
            uc_mod_store_item item = (uc_mod_store_item)sender;
            item.BackColor = SystemColors.ControlDark; // Efecto hover
            item.Width += 25;
            item.Height += 25;
        }

        private void StoreItem_MouseLeave(object sender, EventArgs e)
        {
            uc_mod_store_item item = (uc_mod_store_item)sender;
            item.BackColor = Color.Transparent;
            item.Width -= 25;
            item.Height -= 25;
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
