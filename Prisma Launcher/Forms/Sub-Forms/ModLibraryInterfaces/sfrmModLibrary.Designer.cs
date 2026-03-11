namespace Prisma_Launcher
{
    partial class sfrmLibrary
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
            this.pnlRScreen = new System.Windows.Forms.Panel();
            this.tbSearch = new Bunifu.Framework.UI.BunifuMaterialTextbox();
            this.fopContent = new System.Windows.Forms.FlowLayoutPanel();
            this.lblLibrary = new System.Windows.Forms.Label();
            this.pnlRScreen.SuspendLayout();
            this.SuspendLayout();
            // 
            // pnlRScreen
            // 
            this.pnlRScreen.Controls.Add(this.tbSearch);
            this.pnlRScreen.Controls.Add(this.fopContent);
            this.pnlRScreen.Controls.Add(this.lblLibrary);
            this.pnlRScreen.Dock = System.Windows.Forms.DockStyle.Fill;
            this.pnlRScreen.Location = new System.Drawing.Point(0, 0);
            this.pnlRScreen.Name = "pnlRScreen";
            this.pnlRScreen.Size = new System.Drawing.Size(1027, 565);
            this.pnlRScreen.TabIndex = 0;
            // 
            // tbSearch
            // 
            this.tbSearch.Cursor = System.Windows.Forms.Cursors.IBeam;
            this.tbSearch.Font = new System.Drawing.Font("Century Gothic", 9.75F);
            this.tbSearch.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(64)))), ((int)(((byte)(64)))), ((int)(((byte)(64)))));
            this.tbSearch.HintForeColor = System.Drawing.Color.Empty;
            this.tbSearch.HintText = "";
            this.tbSearch.isPassword = false;
            this.tbSearch.LineFocusedColor = System.Drawing.Color.Beige;
            this.tbSearch.LineIdleColor = System.Drawing.Color.Gray;
            this.tbSearch.LineMouseHoverColor = System.Drawing.Color.Beige;
            this.tbSearch.LineThickness = 3;
            this.tbSearch.Location = new System.Drawing.Point(2, 24);
            this.tbSearch.Margin = new System.Windows.Forms.Padding(4);
            this.tbSearch.Name = "tbSearch";
            this.tbSearch.Size = new System.Drawing.Size(370, 44);
            this.tbSearch.TabIndex = 8;
            this.tbSearch.Text = "Search...";
            this.tbSearch.TextAlign = System.Windows.Forms.HorizontalAlignment.Left;
            this.tbSearch.OnValueChanged += new System.EventHandler(this.tbSearch_OnValueChanged);
            this.tbSearch.Click += new System.EventHandler(this.tbSearch_Click);
            // 
            // fopContent
            // 
            this.fopContent.AutoScroll = true;
            this.fopContent.Location = new System.Drawing.Point(2, 76);
            this.fopContent.Margin = new System.Windows.Forms.Padding(8, 4, 0, 0);
            this.fopContent.Name = "fopContent";
            this.fopContent.Padding = new System.Windows.Forms.Padding(3, 3, 0, 0);
            this.fopContent.Size = new System.Drawing.Size(1023, 486);
            this.fopContent.TabIndex = 7;
            // 
            // lblLibrary
            // 
            this.lblLibrary.Anchor = System.Windows.Forms.AnchorStyles.Top;
            this.lblLibrary.AutoSize = true;
            this.lblLibrary.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(4)))), ((int)(((byte)(4)))), ((int)(((byte)(4)))));
            this.lblLibrary.Font = new System.Drawing.Font("Bahnschrift Condensed", 36F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblLibrary.ForeColor = System.Drawing.Color.Gainsboro;
            this.lblLibrary.Location = new System.Drawing.Point(472, 3);
            this.lblLibrary.Name = "lblLibrary";
            this.lblLibrary.Size = new System.Drawing.Size(153, 58);
            this.lblLibrary.TabIndex = 6;
            this.lblLibrary.Text = "LIBRARY";
            this.lblLibrary.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            // 
            // sfrmLibrary
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(18)))), ((int)(((byte)(18)))), ((int)(((byte)(18)))));
            this.ClientSize = new System.Drawing.Size(1027, 565);
            this.Controls.Add(this.pnlRScreen);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.None;
            this.Name = "sfrmLibrary";
            this.Text = "sfrmStore";
            this.pnlRScreen.ResumeLayout(false);
            this.pnlRScreen.PerformLayout();
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.Panel pnlRScreen;
        private Bunifu.Framework.UI.BunifuMaterialTextbox tbSearch;
        private System.Windows.Forms.FlowLayoutPanel fopContent;
        private System.Windows.Forms.Label lblLibrary;
    }
}