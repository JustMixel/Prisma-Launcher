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

            // Mod name
           /* lblModName.AutoSize = false;
            lblModName.Dock = DockStyle.Bottom;
            lblModName.TextAlign = ContentAlignment.MiddleCenter;
            lblModName.Height = 50;

            // Mod dev name
            lblModDev.AutoSize = false;
            lblModDev.Dock = DockStyle.Bottom;
            lblModDev.TextAlign = ContentAlignment.MiddleCenter;
            lblModDev.Height = 20;*/
        }

        public string Mod_Name { get => lblModDev.Text; set => lblModDev.Text = value; }
        public string Mod_Dev { get => lblModName.Text; set => lblModName.Text = value; }
        public Image Mod_Pic { get => this.pbCover.Image; set => this.pbCover.Image = value; }
    }
}
