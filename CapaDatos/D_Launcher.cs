using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
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
                conn.Open();
                SqlCommand cmd = new SqlCommand("SP_GETMODS", conn);
                cmd.CommandType = System.Data.CommandType.StoredProcedure;
                
                cmd.Parameters.AddWithValue("@NAME", name);

                SqlDataReader dr = cmd.ExecuteReader();

                if (dr.Read())
                {
                    mod.Add(new Mod
                    {
                        Mod_ID = dr.GetInt32(0),
                        Mod_Name = dr["Mod_Name"].ToString(),
                        Mod_Desc = dr["Mod_Desc"].ToString(),
                        Mod_Dev = dr["Mod_Dev"].ToString(),
                        Mod_Logo = dr["Mod_Logo"].ToString(),
                        Mod_Dwnlds = dr.GetInt32(5),
                        Mod_Link = dr["Mod_Link"].ToString()
                    });
                }
                dr.Close();
            }
            return mod;
        }

    }
}
