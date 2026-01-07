namespace Prisma_Launcher
{
    partial class InitForm
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.components = new System.ComponentModel.Container();
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(InitForm));
            this.decor1 = new System.Windows.Forms.PictureBox();
            this.dragPnl = new System.Windows.Forms.Panel();
            this.bunifuDragControl1 = new Bunifu.Framework.UI.BunifuDragControl(this.components);
            this.tbName = new Bunifu.Framework.UI.BunifuMaterialTextbox();
            this.btnSend = new System.Windows.Forms.Button();
            this.focusCall = new System.Windows.Forms.Button();
            this.lblEntering = new System.Windows.Forms.Label();
            this.t_Loggin = new System.Windows.Forms.Timer(this.components);
            ((System.ComponentModel.ISupportInitialize)(this.decor1)).BeginInit();
            this.SuspendLayout();
            // 
            // decor1
            // 
            this.decor1.Image = global::Prisma_Launcher.Properties.Resources.palm;
            this.decor1.Location = new System.Drawing.Point(12, 103);
            this.decor1.Name = "decor1";
            this.decor1.Size = new System.Drawing.Size(65, 65);
            this.decor1.TabIndex = 0;
            this.decor1.TabStop = false;
            // 
            // dragPnl
            // 
            this.dragPnl.Dock = System.Windows.Forms.DockStyle.Top;
            this.dragPnl.Location = new System.Drawing.Point(0, 0);
            this.dragPnl.Name = "dragPnl";
            this.dragPnl.Size = new System.Drawing.Size(696, 28);
            this.dragPnl.TabIndex = 1;
            // 
            // bunifuDragControl1
            // 
            this.bunifuDragControl1.Fixed = true;
            this.bunifuDragControl1.Horizontal = true;
            this.bunifuDragControl1.TargetControl = this.dragPnl;
            this.bunifuDragControl1.Vertical = true;
            // 
            // tbName
            // 
            this.tbName.Cursor = System.Windows.Forms.Cursors.IBeam;
            this.tbName.Font = new System.Drawing.Font("Century Gothic", 9.75F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.tbName.ForeColor = System.Drawing.Color.Gainsboro;
            this.tbName.HintForeColor = System.Drawing.Color.Gainsboro;
            this.tbName.HintText = "";
            this.tbName.isPassword = false;
            this.tbName.LineFocusedColor = System.Drawing.Color.Beige;
            this.tbName.LineIdleColor = System.Drawing.Color.Gray;
            this.tbName.LineMouseHoverColor = System.Drawing.Color.LemonChiffon;
            this.tbName.LineThickness = 3;
            this.tbName.Location = new System.Drawing.Point(151, 49);
            this.tbName.Margin = new System.Windows.Forms.Padding(4);
            this.tbName.Name = "tbName";
            this.tbName.Size = new System.Drawing.Size(370, 41);
            this.tbName.TabIndex = 2;
            this.tbName.TextAlign = System.Windows.Forms.HorizontalAlignment.Left;
            this.tbName.OnValueChanged += new System.EventHandler(this.tbName_OnValueChanged);
            this.tbName.MouseClick += new System.Windows.Forms.MouseEventHandler(this.tbName_MouseClick);
            // 
            // btnSend
            // 
            this.btnSend.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnSend.Font = new System.Drawing.Font("Bahnschrift", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnSend.ForeColor = System.Drawing.Color.Gainsboro;
            this.btnSend.Location = new System.Drawing.Point(280, 116);
            this.btnSend.Name = "btnSend";
            this.btnSend.Size = new System.Drawing.Size(108, 31);
            this.btnSend.TabIndex = 3;
            this.btnSend.Text = "Send";
            this.btnSend.UseVisualStyleBackColor = true;
            this.btnSend.Visible = false;
            this.btnSend.Click += new System.EventHandler(this.btnSend_Click);
            // 
            // focusCall
            // 
            this.focusCall.FlatAppearance.BorderSize = 0;
            this.focusCall.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.focusCall.Font = new System.Drawing.Font("Bahnschrift", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.focusCall.ForeColor = System.Drawing.Color.Gainsboro;
            this.focusCall.Location = new System.Drawing.Point(576, 34);
            this.focusCall.Name = "focusCall";
            this.focusCall.Size = new System.Drawing.Size(108, 31);
            this.focusCall.TabIndex = 4;
            this.focusCall.UseVisualStyleBackColor = true;
            // 
            // lblEntering
            // 
            this.lblEntering.AutoSize = true;
            this.lblEntering.Font = new System.Drawing.Font("Century Gothic", 9.75F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblEntering.ForeColor = System.Drawing.Color.Gainsboro;
            this.lblEntering.Location = new System.Drawing.Point(311, 74);
            this.lblEntering.Name = "lblEntering";
            this.lblEntering.Size = new System.Drawing.Size(77, 16);
            this.lblEntering.TabIndex = 5;
            this.lblEntering.Text = "Initiating...";
            this.lblEntering.Visible = false;
            // 
            // t_Loggin
            // 
            this.t_Loggin.Interval = 60;
            // 
            // InitForm
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.SystemColors.ActiveCaptionText;
            this.ClientSize = new System.Drawing.Size(696, 159);
            this.Controls.Add(this.lblEntering);
            this.Controls.Add(this.focusCall);
            this.Controls.Add(this.btnSend);
            this.Controls.Add(this.tbName);
            this.Controls.Add(this.dragPnl);
            this.Controls.Add(this.decor1);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.None;
            this.Icon = ((System.Drawing.Icon)(resources.GetObject("$this.Icon")));
            this.Name = "InitForm";
            this.Opacity = 0.84D;
            this.ShowInTaskbar = false;
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "Prisma Launcher";
            this.Load += new System.EventHandler(this.InitForm_Load);
            ((System.ComponentModel.ISupportInitialize)(this.decor1)).EndInit();
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.PictureBox decor1;
        private System.Windows.Forms.Panel dragPnl;
        private Bunifu.Framework.UI.BunifuDragControl bunifuDragControl1;
        private Bunifu.Framework.UI.BunifuMaterialTextbox tbName;
        private System.Windows.Forms.Button btnSend;
        private System.Windows.Forms.Button focusCall;
        private System.Windows.Forms.Label lblEntering;
        private System.Windows.Forms.Timer t_Loggin;
    }
}