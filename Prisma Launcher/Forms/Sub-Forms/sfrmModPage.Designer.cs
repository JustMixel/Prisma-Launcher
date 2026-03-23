namespace Prisma_Launcher
{
    partial class sfrmModPage
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
            this.pnlScreen = new System.Windows.Forms.Panel();
            this.Banner = new System.Windows.Forms.Panel();
            this.btnBack = new System.Windows.Forms.Button();
            this.midSquare1 = new System.Windows.Forms.Panel();
            this.lblModRelease = new System.Windows.Forms.Label();
            this.lblModTitle = new System.Windows.Forms.Label();
            this.midSquare2 = new System.Windows.Forms.Panel();
            this.webView = new Microsoft.Web.WebView2.WinForms.WebView2();
            this.rightPanel = new System.Windows.Forms.Panel();
            this.btnCancel = new System.Windows.Forms.Button();
            this.btnDwnld = new System.Windows.Forms.Button();
            this.lblModSize = new System.Windows.Forms.Label();
            this.lblDevName = new System.Windows.Forms.Label();
            this.pbDev = new System.Windows.Forms.PictureBox();
            this.starsRating = new Bunifu.Framework.UI.BunifuRating();
            this.lblDownloads = new System.Windows.Forms.Label();
            this.pnlScreen.SuspendLayout();
            this.Banner.SuspendLayout();
            this.midSquare1.SuspendLayout();
            this.midSquare2.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.webView)).BeginInit();
            this.rightPanel.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.pbDev)).BeginInit();
            this.SuspendLayout();
            // 
            // pnlScreen
            // 
            this.pnlScreen.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(255)))), ((int)(((byte)(224)))), ((int)(((byte)(192)))));
            this.pnlScreen.Controls.Add(this.Banner);
            this.pnlScreen.Controls.Add(this.midSquare1);
            this.pnlScreen.Controls.Add(this.midSquare2);
            this.pnlScreen.Controls.Add(this.rightPanel);
            this.pnlScreen.Dock = System.Windows.Forms.DockStyle.Fill;
            this.pnlScreen.Location = new System.Drawing.Point(0, 0);
            this.pnlScreen.Name = "pnlScreen";
            this.pnlScreen.Size = new System.Drawing.Size(1043, 604);
            this.pnlScreen.TabIndex = 12;
            // 
            // Banner
            // 
            this.Banner.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(140)))), ((int)(((byte)(0)))), ((int)(((byte)(35)))));
            this.Banner.BackgroundImageLayout = System.Windows.Forms.ImageLayout.Stretch;
            this.Banner.Controls.Add(this.btnBack);
            this.Banner.Dock = System.Windows.Forms.DockStyle.Bottom;
            this.Banner.Location = new System.Drawing.Point(0, 0);
            this.Banner.Name = "Banner";
            this.Banner.Size = new System.Drawing.Size(785, 188);
            this.Banner.TabIndex = 14;
            // 
            // btnBack
            // 
            this.btnBack.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(32)))), ((int)(((byte)(32)))), ((int)(((byte)(32)))));
            this.btnBack.Cursor = System.Windows.Forms.Cursors.Hand;
            this.btnBack.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnBack.Font = new System.Drawing.Font("Century Gothic", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnBack.ForeColor = System.Drawing.Color.Gainsboro;
            this.btnBack.Location = new System.Drawing.Point(3, 3);
            this.btnBack.Name = "btnBack";
            this.btnBack.Size = new System.Drawing.Size(32, 32);
            this.btnBack.TabIndex = 11;
            this.btnBack.Text = "<";
            this.btnBack.UseVisualStyleBackColor = false;
            this.btnBack.Click += new System.EventHandler(this.btnBack_Click);
            // 
            // midSquare1
            // 
            this.midSquare1.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(12)))), ((int)(((byte)(12)))), ((int)(((byte)(12)))));
            this.midSquare1.Controls.Add(this.lblModRelease);
            this.midSquare1.Controls.Add(this.lblModTitle);
            this.midSquare1.Dock = System.Windows.Forms.DockStyle.Bottom;
            this.midSquare1.Location = new System.Drawing.Point(0, 188);
            this.midSquare1.Name = "midSquare1";
            this.midSquare1.Size = new System.Drawing.Size(785, 146);
            this.midSquare1.TabIndex = 13;
            // 
            // lblModRelease
            // 
            this.lblModRelease.Anchor = System.Windows.Forms.AnchorStyles.None;
            this.lblModRelease.AutoSize = true;
            this.lblModRelease.BackColor = System.Drawing.Color.DarkGreen;
            this.lblModRelease.Font = new System.Drawing.Font("Century Gothic", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblModRelease.ForeColor = System.Drawing.Color.Gray;
            this.lblModRelease.Location = new System.Drawing.Point(12, 75);
            this.lblModRelease.Name = "lblModRelease";
            this.lblModRelease.Size = new System.Drawing.Size(108, 21);
            this.lblModRelease.TabIndex = 12;
            this.lblModRelease.Text = "Release year";
            // 
            // lblModTitle
            // 
            this.lblModTitle.Anchor = System.Windows.Forms.AnchorStyles.None;
            this.lblModTitle.AutoSize = true;
            this.lblModTitle.BackColor = System.Drawing.Color.DarkGreen;
            this.lblModTitle.Font = new System.Drawing.Font("Century Gothic", 26.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblModTitle.ForeColor = System.Drawing.Color.DimGray;
            this.lblModTitle.Location = new System.Drawing.Point(12, 34);
            this.lblModTitle.Name = "lblModTitle";
            this.lblModTitle.Size = new System.Drawing.Size(162, 41);
            this.lblModTitle.TabIndex = 11;
            this.lblModTitle.Text = "Mod title";
            // 
            // midSquare2
            // 
            this.midSquare2.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(24)))), ((int)(((byte)(24)))), ((int)(((byte)(24)))));
            this.midSquare2.Controls.Add(this.webView);
            this.midSquare2.Dock = System.Windows.Forms.DockStyle.Bottom;
            this.midSquare2.Location = new System.Drawing.Point(0, 334);
            this.midSquare2.Name = "midSquare2";
            this.midSquare2.Size = new System.Drawing.Size(785, 270);
            this.midSquare2.TabIndex = 12;
            // 
            // webView
            // 
            this.webView.AllowExternalDrop = true;
            this.webView.Anchor = System.Windows.Forms.AnchorStyles.None;
            this.webView.CreationProperties = null;
            this.webView.DefaultBackgroundColor = System.Drawing.Color.White;
            this.webView.Location = new System.Drawing.Point(0, 0);
            this.webView.Name = "webView";
            this.webView.Size = new System.Drawing.Size(785, 270);
            this.webView.TabIndex = 0;
            this.webView.ZoomFactor = 1D;
            // 
            // rightPanel
            // 
            this.rightPanel.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(12)))), ((int)(((byte)(12)))), ((int)(((byte)(12)))));
            this.rightPanel.Controls.Add(this.lblDownloads);
            this.rightPanel.Controls.Add(this.starsRating);
            this.rightPanel.Controls.Add(this.btnCancel);
            this.rightPanel.Controls.Add(this.btnDwnld);
            this.rightPanel.Controls.Add(this.lblModSize);
            this.rightPanel.Controls.Add(this.lblDevName);
            this.rightPanel.Controls.Add(this.pbDev);
            this.rightPanel.Dock = System.Windows.Forms.DockStyle.Right;
            this.rightPanel.Location = new System.Drawing.Point(785, 0);
            this.rightPanel.Name = "rightPanel";
            this.rightPanel.Size = new System.Drawing.Size(258, 604);
            this.rightPanel.TabIndex = 11;
            // 
            // btnCancel
            // 
            this.btnCancel.BackColor = System.Drawing.Color.Maroon;
            this.btnCancel.Cursor = System.Windows.Forms.Cursors.Hand;
            this.btnCancel.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnCancel.Font = new System.Drawing.Font("Century Gothic", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnCancel.ForeColor = System.Drawing.Color.Gainsboro;
            this.btnCancel.Location = new System.Drawing.Point(199, 505);
            this.btnCancel.Name = "btnCancel";
            this.btnCancel.Size = new System.Drawing.Size(35, 32);
            this.btnCancel.TabIndex = 12;
            this.btnCancel.Text = "x";
            this.btnCancel.UseVisualStyleBackColor = false;
            this.btnCancel.Visible = false;
            this.btnCancel.Click += new System.EventHandler(this.btnCancel_Click);
            // 
            // btnDwnld
            // 
            this.btnDwnld.Anchor = System.Windows.Forms.AnchorStyles.Bottom;
            this.btnDwnld.BackColor = System.Drawing.Color.Green;
            this.btnDwnld.Cursor = System.Windows.Forms.Cursors.Hand;
            this.btnDwnld.FlatAppearance.BorderColor = System.Drawing.Color.Gainsboro;
            this.btnDwnld.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnDwnld.Font = new System.Drawing.Font("Bahnschrift", 15.75F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnDwnld.ForeColor = System.Drawing.Color.Gainsboro;
            this.btnDwnld.Image = global::Prisma_Launcher.Properties.Resources.dwnld_ico;
            this.btnDwnld.ImageAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.btnDwnld.Location = new System.Drawing.Point(28, 540);
            this.btnDwnld.Name = "btnDwnld";
            this.btnDwnld.Size = new System.Drawing.Size(206, 43);
            this.btnDwnld.TabIndex = 9;
            this.btnDwnld.Text = "Download";
            this.btnDwnld.UseVisualStyleBackColor = false;
            this.btnDwnld.Click += new System.EventHandler(this.btnDwnld_Click);
            // 
            // lblModSize
            // 
            this.lblModSize.Anchor = System.Windows.Forms.AnchorStyles.Bottom;
            this.lblModSize.AutoSize = true;
            this.lblModSize.BackColor = System.Drawing.Color.DarkGreen;
            this.lblModSize.Font = new System.Drawing.Font("Century Gothic", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblModSize.ForeColor = System.Drawing.Color.Silver;
            this.lblModSize.Location = new System.Drawing.Point(25, 516);
            this.lblModSize.Name = "lblModSize";
            this.lblModSize.Size = new System.Drawing.Size(75, 21);
            this.lblModSize.TabIndex = 10;
            this.lblModSize.Text = "Size: ~1~";
            // 
            // lblDevName
            // 
            this.lblDevName.Anchor = System.Windows.Forms.AnchorStyles.Top;
            this.lblDevName.AutoSize = true;
            this.lblDevName.BackColor = System.Drawing.Color.DarkGreen;
            this.lblDevName.Font = new System.Drawing.Font("Century Gothic", 18F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblDevName.ForeColor = System.Drawing.Color.DimGray;
            this.lblDevName.Location = new System.Drawing.Point(24, 156);
            this.lblDevName.Name = "lblDevName";
            this.lblDevName.Size = new System.Drawing.Size(211, 28);
            this.lblDevName.TabIndex = 7;
            this.lblDevName.Text = "Developer Name";
            // 
            // pbDev
            // 
            this.pbDev.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(140)))), ((int)(((byte)(0)))), ((int)(((byte)(35)))));
            this.pbDev.Cursor = System.Windows.Forms.Cursors.Hand;
            this.pbDev.Location = new System.Drawing.Point(67, 25);
            this.pbDev.Name = "pbDev";
            this.pbDev.Size = new System.Drawing.Size(128, 128);
            this.pbDev.SizeMode = System.Windows.Forms.PictureBoxSizeMode.StretchImage;
            this.pbDev.TabIndex = 6;
            this.pbDev.TabStop = false;
            // 
            // starsRating
            // 
            this.starsRating.BackColor = System.Drawing.Color.Transparent;
            this.starsRating.ForeColor = System.Drawing.Color.DarkGoldenrod;
            this.starsRating.Location = new System.Drawing.Point(28, 423);
            this.starsRating.Name = "starsRating";
            this.starsRating.Size = new System.Drawing.Size(212, 40);
            this.starsRating.TabIndex = 13;
            this.starsRating.Value = 0;
            // 
            // lblDownloads
            // 
            this.lblDownloads.AutoSize = true;
            this.lblDownloads.Font = new System.Drawing.Font("Bahnschrift", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblDownloads.ForeColor = System.Drawing.Color.Gainsboro;
            this.lblDownloads.Location = new System.Drawing.Point(80, 265);
            this.lblDownloads.Name = "lblDownloads";
            this.lblDownloads.Size = new System.Drawing.Size(105, 19);
            this.lblDownloads.TabIndex = 14;
            this.lblDownloads.Text = "DOWNLOADS";
            // 
            // sfrmModPage
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(1043, 604);
            this.Controls.Add(this.pnlScreen);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.None;
            this.Name = "sfrmModPage";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "sfrmModPage";
            this.Load += new System.EventHandler(this.sfrmModPage_Load);
            this.pnlScreen.ResumeLayout(false);
            this.Banner.ResumeLayout(false);
            this.midSquare1.ResumeLayout(false);
            this.midSquare1.PerformLayout();
            this.midSquare2.ResumeLayout(false);
            ((System.ComponentModel.ISupportInitialize)(this.webView)).EndInit();
            this.rightPanel.ResumeLayout(false);
            this.rightPanel.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.pbDev)).EndInit();
            this.ResumeLayout(false);

        }

        #endregion
        private System.Windows.Forms.Panel pnlScreen;
        private System.Windows.Forms.Panel rightPanel;
        private System.Windows.Forms.Label lblDevName;
        private System.Windows.Forms.PictureBox pbDev;
        private System.Windows.Forms.Panel midSquare2;
        private System.Windows.Forms.Panel midSquare1;
        private System.Windows.Forms.Panel Banner;
        private System.Windows.Forms.Button btnBack;
        private System.Windows.Forms.Label lblModTitle;
        private System.Windows.Forms.Label lblModRelease;
        private System.Windows.Forms.Label lblModSize;
        private System.Windows.Forms.Button btnDwnld;
        private Microsoft.Web.WebView2.WinForms.WebView2 webView;
        private System.Windows.Forms.Button btnCancel;
        private Bunifu.Framework.UI.BunifuRating starsRating;
        private System.Windows.Forms.Label lblDownloads;
    }
}