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
        Mod overflow = new Mod();
        public sfrmModPlayPage(Mod mod)
        {
            InitializeComponent();
            getButtonStatus();
            overflow = mod;

            lblDevData.Text = mod.Mod_Dev + ", " + mod.Mod_ReleaseYear.Year.ToString();
            lblDevData.Parent = Portrait;
            lblDevData.BackColor = Color.Transparent;
            lblDevData.TextAlign = ContentAlignment.MiddleCenter;

            lblDevData.AutoSize = false;                 
            lblDevData.Dock = DockStyle.Bottom;         
            lblDevData.Height = 90;


            Portrait.Image = ConvertImage2D.ByteArrayToImage(overflow.Mod_Portrait1);
            pbModLogo.Image = Properties.Resources.STEL3;
            pbModLogo.Parent = Portrait;
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

        private void btnBack_Click(object sender, EventArgs e)
        {
            newForm(new sfrmLibrary());
        }

        private void btnPlay_Click(object sender, EventArgs e)
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = overflow.Mod_Route,
                WorkingDirectory = Path.GetDirectoryName(overflow.Mod_Route),
                UseShellExecute = true
            };

            try
            {
                switch (Process.GetProcessesByName("gta_sa").Length)
                {
                    case 0:
                        btnPlay.BackColor = Color.Maroon;
                        btnPlay.Image = Properties.Resources.cancel_ico;
                        btnPlay.Text = "Stop";
                        Process.Start(startInfo);
                        break;

                    default:
                        foreach (var process in Process.GetProcessesByName("gta_sa"))
                        {
                            process.Kill();
                        }
                        btnPlay.BackColor = Color.Green;
                        btnPlay.Image = Properties.Resources.resum_ico;
                        btnPlay.Text = "Start";          
                        break;
                }
            }
            catch
            {
                // Display a message to the user saying the mod can't execute
            }
        }

        private void getButtonStatus()
        {
            switch (Process.GetProcessesByName("gta_sa").Length)
            {
                case 0:
                    btnPlay.BackColor = Color.Green;
                    btnPlay.Image = Properties.Resources.resum_ico;
                    btnPlay.Text = "Start";
                    break;

                default:
                    btnPlay.BackColor = Color.Maroon;
                    btnPlay.Image = Properties.Resources.cancel_ico;
                    btnPlay.Text = "Stop";
                    break;
            }
        }

        ////////////////////////////////////////////////////////////////
        ///                         BUTTONS
        ////////////////////////////////////////////////////////////////
        private void btnMain_Click(object sender, EventArgs e)
        {
            Portrait.Image = ConvertImage2D.ByteArrayToImage(overflow.Mod_Portrait1);
            btnMain.Enabled = false;
            //newForm(new );
        }

        private void btnStats_Click(object sender, EventArgs e)
        {
            Portrait.Image = ConvertImage2D.ByteArrayToImage(overflow.Mod_Portrait2);
            //newForm(new );
        }

        private void btnTrophy_Click(object sender, EventArgs e)
        {
            Portrait.Image = ConvertImage2D.ByteArrayToImage(overflow.Mod_Portrait3);
            //newForm(new );
        }
    }
}
