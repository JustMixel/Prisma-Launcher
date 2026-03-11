using CapaEntidad;
using CapaNegocio;
using Markdig;
using Microsoft.Web.WebView2.Core;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Prisma_Studios_Launcher;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Data.SqlClient;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Security.Policy;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Xml.Linq;

namespace Prisma_Launcher
{
    public partial class sfrmModPlayPage : Form
    {

        public sfrmModPlayPage(Mod mod)
        {
            InitializeComponent();
            lblDevData.Text = mod.Mod_Dev + ", " + mod.Mod_ReleaseYear.Year.ToString();
            lblDevData.BackColor = Color.Transparent;
            Portrait.Image = Properties.Resources.bkg;
            pbModLogo.Image = Properties.Resources.STEL3;
            pbModLogo.BackColor = Color.Transparent;
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

        private async void sfrmModPage_Load(object sender, EventArgs e)
        {

        }

        private void btnBack_Click(object sender, EventArgs e)
        {
            newForm(new sfrmLibrary());
        }
    }
}
