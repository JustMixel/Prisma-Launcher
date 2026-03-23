namespace Prisma_Launcher
{
    partial class uc_mod_store_item_COPY
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
            this.pbData = new System.Windows.Forms.Panel();
            this.panel1 = new System.Windows.Forms.Panel();
            this.lblModName = new System.Windows.Forms.Label();
            this.lblModDev = new System.Windows.Forms.Label();
            this.pbCover = new System.Windows.Forms.PictureBox();
            this.pbData.SuspendLayout();
            this.panel1.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.pbCover)).BeginInit();
            this.SuspendLayout();
            // 
            // pbData
            // 
            this.pbData.Controls.Add(this.lblModDev);
            this.pbData.Controls.Add(this.lblModName);
            this.pbData.Dock = System.Windows.Forms.DockStyle.Bottom;
            this.pbData.Location = new System.Drawing.Point(0, 218);
            this.pbData.Name = "pbData";
            this.pbData.Size = new System.Drawing.Size(202, 69);
            this.pbData.TabIndex = 0;
            // 
            // panel1
            // 
            this.panel1.Controls.Add(this.pbCover);
            this.panel1.Dock = System.Windows.Forms.DockStyle.Fill;
            this.panel1.Location = new System.Drawing.Point(0, 0);
            this.panel1.Name = "panel1";
            this.panel1.Size = new System.Drawing.Size(202, 218);
            this.panel1.TabIndex = 1;
            // 
            // lblModName
            // 
            this.lblModName.AutoSize = true;
            this.lblModName.Font = new System.Drawing.Font("Bahnschrift SemiLight SemiConde", 11.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblModName.ForeColor = System.Drawing.SystemColors.ControlLight;
            this.lblModName.Location = new System.Drawing.Point(61, 22);
            this.lblModName.Name = "lblModName";
            this.lblModName.Size = new System.Drawing.Size(60, 18);
            this.lblModName.TabIndex = 0;
            this.lblModName.Text = "Mod_Dev";
            // 
            // lblModDev
            // 
            this.lblModDev.AutoSize = true;
            this.lblModDev.Font = new System.Drawing.Font("Bahnschrift", 14.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.lblModDev.ForeColor = System.Drawing.Color.Gainsboro;
            this.lblModDev.Location = new System.Drawing.Point(70, 44);
            this.lblModDev.Name = "lblModDev";
            this.lblModDev.Size = new System.Drawing.Size(102, 23);
            this.lblModDev.TabIndex = 1;
            this.lblModDev.Text = "Mod_Name";
            // 
            // pbCover
            // 
            this.pbCover.Location = new System.Drawing.Point(3, 3);
            this.pbCover.Name = "pbCover";
            this.pbCover.Size = new System.Drawing.Size(196, 212);
            this.pbCover.TabIndex = 0;
            this.pbCover.TabStop = false;
            // 
            // uc_mod_store_item
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.Controls.Add(this.panel1);
            this.Controls.Add(this.pbData);
            this.Cursor = System.Windows.Forms.Cursors.Hand;
            this.Name = "uc_mod_store_item";
            this.Size = new System.Drawing.Size(202, 287);
            this.pbData.ResumeLayout(false);
            this.pbData.PerformLayout();
            this.panel1.ResumeLayout(false);
            ((System.ComponentModel.ISupportInitialize)(this.pbCover)).EndInit();
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.Panel pbData;
        private System.Windows.Forms.Panel panel1;
        private System.Windows.Forms.Label lblModName;
        private System.Windows.Forms.Label lblModDev;
        private System.Windows.Forms.PictureBox pbCover;
    }
}
