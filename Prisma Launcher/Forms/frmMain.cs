using CapaEntidad;
using CapaNegocio;
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
using System.Management;
using System.Reflection.Emit;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Xml.Linq;
using static System.Windows.Forms.VisualStyles.VisualStyleElement.StartPanel;

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
            pbUser.Image = Properties.Resources.unkUser;
            lblUsername.Text = userData.User_Name;
            
            // Profile Picture Management           
            pbUser.Image = (userData.User_Picture == null) ? pbUser.Image = Properties.Resources.unkUser /*false - default pfp*/ : pbUser.Image = ConvertImage2D.ByteArrayToImage(userData.User_Picture); /*true - get picture from byte array*/
            
            pnlScreen.BackgroundImage = Properties.Resources.app_base;
            pbUser.Region = ConvertImage2D.GetRoundedImage(pbUser);

            userData.User_Type = 0; // DELETE THIS - THIS IS FOR TESTING!!!!
            // This is just a concept IDEA - if his type is different than -1, then connect to the DB, look him up and get his type data.
            switch (userData.User_Type)
            {
                case -1:
                    lblType.Visible = false;
                    break;
                case 0:
                    lblType.Text = "Creator";
                    break;
                case 1:
                    lblType.Text = "Moderator";
                    break;
                default:
                    lblType.Text = "Unknown user type";
                    break;
            }

        }
        public void newForm(object Form)
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
        private void updateCredentials()
        {
            User user = new User();
            user.User_Name = lblUsername.Text;
            byte[] userPic = ConvertImage2D.ImageToByteArray(pbUser.Image);
            user.User_Picture = userPic;

            // If the user is of type > -1, then loggin in the DB and get his ID.
            //user.User_ID = int.Parse(lblType.Text);
            user.User_ID = -1;

            user.User_Type = -1;

            // This is just a concept IDEA - if his type is different than -1, then connect to the DB, look him up and get his type data.
            switch (user.User_Type) 
            {
                case -1:
                    lblType.Visible = false;
                    break;
                case 0:
                    lblType.Text = "Creator";
                    break;
                case 1:
                    lblType.Text = "Moderator";
                    break;
                default:
                    lblType.Text = "Unkown user type";
                    break;
            }

            string json = JsonConvert.SerializeObject(user, Formatting.Indented);
            var encryptionService = new EncryptionService("testing123");

            string encryptedJson = encryptionService.Encrypt(json);

            File.WriteAllText(appDataPath + @"\userData.json", encryptedJson);

            string decryptedJson = encryptionService.Decrypt(encryptedJson);
            File.WriteAllText(appDataPath + @"\decrpytedStuff.json", decryptedJson); 
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
            if (btnSize.Tag.Equals("canBeMaximized"))
            {
                this.WindowState = FormWindowState.Maximized;
                btnSize.Image = Properties.Resources.restore_down;
                btnSize.Tag = "ButtonIsMaximized";
            }
            else
            {
                this.WindowState = FormWindowState.Normal;
                btnSize.Image = Properties.Resources.maximize_app;
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
            if (btnSize.Tag.Equals("canBeMaximized"))
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
        private void btnLibr_Click(object sender, EventArgs e)
        {
            newForm(new sfrmLibrary());
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
                updateCredentials();         
            }
        }
        private void button3_Click_1(object sender, EventArgs e)
        {
            N_Launcher sexo = new N_Launcher();

            OpenFileDialog ofd = new OpenFileDialog();
            ofd.Title = "Select a picture";
            if (ofd.ShowDialog() == DialogResult.OK)
            {
                yeat.Image = Image.FromFile(ofd.FileName);
                byte[] carajo = ConvertImage2D.ImageToByteArray(yeat.Image);
                sexo.givePicture(carajo, 1);
            }
        }

        private void btnBanner_Click(object sender, EventArgs e)
        {
            N_Launcher sexo = new N_Launcher();

            OpenFileDialog ofd = new OpenFileDialog();
            ofd.Title = "Select a picture";
            if (ofd.ShowDialog() == DialogResult.OK)
            {
                Bann.Image = Image.FromFile(ofd.FileName);
                byte[] carajo = ConvertImage2D.ImageToByteArray(Bann.Image);
                sexo.giveBanner(carajo, 1);
            }
        }

        private void btnPFP_Click(object sender, EventArgs e)
        {
            N_Launcher sexo = new N_Launcher();

            OpenFileDialog ofd = new OpenFileDialog();
            ofd.Title = "Select a picture";
            if (ofd.ShowDialog() == DialogResult.OK)
            {
                sds.Image = Image.FromFile(ofd.FileName);
                byte[] carajo = ConvertImage2D.ImageToByteArray(sds.Image);
                sexo.givePFP(carajo, 2);
            }
        }

        private void button4_Click(object sender, EventArgs e)
        {
            N_Launcher sexo = new N_Launcher();
            string HTML =
                "<!DOCTYPE html>\r\n<html>\r\n<head>\r\n  <meta charset=\"utf-8\">\r\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\r\n  <title>Welcome file</title>\r\n  <link rel=\"stylesheet\" href=\"https://stackedit.io/style.css\" />\r\n\r\n  <style>\r\n    html, body {\r\n      background-color: rgb(24, 24, 24) !important;\r\n      color: #e0e0e0;\r\n    }\r\n\r\n    .stackedit {\r\n      background-color: rgb(24, 24, 24) !important;\r\n    }\r\n\r\n    .stackedit__html {\r\n      background-color: rgb(24, 24, 24) !important;\r\n    }\r\n  </style>\r\n</head>\r\n\r\n<body class=\"stackedit\">\r\n  <div class=\"stackedit__html\">\r\n    <h1>Sinopsis</h1>\r\n    <p>Día 12 de Abril, del año 2011:</p>\r\n    <p>Los criminales Nick Redfield, Aaron Crossley y Tyler Wilson acuerdan ir a Los Santos para efectuar un trato con unos traficantes; luego de que el trato fuera una farsa, Aaron contacta con un amigo que los ayudaría a ganar dinero. Lo que no sabían, es que lentamente iban hacia su propia perdición.</p>\r\n    <p>Experimenta la historia de The Empire desde la perspectiva de Nick Redfield, y observa como a medida que va subiendo la cantidad de sangre derramada en sus manos, también aumenta su deseo por el dinero.</p>\r\n\r\n    <h1>Actualizaciones</h1>\r\n    <h3><strong>v1.4.1</strong></h3>\r\n    <p>Esta versión contiene mejoras y varios cambios comparada a la <strong>Standard Edition v1.3</strong>. Se agregaron características y se hicieron correcciones a varias misiones.</p>\r\n\r\n    <h3><strong>Patch Notes (v1.4.1)</strong></h3>\r\n    <ul>\r\n      <li>El coche de policía de LS fue cambiado</li>\r\n      <li>Se modificó un segmento en “Merchandise On The Run”</li>\r\n      <li>Se ha reformulado el sistema del 100%</li>\r\n      <li>Se revisó y fortaleció la estructura de algunas misiones</li>\r\n      <li>Ahora el monólogo al inicio del juego es saltable</li>\r\n    </ul>\r\n\r\n    <p><strong>Advertencia: Si usas Windows 11, es MUY PROBABLE que encuentres errores debido a incompatibilidades con archivos .asi.</strong></p>\r\n  </div>\r\n</body>\r\n</html>";
            sexo.updateDesc(2, HTML);
            
        }
    }
}
