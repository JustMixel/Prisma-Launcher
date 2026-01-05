namespace Prisma_Launcher
{
    partial class uc_mod_store_item
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

        #region Component Designer generated code

        /// <summary> 
        /// Required method for Designer support - do not modify 
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.lblModName = new System.Windows.Forms.Label();
            this.lblModDev = new System.Windows.Forms.Label();
            this.SuspendLayout();
            // 
            // lblModName
            // 
            this.lblModName.Anchor = System.Windows.Forms.AnchorStyles.None;
            this.lblModName.Font = new System.Drawing.Font("Bahnschrift", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblModName.Location = new System.Drawing.Point(54, 96);
            this.lblModName.Name = "lblModName";
            this.lblModName.Size = new System.Drawing.Size(102, 23);
            this.lblModName.TabIndex = 0;
            this.lblModName.Text = "Mod_Name";
            // 
            // lblModDev
            // 
            this.lblModDev.Anchor = System.Windows.Forms.AnchorStyles.None;
            this.lblModDev.AutoSize = true;
            this.lblModDev.Font = new System.Drawing.Font("Bahnschrift SemiLight", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblModDev.Location = new System.Drawing.Point(66, 119);
            this.lblModDev.Name = "lblModDev";
            this.lblModDev.Size = new System.Drawing.Size(74, 19);
            this.lblModDev.TabIndex = 1;
            this.lblModDev.Text = "Mod_Dev";
            // 
            // uc_mod_store_item
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.Controls.Add(this.lblModDev);
            this.Controls.Add(this.lblModName);
            this.Cursor = System.Windows.Forms.Cursors.Hand;
            this.Name = "uc_mod_store_item";
            this.Size = new System.Drawing.Size(202, 264);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.Label lblModName;
        private System.Windows.Forms.Label lblModDev;
    }
}
