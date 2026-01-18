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
    public partial class sfrmModPage : Form
    {
        private Mod modTemplate = null;
        private User userTemplate = null;
        private N_Launcher objNegocio = null;
        string path;

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

            var markdown = File.ReadAllText(AppHandle.appDataPath + @"\modDesc.md");
            var html = Markdown.ToHtml(markdown);

            File.WriteAllText(AppHandle.appDataPath + @"\html.html", html);
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

            webView.CoreWebView2.Navigate(AppHandle.appDataPath + @"\Welcome.html");
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

        // DOWNLOAD THE MOD
        /*
            FIRST  - FROM THE SELECTED PATH, PULL THE DISK UNIT AND CHECK IF THE USER HAS SPACE ENOUGH TO DOWNLOAD THE JUNK
            SECOND - IF SO, CHECK IF A FOLDER OF 'PRISMA LAUNCHER MODS' EXISTS
                ** IF NOT, CREATE IT **
            THIRD  - IF ANY OF THE FOLDERS EXISTS, ASK THE USER ABOUT WHERE TO INSTALL IT
            FOURTH - OBTAIN THE LINK FROM THE DB AND THEN DOWNLOAD THE FILES IN THE DESIRED BRANCH OF THE 'PRISMA LAUNCHER MODS' FOLDER
            FIFTH  - EXTRACT THE FILES AND ADD THE MOD TO THE LIBRARY
        */
        private void btnDwnld_Click(object sender, EventArgs e)
        {
            try 
            {
                FolderBrowserDialog sfd = new FolderBrowserDialog();
                if(sfd.ShowDialog() == DialogResult.OK) 
                {                    
                    path = sfd.SelectedPath;
                    double diskSize = AppHandle.getDiskSpace(path.Substring(0, 3));                 
                    diskSize = diskSize / 1024d / 1024 / 1024;
                    Debug.WriteLine(Math.Round(diskSize, 1));

                    // Round the MOD SIZE up and then compare it with the free space on disk
                    double modSize = modTemplate.Mod_Size;
                    modSize = Math.Ceiling(modSize);

                    try 
                    {

                        if (diskSize > modSize)
                        {
                            if (!Directory.Exists(AppHandle.currentWorkshopFolder))
                            {
                                AppHandle.generateWorkshopFolder(path);
                                downloadMod();
                            }
                            else
                            {
                                downloadMod();
                            }
                        }
                        else 
                        {
                            // Make a pop-up appear saying that the user doesnt have enough space.
                        }
                    }
                    catch 
                    {

                    }
                }
            }
            catch 
            {

            } 
        }

       public async void downloadMod()
       {
            var downloader = new FileDownloader(timeoutSeconds: 600);
            var progress = new Progress<DownloadProgress>(reporte => {
                btnDwnld.Text = $"Descargando: {reporte.GetFormattedProgress()}";
            });
            var _cts = new CancellationTokenSource();

            string modName = modTemplate.Mod_Name;
            modName.Replace(":", "");
            modName.Replace(@"\", "");
            modName.Replace("/", "");
            modName.Replace("*", "");
            modName.Replace("?", "");
            modName.Replace("<", "");
            modName.Replace(">", "");
            modName.Replace("|", "");

            await downloader.DownloadFileAsync(modTemplate.Mod_Link, AppHandle.currentWorkshopFolder + $@"\{modName}.rar", progress, _cts.Token);

            //await downloader.DownloadFileAsync(url, outputPath, progress, cts.Token);
        }
    }
}
