using System;
using System.Windows.Forms;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Linq;
using CapaEntidad;

namespace CapaDatos
{
    public class D_Launcher
    {
        private string _db;

        public D_Launcher()
        {
            _db = ConfigurationManager.ConnectionStrings["conectar"].ConnectionString;
        }

        public List<Mod> getMod(string name)
        {
            List<Mod> mod = new List<Mod>();

            using (SqlConnection conn = new SqlConnection(_db))
            {
                try
                {
                    conn.Open();
                    SqlCommand cmd = new SqlCommand("SP_GETMODS", conn);
                    cmd.CommandType = System.Data.CommandType.StoredProcedure;

                    cmd.Parameters.AddWithValue("@NAME", name);

                    SqlDataReader dr = cmd.ExecuteReader();

                    while (dr.Read())
                    {
                        mod.Add(new Mod
                        {
                            Mod_ID = dr.GetInt32(0),
                            Mod_Name = dr["Mod_Name"].ToString(),
                            Mod_Desc = dr["Mod_Desc"].ToString(),
                            Mod_Dev = dr["Mod_Dev"].ToString(),
                            Mod_Logo = dr["Mod_Logo"].ToString(),
                            Mod_Dwnlds = dr.GetInt32(5),
                            Mod_Link = dr["Mod_Link"].ToString(),
                            Mod_Picture = (byte[])dr["Mod_Picture"],
                            Mod_Banner = (byte[])dr["Mod_Banner"],
                            Mod_ReleaseYear = dr.GetDateTime(9),
                            Mod_Size = (float)dr.GetDecimal(10)
                        });
                    }
                    dr.Close();
                }
                catch (SqlException ex)
                {
                    if(ex.Number == 40 || ex.Number == 18456) 
                    {
                        MessageBox.Show("There has been an issued connecting to the server.");
                    }
                }
                return mod;
            }
        }

        public UserDevGroup getDev(int ID)
        {
            UserDevGroup dev = null;

            using (SqlConnection conn = new SqlConnection(_db))
            {
                try
                {
                    conn.Open();
                    SqlCommand cmd = new SqlCommand("SP_GETDEV", conn);
                    cmd.CommandType = System.Data.CommandType.StoredProcedure;

                    cmd.Parameters.AddWithValue("@MODID", ID);

                    SqlDataReader dr = cmd.ExecuteReader();

                    while (dr.Read())
                    {
                        dev = new UserDevGroup
                        {
                            userName = dr["userName"].ToString(),
                            userPicture = (byte[])dr["userPicture"],
                            userGroup = dr["userGroup"].ToString(),
                            userRole = dr["userRole"].ToString(),                           
                        };
                    }
                    dr.Close();
                }
                catch (SqlException ex)
                {
                    if (ex.Number == 40 || ex.Number == 18456)
                    {
                        MessageBox.Show("There has been an issued connecting to the server.");
                    }
                }
                return dev;
            }
        }

        public Mod givePicture(Byte[] image, int ID) 
        {
            using (SqlConnection conn = new SqlConnection(_db))
            {
                conn.Open();
                SqlCommand cmd = new SqlCommand("SP_GIVPIC", conn);
                cmd.CommandType = System.Data.CommandType.StoredProcedure;

                cmd.Parameters.AddWithValue("@ID", ID);
                cmd.Parameters.AddWithValue("@PICTURE", image);

                cmd.ExecuteNonQuery();
            }

            return null;
        }

        public User givePFP(Byte[] image, int ID)
        {
            using (SqlConnection conn = new SqlConnection(_db))
            {
                conn.Open();
                SqlCommand cmd = new SqlCommand("SP_GIVPFP", conn);
                cmd.CommandType = System.Data.CommandType.StoredProcedure;

                cmd.Parameters.AddWithValue("@ID", ID);
                cmd.Parameters.AddWithValue("@PICTURE", image);

                cmd.ExecuteNonQuery();
            }

            return null;
        }

        public Mod updateDesc(int ID, string content)
        {
            using (SqlConnection conn = new SqlConnection(_db))
            {
                try
                {
                    conn.Open();
                    SqlCommand cmd = new SqlCommand("SP_UPDATEDESC", conn);
                    cmd.CommandType = System.Data.CommandType.StoredProcedure;

                    cmd.Parameters.AddWithValue("@ID", ID);
                    cmd.Parameters.AddWithValue("@CONTENT", content);

                    cmd.ExecuteNonQuery();
                }
                catch (SqlException ex)
                {
                    if (ex.Number == 40 || ex.Number == 18456)
                    {
                        MessageBox.Show("There has been an issued connecting to the server.");
                    }
                }
            }
            return null;
        }

        public Mod giveBanner(Byte[] image, int ID)
        {
            using (SqlConnection conn = new SqlConnection(_db))
            {
                conn.Open();
                SqlCommand cmd = new SqlCommand("SP_GIVBANN", conn);
                cmd.CommandType = System.Data.CommandType.StoredProcedure;

                cmd.Parameters.AddWithValue("@ID", ID);
                cmd.Parameters.AddWithValue("@BANNER", image);

                cmd.ExecuteNonQuery();
            }

            return null;
        }
    }
}
