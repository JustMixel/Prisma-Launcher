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
    public partial class sfrmModPage : Form
    {
        private Mod modTemplate = null;
        //private User userTemplate = null;
        private N_Launcher objNegocio = new N_Launcher();           
        string path;

        // DOWNLOADER VARS
        private CancellationTokenSource _cts;
        private FileDownloader _downloader;
        private bool isModDownloading = false;

        public sfrmModPage(Mod mod)
        {
            InitializeComponent();
            this.modTemplate = mod;
            lblModTitle.BackColor = Color.Transparent;
            lblModRelease.BackColor = Color.Transparent;
            lblModSize.Text = $"Size: {modTemplate.Mod_Size} GB";
            /* 
               For the dev name maybe we can implement a way to show 2 names. One is the singular dev name, and the other one is the development group,
               the creator can choose wether to display one of those
            */
            lblDevName.BackColor = Color.Transparent;
            lblDevName.TextAlign = ContentAlignment.MiddleCenter;
            lblDevName.AutoSize = false;

            lblModSize.BackColor = Color.Transparent;


            //// MOD CREATOR DATA
            UserDevGroup developer = objNegocio.getDev(modTemplate.Mod_ID);

            // Profile Picture Management
            pbDev.Image = (developer.userPicture == null) ? pbDev.Image = Properties.Resources.unkUser /*false - default pfp*/ : pbDev.Image = ConvertImage2D.ByteArrayToImage(developer.userPicture); /*true - get picture from byte array*/
            pbDev.Region = ConvertImage2D.GetRoundedImage(pbDev);

            // Show name
            lblDevName.Text = developer.userName;
            /////////////
            ///
                        //// MOD DESCRIPTION

            var html = modTemplate.Mod_Desc;

            /*File.WriteAllText(AppHandle.appDataPath + @"\html.html", html);
            navigateHTML();*/

        }
        private async void sfrmModPage_Load(object sender, EventArgs e)
        {
            lblModTitle.Text = modTemplate.Mod_Name;
            lblDevName.Text = modTemplate.Mod_Dev;
            //rtbContent.Text = modTemplate.Mod_Desc;
            DateTime modYear = modTemplate.Mod_ReleaseYear;
            lblModRelease.Text = modYear.Year.ToString();
            byte[] bannerImage = modTemplate.Mod_Banner;
            Banner.BackgroundImage = ConvertImage2D.ByteArrayToImage(bannerImage);

            //// MOD DESCRIPTION

            /*var markdown = File.ReadAllText(AppPath.appDataPath + @"\modDesc.md");
            var html = Markdown.ToHtml(markdown);

            File.WriteAllText(AppPath.appDataPath + @"\html.html", html);
            navigateHTML();*/

            await webView.EnsureCoreWebView2Async(null);
            webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
            webView.CoreWebView2.Settings.AreDevToolsEnabled = false;
            webView.NavigateToString(modTemplate.Mod_Desc);
        }

        private async Task navigateHTML()
        {
            await webView.EnsureCoreWebView2Async(null);

            webView.CoreWebView2.NavigateToString(modTemplate.Mod_Desc);
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
                if (isModDownloading.Equals(false)) 
                {
                    FolderBrowserDialog sfd = new FolderBrowserDialog();
                    if (sfd.ShowDialog() == DialogResult.OK)
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
                                    btnDwnld.Text = "...";
                                    btnDwnld.Image = null;
                                    btnCancel.Visible = true;
                                    btnDwnld.BackColor = Color.ForestGreen;
                                    downloadMod();
                                }
                                else
                                {
                                    btnDwnld.Text = "...";
                                    btnDwnld.Image = null;
                                    btnCancel.Visible = true;
                                    btnDwnld.BackColor = Color.ForestGreen;
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
                else if (_downloader.IsPaused)
                {
                    _downloader.Resume();
                    btnDwnld.Text = "Resumed";
                    btnDwnld.BackColor = Color.ForestGreen;
                    btnDwnld.Image = Properties.Resources.dwnld_ico;
                }
                else 
                {
                    _downloader.Pause();
                    btnDwnld.Text = "Paused";
                    btnDwnld.BackColor = Color.DarkOrange;
                    btnDwnld.Image = Properties.Resources.resum_ico;
                }
            }
            catch 
            {

            } 
        }
        private void btnCancel_Click(object sender, EventArgs e)
        {
            btnCancel.Visible = false;
            _cts?.Cancel();
            _downloader?.Resume();
            // Button setup
            btnDwnld.BackColor = Color.Green;
            btnDwnld.Text = "Download";
            btnDwnld.Image = Properties.Resources.dwnld_ico;
        }

        public async void downloadMod()
       {
            _downloader = new FileDownloader(timeoutSeconds: 600);
            _cts = new CancellationTokenSource();

            var progress = new Progress<DownloadProgress>(reporte => {
                btnDwnld.Text = reporte.GetFormattedProgress(); // Muestra "[PAUSADO]" cuando pausas
            });

            var extractProgress = new Progress<ExtractionProgress>(p => {
                btnDwnld.Text = $"Extrayendo: {p.GetFormattedProgress()}";
            });

            // Limpia el nombre para quitar caracteres invalidos para Windows
            Char[] symbols = { ':', '\'', '/', '*', '?', '<', '>', '|', ' ' };
            string modName = modTemplate.Mod_Name;
            for (int i = 0; i < symbols.Length; i++)
            {
                foreach (char c in symbols)
                {
                    if (modName.Contains(c))
                    {
                        if (c.Equals(' '))
                        {
                            modName = modName.Replace(c, '_');
                        }
                        modName = modName.Replace(c.ToString(), "");
                    }
                }
            }

            isModDownloading = true;
            try
            {
                await _downloader.DownloadFileAsync(
                    url: modTemplate.Mod_Link,
                    destinationPath: AppHandle.currentWorkshopFolder + $@"\{modName}.rar",
                    progress: progress,
                    autoExtract: true,
                    extractToFolder: AppHandle.currentWorkshopFolder + $@"\{modName}",
                    extractProgress: extractProgress,
                    deleteAfterExtraction: true,
                    cancellationToken: _cts.Token
                );

                // Updates the button to PLAY
                btnDwnld.Text = "PLAY";
                btnDwnld.BackColor = Color.Green;
                btnDwnld.Image = Properties.Resources.play_ico;
                btnCancel.Visible = false;

                // Registers the mod in the Library

                try
                {
                    if(modTemplate != null)
                    {
                        Random idGenerator = new Random();
                        Mod Mod = new Mod
                        {
                            Mod_Name = modTemplate.Mod_Name,
                            Mod_Desc = modTemplate.Mod_Desc,
                            Mod_Picture = modTemplate.Mod_Picture,
                            Mod_Dev = modTemplate.Mod_Dev,
                            Mod_Route = path + @"\gta_sa.exe",
                            Mod_Size = modTemplate.Mod_Size,
                            Mod_ID = idGenerator.Next(10000, 99999),
                            Mod_Logo = modTemplate.Mod_Logo
                        };
                        LibraryJsonHandler.registerNewMod(Mod);
                    }
                }
                catch (Exception ex)
                {
                    // modTemplate is null or not valid 
                }
            }
            catch (TaskCanceledException)
            {
                // CANCELADO
                btnDwnld.Text = "Download";
                btnDwnld.BackColor = Color.Green;    
            }
            catch (Exception ex)
            {
                // ERROR
                btnDwnld.Text = "Download";
                btnDwnld.BackColor = Color.Green;
                btnDwnld.Image = Properties.Resources.dwnld_ico;
                btnCancel.Visible = false;
                MessageBox.Show($"Error: {ex.Message}");
            }
            finally
            {
                isModDownloading = false;
                btnCancel.Visible = false;
                _downloader?.Dispose();
                _cts?.Dispose();
                _downloader = null;
                _cts = null;
            }
        }
    }
}
