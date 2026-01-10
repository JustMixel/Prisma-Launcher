using CapaEntidad;
using Newtonsoft.Json.Converters;
using Prisma_Studios_Launcher;
using System;
using System.IO;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using Markdig;
using CapaNegocio;

namespace Prisma_Launcher
{
    public partial class sfrmModPage : Form
    {
        private Mod modTemplate = null;
        private User userTemplate = null;
        private N_Launcher objNegocio = null;

        public sfrmModPage(Mod mod/*, User developer*/)
        {
            InitializeComponent();
            this.modTemplate = mod;
            //this.userTemplate = developer;
            lblModTitle.BackColor = Color.Transparent;
            lblModRelease.BackColor = Color.Transparent;

            /* 
               For the dev name maybe we can implement a way to show 2 names. One is the singular dev name, and the other one is the development group,
               the creator can choose wether to display one of those
            */
            lblDevName.BackColor = Color.Transparent;
            lblModSize.BackColor = Color.Transparent;

            //Image userPic = ConvertImage2D.ByteArrayToImage(developer.User_Picture);

            //pbDev.Image = userPic;
            pbDev.Region = ConvertImage2D.GetRoundedImage(pbDev);
            /////////////
            ///
                        //// MOD DESCRIPTION

            var markdown = File.ReadAllText(AppPath.appDataPath + @"\modDesc.md");
            var html = Markdown.ToHtml(markdown);

            File.WriteAllText(AppPath.appDataPath + @"\html.html", html);
            navigateHTML();

        }
        private void sfrmModPage_Load(object sender, EventArgs e)
        {
            lblModTitle.Text = modTemplate.Mod_Name;
            lblDevName.Text = modTemplate.Mod_Dev;
            //rtbContent.Text = modTemplate.Mod_Desc;
            DateTime modYear = modTemplate.Mod_ReleaseYear;
            lblModRelease.Text = modYear.Year.ToString();
            byte[] bannerImage = modTemplate.Mod_Banner;
            Banner.BackgroundImage = ConvertImage2D.ByteArrayToImage(bannerImage);

            /*//// MOD DESCRIPTION

            var markdown = File.ReadAllText(AppPath.appDataPath + @"\modDesc.md");
            var html = Markdown.ToHtml(markdown);

            File.WriteAllText(AppPath.appDataPath + @"\html.html", html);
            navigateHTML();*/
        }

        private async Task navigateHTML()
        {
            await webView.EnsureCoreWebView2Async(null);

            webView.CoreWebView2.Navigate(AppPath.appDataPath + @"\Welcome.html");
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
