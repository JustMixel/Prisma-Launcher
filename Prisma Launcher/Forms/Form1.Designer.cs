namespace Prisma_Launcher.Forms
{
    partial class Form1
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
            this.tbSearch = new Bunifu.Framework.UI.BunifuMaterialTextbox();
            this.fopContent = new System.Windows.Forms.FlowLayoutPanel();
            this.lblStore = new System.Windows.Forms.Label();
            this.SuspendLayout();
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
            this.tbSearch.Location = new System.Drawing.Point(-6, 5);
            this.tbSearch.Margin = new System.Windows.Forms.Padding(4);
            this.tbSearch.Name = "tbSearch";
            this.tbSearch.Size = new System.Drawing.Size(370, 44);
            this.tbSearch.TabIndex = 5;
            this.tbSearch.Text = "Search...";
            this.tbSearch.TextAlign = System.Windows.Forms.HorizontalAlignment.Left;
            // 
            // fopContent
            // 
            this.fopContent.AutoScroll = true;
            this.fopContent.Location = new System.Drawing.Point(-6, 57);
            this.fopContent.Margin = new System.Windows.Forms.Padding(8, 4, 0, 0);
            this.fopContent.Name = "fopContent";
            this.fopContent.Padding = new System.Windows.Forms.Padding(3, 3, 0, 0);
            this.fopContent.Size = new System.Drawing.Size(1023, 486);
            this.fopContent.TabIndex = 4;
            // 
            // lblStore
            // 
            this.lblStore.AutoSize = true;
            this.lblStore.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(4)))), ((int)(((byte)(4)))), ((int)(((byte)(4)))));
            this.lblStore.Font = new System.Drawing.Font("Bahnschrift Condensed", 36F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblStore.ForeColor = System.Drawing.Color.Gainsboro;
            this.lblStore.Location = new System.Drawing.Point(472, -16);
            this.lblStore.Name = "lblStore";
            this.lblStore.Size = new System.Drawing.Size(125, 58);
            this.lblStore.TabIndex = 3;
            this.lblStore.Text = "STORE";
            this.lblStore.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            // 
            // Form1
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(1011, 526);
            this.Controls.Add(this.tbSearch);
            this.Controls.Add(this.fopContent);
            this.Controls.Add(this.lblStore);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.None;
            this.Name = "Form1";
            this.Text = "Form1";
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private Bunifu.Framework.UI.BunifuMaterialTextbox tbSearch;
        private System.Windows.Forms.FlowLayoutPanel fopContent;
        private System.Windows.Forms.Label lblStore;
    }
}