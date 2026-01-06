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
    public partial class uc_mod_store_item : UserControl
    {

        public uc_mod_store_item()
        {
            InitializeComponent();
        }

        public string Mod_Name { get => lblModName.Text; set => lblModName.Text = value; }
        public string Mod_Dev { get => lblModDev.Text; set => lblModDev.Text = value; }
        public Image Mod_Pic { get => this.BackgroundImage; set => this.BackgroundImage = value; }
    }
}
