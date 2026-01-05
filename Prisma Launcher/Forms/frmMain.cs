using CapaEntidad;
using Newtonsoft.Json;
using Prisma_Launcher;
using Prisma_Studios_Launcher;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Linq;
using System.Reflection.Emit;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace Prisma_Launcher
{
    public partial class frmMain : Form
    {
        static string filePath = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        string appDataPath = Path.Combine(path1: filePath, path2: ".prisma");
        DateTime targetTime = new DateTime(2026, 1, 4, 16, 26, 0);

        public frmMain(string json)
        {
            InitializeComponent();
            mainframeSettingsLoader(json);
        }

        private void mainframeSettingsLoader(string json)
        {

            var encryptionService = new EncryptionService("testing123");
            string user = encryptionService.Decrypt(json);

            User userData = JsonConvert.DeserializeObject<User>(user);

            lblUsername.Text = userData.User_Name;
            // Profile Picture Management
            pbUser.Image = (userData.User_Picture == null) ? pbUser.Image = Properties.Resources.unkUser /*false - get picture from json*/ : pbUser.Image = Properties.Resources.unkUser; /*true - default pfp*/
            pnlScreen.BackgroundImage = Properties.Resources.app_base;
            pbUser.Region = ConvertImage2D.GetRoundedImage(pbUser);
            //t_countdown.Start();
        }
        public void newForm(object Form)
        {
            if (this.pnlScreen.Controls.Count > 0)
            {
                this.pnlScreen.Controls.RemoveAt(0);
            }
            Form form = Form as Form;
            form.TopLevel = false;
            form.Dock = DockStyle.Fill;
            this.pnlScreen.Controls.Add(form);
            this.pnlScreen.Tag = form;
            form.Show();
        }

        private void t_countdown_Tick(object sender, EventArgs e)
        {

            DateTime now = DateTime.Now;

            if(now >= targetTime) 
            {
                t_countdown.Stop();
            }
            else 
            {
                TimeSpan restante = targetTime - now;
            }
        }

        ////////////////////////////||
        //          BUTTONS         ||
        ////////////////////////////||
        private void btnExit_Click(object sender, EventArgs e)
        {
            Application.Exit();
        }

        private void btnSize_Click(object sender, EventArgs e)
        {
            if (btnSize.Tag == "canBeMaximized")
            {
                this.WindowState = FormWindowState.Maximized;
                //btnSize.Image = Resources.restore_down;
                btnSize.Tag = "ButtonIsMaximized";
            }
            else
            {
                this.WindowState = FormWindowState.Normal;
                //btnSize.Image = Resources.maximize_app;
                btnSize.Tag = "canBeMaximized";
            }
        }

        private void btnMinimize_Click(object sender, EventArgs e)
        {
            this.WindowState = FormWindowState.Minimized;
        }

        // If you double-click the handling bar, the window will maximize
        private void pnTop_DoubleClick(object sender, EventArgs e)
        {
            if (btnSize.Tag == "canBeMaximized")
            {
                this.WindowState = FormWindowState.Maximized;
                //btnSize.Image = Resources.restore_down;
                btnSize.Tag = "ButtonIsMaximized";
            }
            else
            {
                this.WindowState = FormWindowState.Normal;
                //btnSize.Image = Resources.maximize_app;
                btnSize.Tag = "canBeMaximized";
            }
        }

        private void btnMinimize_MouseEnter(object sender, EventArgs e)
        {
            btnMinimize.BackColor = Color.LightGray;
        }

        private void btnMinimize_MouseLeave(object sender, EventArgs e)
        {
            btnMinimize.BackColor = Color.FromArgb(12, 12, 12);
        }
        //////
        private void btnSize_MouseEnter(object sender, EventArgs e)
        {
            btnSize.BackColor = Color.LightGray;
        }
        private void btnSize_MouseLeave(object sender, EventArgs e)
        {
            btnSize.BackColor = Color.FromArgb(12, 12, 12);
        }
        //////
        private void btnExit_MouseEnter(object sender, EventArgs e)
        {
            btnExit.BackColor = Color.LightGray;
        }

        private void btnExit_MouseLeave(object sender, EventArgs e)
        {
            btnExit.BackColor = Color.FromArgb(12, 12, 12);
        }
        private void btnStore_Click(object sender, EventArgs e)
        {
            newForm(new sfrmStore());
        }

        // QUICK FEATURE - CHANGE PFP
        private void pbUser_DoubleClick(object sender, EventArgs e)
        {
            OpenFileDialog ofd = new OpenFileDialog();
            ofd.Title = "Select a picture";
            if (ofd.ShowDialog() == DialogResult.OK) 
            {
                pbUser.Image = Image.FromFile(ofd.FileName);
                pbUser.Region = ConvertImage2D.GetRoundedImage(pbUser);
                byte[] carajo = ConvertImage2D.ImageToByteArray(pbUser.Image);           
            }
        }
    }
}
