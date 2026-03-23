namespace Prisma_Launcher
{
    partial class sfrmModPlayPage
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
            this.btnSettings = new System.Windows.Forms.Button();
            this.pbModLogo = new System.Windows.Forms.PictureBox();
            this.btnBack = new System.Windows.Forms.Button();
            this.lblDevData = new System.Windows.Forms.Label();
            this.btnPlay = new System.Windows.Forms.Button();
            this.Portrait = new System.Windows.Forms.PictureBox();
            this.btnMain = new System.Windows.Forms.Button();
            this.btnTrophy = new System.Windows.Forms.Button();
            this.btnStats = new System.Windows.Forms.Button();
            this.pnlScreen.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.pbModLogo)).BeginInit();
            ((System.ComponentModel.ISupportInitialize)(this.Portrait)).BeginInit();
            this.SuspendLayout();
            // 
            // pnlScreen
            // 
            this.pnlScreen.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(224)))), ((int)(((byte)(224)))), ((int)(((byte)(224)))));
            this.pnlScreen.Controls.Add(this.btnStats);
            this.pnlScreen.Controls.Add(this.btnTrophy);
            this.pnlScreen.Controls.Add(this.btnMain);
            this.pnlScreen.Controls.Add(this.btnSettings);
            this.pnlScreen.Controls.Add(this.pbModLogo);
            this.pnlScreen.Controls.Add(this.btnBack);
            this.pnlScreen.Controls.Add(this.lblDevData);
            this.pnlScreen.Controls.Add(this.btnPlay);
            this.pnlScreen.Controls.Add(this.Portrait);
            this.pnlScreen.Dock = System.Windows.Forms.DockStyle.Fill;
            this.pnlScreen.Location = new System.Drawing.Point(0, 0);
            this.pnlScreen.Name = "pnlScreen";
            this.pnlScreen.Size = new System.Drawing.Size(1043, 604);
            this.pnlScreen.TabIndex = 12;
            // 
            // btnSettings
            // 
            this.btnSettings.Anchor = System.Windows.Forms.AnchorStyles.Bottom;
            this.btnSettings.BackColor = System.Drawing.Color.Black;
            this.btnSettings.Cursor = System.Windows.Forms.Cursors.Hand;
            this.btnSettings.FlatAppearance.BorderColor = System.Drawing.Color.Gainsboro;
            this.btnSettings.FlatAppearance.BorderSize = 2;
            this.btnSettings.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnSettings.Font = new System.Drawing.Font("Bahnschrift", 15.75F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnSettings.ForeColor = System.Drawing.Color.LightGray;
            this.btnSettings.Image = global::Prisma_Launcher.Properties.Resources.settings1_ico;
            this.btnSettings.Location = new System.Drawing.Point(417, 507);
            this.btnSettings.Name = "btnSettings";
            this.btnSettings.Size = new System.Drawing.Size(46, 43);
            this.btnSettings.TabIndex = 15;
            this.btnSettings.UseVisualStyleBackColor = false;
            // 
            // pbModLogo
            // 
            this.pbModLogo.Anchor = System.Windows.Forms.AnchorStyles.None;
            this.pbModLogo.Location = new System.Drawing.Point(119, 139);
            this.pbModLogo.Name = "pbModLogo";
            this.pbModLogo.Size = new System.Drawing.Size(823, 343);
            this.pbModLogo.SizeMode = System.Windows.Forms.PictureBoxSizeMode.CenterImage;
            this.pbModLogo.TabIndex = 14;
            this.pbModLogo.TabStop = false;
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
            this.btnBack.TabIndex = 12;
            this.btnBack.Text = "<";
            this.btnBack.UseVisualStyleBackColor = false;
            this.btnBack.Click += new System.EventHandler(this.btnBack_Click);
            // 
            // lblDevData
            // 
            this.lblDevData.Anchor = System.Windows.Forms.AnchorStyles.Bottom;
            this.lblDevData.AutoSize = true;
            this.lblDevData.Font = new System.Drawing.Font("Bahnschrift", 9.75F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblDevData.ForeColor = System.Drawing.SystemColors.AppWorkspace;
            this.lblDevData.Location = new System.Drawing.Point(505, 553);
            this.lblDevData.Name = "lblDevData";
            this.lblDevData.Size = new System.Drawing.Size(35, 16);
            this.lblDevData.TabIndex = 11;
            this.lblDevData.Text = "TEXT";
            this.lblDevData.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            // 
            // btnPlay
            // 
            this.btnPlay.Anchor = System.Windows.Forms.AnchorStyles.Bottom;
            this.btnPlay.BackColor = System.Drawing.Color.Green;
            this.btnPlay.Cursor = System.Windows.Forms.Cursors.Hand;
            this.btnPlay.FlatAppearance.BorderColor = System.Drawing.Color.Black;
            this.btnPlay.FlatAppearance.BorderSize = 2;
            this.btnPlay.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnPlay.Font = new System.Drawing.Font("Bahnschrift", 15.75F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnPlay.ForeColor = System.Drawing.Color.Gainsboro;
            this.btnPlay.Image = global::Prisma_Launcher.Properties.Resources.resum_ico;
            this.btnPlay.ImageAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.btnPlay.Location = new System.Drawing.Point(467, 507);
            this.btnPlay.Name = "btnPlay";
            this.btnPlay.Size = new System.Drawing.Size(206, 43);
            this.btnPlay.TabIndex = 10;
            this.btnPlay.Text = "Start";
            this.btnPlay.UseVisualStyleBackColor = false;
            this.btnPlay.Click += new System.EventHandler(this.btnPlay_Click);
            // 
            // Portrait
            // 
            this.Portrait.Anchor = System.Windows.Forms.AnchorStyles.None;
            this.Portrait.Location = new System.Drawing.Point(0, 0);
            this.Portrait.Name = "Portrait";
            this.Portrait.Size = new System.Drawing.Size(1043, 604);
            this.Portrait.SizeMode = System.Windows.Forms.PictureBoxSizeMode.CenterImage;
            this.Portrait.TabIndex = 13;
            this.Portrait.TabStop = false;
            // 
            // btnMain
            // 
            this.btnMain.Anchor = System.Windows.Forms.AnchorStyles.Right;
            this.btnMain.BackColor = System.Drawing.Color.DarkSlateBlue;
            this.btnMain.Cursor = System.Windows.Forms.Cursors.Hand;
            this.btnMain.FlatAppearance.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(18)))), ((int)(((byte)(18)))), ((int)(((byte)(18)))));
            this.btnMain.FlatAppearance.BorderSize = 2;
            this.btnMain.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnMain.Font = new System.Drawing.Font("Century Gothic", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnMain.ForeColor = System.Drawing.Color.Gainsboro;
            this.btnMain.Location = new System.Drawing.Point(999, 182);
            this.btnMain.Name = "btnMain";
            this.btnMain.Size = new System.Drawing.Size(32, 32);
            this.btnMain.TabIndex = 16;
            this.btnMain.Text = "M";
            this.btnMain.UseVisualStyleBackColor = false;
            this.btnMain.Click += new System.EventHandler(this.btnMain_Click);
            // 
            // btnTrophy
            // 
            this.btnTrophy.Anchor = System.Windows.Forms.AnchorStyles.Right;
            this.btnTrophy.BackColor = System.Drawing.Color.DarkSlateBlue;
            this.btnTrophy.Cursor = System.Windows.Forms.Cursors.Hand;
            this.btnTrophy.FlatAppearance.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(18)))), ((int)(((byte)(18)))), ((int)(((byte)(18)))));
            this.btnTrophy.FlatAppearance.BorderSize = 2;
            this.btnTrophy.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnTrophy.Font = new System.Drawing.Font("Century Gothic", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnTrophy.ForeColor = System.Drawing.Color.Gainsboro;
            this.btnTrophy.Location = new System.Drawing.Point(999, 393);
            this.btnTrophy.Name = "btnTrophy";
            this.btnTrophy.Size = new System.Drawing.Size(32, 32);
            this.btnTrophy.TabIndex = 17;
            this.btnTrophy.Text = "T";
            this.btnTrophy.UseVisualStyleBackColor = false;
            this.btnTrophy.Click += new System.EventHandler(this.btnTrophy_Click);
            // 
            // btnStats
            // 
            this.btnStats.Anchor = System.Windows.Forms.AnchorStyles.Right;
            this.btnStats.BackColor = System.Drawing.Color.DarkSlateBlue;
            this.btnStats.Cursor = System.Windows.Forms.Cursors.Hand;
            this.btnStats.FlatAppearance.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(18)))), ((int)(((byte)(18)))), ((int)(((byte)(18)))));
            this.btnStats.FlatAppearance.BorderSize = 2;
            this.btnStats.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.btnStats.Font = new System.Drawing.Font("Century Gothic", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnStats.ForeColor = System.Drawing.Color.Gainsboro;
            this.btnStats.Location = new System.Drawing.Point(999, 288);
            this.btnStats.Name = "btnStats";
            this.btnStats.Size = new System.Drawing.Size(32, 32);
            this.btnStats.TabIndex = 17;
            this.btnStats.Text = "S";
            this.btnStats.UseVisualStyleBackColor = false;
            this.btnStats.Click += new System.EventHandler(this.btnStats_Click);
            // 
            // sfrmModPlayPage
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(1043, 604);
            this.Controls.Add(this.pnlScreen);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.None;
            this.Name = "sfrmModPlayPage";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "sfrmModPage";
            this.pnlScreen.ResumeLayout(false);
            this.pnlScreen.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.pbModLogo)).EndInit();
            ((System.ComponentModel.ISupportInitialize)(this.Portrait)).EndInit();
            this.ResumeLayout(false);

        }

        #endregion
        private System.Windows.Forms.Panel pnlScreen;
        private System.Windows.Forms.Button btnPlay;
        private System.Windows.Forms.Label lblDevData;
        private System.Windows.Forms.Button btnBack;
        private System.Windows.Forms.PictureBox Portrait;
        private System.Windows.Forms.PictureBox pbModLogo;
        private System.Windows.Forms.Button btnSettings;
        private System.Windows.Forms.Button btnStats;
        private System.Windows.Forms.Button btnTrophy;
        private System.Windows.Forms.Button btnMain;
    }
}