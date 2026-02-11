using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace Prisma_Studios_Launcher
{
    public class ConvertImage2D
    {
        public static Image ByteArrayToImage(byte[] ByteArrayIn)
        {
            MemoryStream ms = new MemoryStream(ByteArrayIn);
            return Image.FromStream(ms);
        }

        public static byte[] ImageToByteArray(Image imageIn)
        {
            MemoryStream ms = new MemoryStream();
            imageIn.Save(ms, ImageFormat.Png);
            return ms.ToArray();
        }

        public static Region GetRoundedImage(PictureBox pfp)
        {
            GraphicsPath path = new GraphicsPath();
            path.AddEllipse(0, 0, pfp.Width, pfp.Height);
            Region rgn = new Region(path);
            return rgn;
        }
    }
}


