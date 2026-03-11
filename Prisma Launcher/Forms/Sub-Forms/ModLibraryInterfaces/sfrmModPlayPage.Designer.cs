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
            this.lblDevData = new System.Windows.Forms.Label();
            this.btnBack = new System.Windows.Forms.Button();
            this.pbModLogo = new System.Windows.Forms.PictureBox();
            this.btnPlay = new System.Windows.Forms.Button();
            this.Portrait = new System.Windows.Forms.PictureBox();
            this.pnlScreen.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.pbModLogo)).BeginInit();
            ((System.ComponentModel.ISupportInitialize)(this.Portrait)).BeginInit();
            this.SuspendLayout();
            // 
            // pnlScreen
            // 
            this.pnlScreen.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(224)))), ((int)(((byte)(224)))), ((int)(((byte)(224)))));
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
            // lblDevData
            // 
            this.lblDevData.Anchor = System.Windows.Forms.AnchorStyles.Bottom;
            this.lblDevData.AutoSize = true;
            this.lblDevData.ForeColor = System.Drawing.SystemColors.AppWorkspace;
            this.lblDevData.Location = new System.Drawing.Point(515, 553);
            this.lblDevData.Name = "lblDevData";
            this.lblDevData.Size = new System.Drawing.Size(35, 13);
            this.lblDevData.TabIndex = 11;
            this.lblDevData.Text = "TEXT";
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
            // pbModLogo
            // 
            this.pbModLogo.Anchor = System.Windows.Forms.AnchorStyles.None;
            this.pbModLogo.Location = new System.Drawing.Point(186, 146);
            this.pbModLogo.Name = "pbModLogo";
            this.pbModLogo.Size = new System.Drawing.Size(705, 317);
            this.pbModLogo.SizeMode = System.Windows.Forms.PictureBoxSizeMode.CenterImage;
            this.pbModLogo.TabIndex = 14;
            this.pbModLogo.TabStop = false;
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
            this.btnPlay.Image = global::Prisma_Launcher.Properties.Resources.play_ico;
            this.btnPlay.ImageAlign = System.Drawing.ContentAlignment.MiddleLeft;
            this.btnPlay.Location = new System.Drawing.Point(430, 507);
            this.btnPlay.Name = "btnPlay";
            this.btnPlay.Size = new System.Drawing.Size(206, 43);
            this.btnPlay.TabIndex = 10;
            this.btnPlay.Text = "Play";
            this.btnPlay.UseVisualStyleBackColor = false;
            // 
            // Portrait
            // 
            this.Portrait.Dock = System.Windows.Forms.DockStyle.Fill;
            this.Portrait.Location = new System.Drawing.Point(0, 0);
            this.Portrait.Name = "Portrait";
            this.Portrait.Size = new System.Drawing.Size(1043, 604);
            this.Portrait.SizeMode = System.Windows.Forms.PictureBoxSizeMode.CenterImage;
            this.Portrait.TabIndex = 13;
            this.Portrait.TabStop = false;
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
            this.Load += new System.EventHandler(this.sfrmModPage_Load);
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
    }
}