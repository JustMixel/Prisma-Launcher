using CapaEntidad;
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
    public partial class sfrmModPage : Form
    {
        private Mod modTemplate = null;
        private User userTemplate = null;
        public sfrmModPage(Mod mod/*, User developer*/)
        {
            InitializeComponent();
            this.modTemplate = mod;
            //this.userTemplate = developer;
            lblModTitle.BackColor = Color.Transparent;
            lblModRelease.BackColor = Color.Transparent;
            lblDevName.BackColor = Color.Transparent;
            lblModSize.BackColor = Color.Transparent;

            //Image userPic = ConvertImage2D.ByteArrayToImage(developer.User_Picture);

            //pbDev.Image = userPic;
            pbDev.Region = ConvertImage2D.GetRoundedImage(pbDev);
            /////////////
            
        }
        private void sfrmModPage_Load(object sender, EventArgs e)
        {
            lblModTitle.Text = modTemplate.Mod_Name;
            lblDevName.Text = modTemplate.Mod_Dev;
        }

        private void btnBack_Click(object sender, EventArgs e)
        {
            newForm(new sfrmStore());
        }

        private void newForm(object Form)
        {
            if (this.pnlScreen.Controls.Count > 0)
            {
                this.pnlScreen.Controls.Clear();
            }
            Form form = Form as Form;
            form.TopLevel = false;
            form.Dock = DockStyle.Fill;
            this.pnlScreen.Controls.Add(form);
            this.pnlScreen.Tag = form;
            form.Show();
        }
    }
}
