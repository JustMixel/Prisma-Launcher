using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Security.Permissions;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using Newtonsoft.Json;
using CapaEntidad;
using System.Threading;

namespace Prisma_Launcher
{
    public partial class InitForm : Form
    {
        String[] textInit = { "What's your name?", "Can I have your name?", "Mind lending me your name?", "Your name! - NOW!", "Hold on, I need your name...", "Can I borrow your name?" };
        string encryptedJson;
        public InitForm()
        {
            InitializeComponent();
            focusCall.Focus();
            tbName.Visible = false;
            btnSend.Visible = false;
            this.ShowInTaskbar = false;
        }

        private void InitForm_Load(object sender, EventArgs e)
        {
            if (Directory.Exists(AppHandle.appDataPath))
            {
                logIn();
            }
            else 
            {
                this.ShowInTaskbar = true;
                tbName.Visible = true;
                btnSend.Visible = true;
                Random random = new Random();
                tbName.Text = textInit[random.Next(0, 5)];
            }
        }
        private void openMain()
        {
            this.Hide();
            frmMain frm = new frmMain(File.ReadAllText(AppHandle.appDataPath + @"\userData.json"));
            frm.ShowDialog();
            this.Close();
        }

        private void tbName_MouseClick(object sender, MouseEventArgs e)
        {
            tbName.Text = string.Empty;
        }

        private void tbName_OnValueChanged(object sender, EventArgs e)
        {
            if(tbName.Text.Length > 0) 
            {
                if(tbName.Text != string.Empty) 
                {
                    btnSend.Visible = true;
                }
                else
                {
                    btnSend.Visible = false;
                }
            }
            else 
            {
                btnSend.Visible = false;
            }
        }
        private void btnSend_Click(object sender, EventArgs e)
        {
            if (tbName.Text != string.Empty)
            {
                if (!Directory.Exists(AppHandle.appDataPath))
                {
                    generateCredentials();
                }
                else 
                {
                    logIn();
                }
            }
        }
        private void generateCredentials()
        {
            User user = new User();
            user.User_Name = tbName.Text;
            user.User_Picture = null;
            user.User_ID = -1;
            user.User_Type = -1;
            //user.User_DevGroup = null;

            Directory.CreateDirectory(AppHandle.appDataPath);

            string json = JsonConvert.SerializeObject(user, Formatting.Indented);
            var encryptionService = new EncryptionService("testing123");
            
            encryptedJson = encryptionService.Encrypt(json);

            File.WriteAllText(AppHandle.appDataPath + @"\userData.json", encryptedJson);

            string decryptedJson = encryptionService.Decrypt(encryptedJson);
            File.WriteAllText(AppHandle.appDataPath + @"\decrpytedStuff.json", decryptedJson);   
            logIn();
        }

        private void logIn()
        {
            if (this.Visible) 
            {
                tbName.Visible = false;
                btnSend.Visible = false;
                lblEntering.Visible = true;
                Thread.Sleep(1000);
                t_Loggin.Tick += T_Loggin_Tick;
                t_Loggin.Start();   
            }
        }

        private void T_Loggin_Tick(object sender, EventArgs e)
        {
            if (this.Opacity > 0) 
            {
                this.Opacity += -0.1;
            }
            else
            {
                Thread.Sleep(500);
                t_Loggin.Stop();
                openMain();
            }
        }
    }
}
