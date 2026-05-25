using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;
using System;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AgendamentoController : ControllerBase
    {
        // senha 'admin123'
       private readonly string _connectionString = "Server=localhost;Port=3306;Database=agendamento_db;Uid=root;Pwd=;";


        
        public class AgendamentoRequest
        {

    public string NomeCliente { get; set; } = string.Empty;
    public string Servico { get; set; } = string.Empty;
    public string DataAgendamento { get; set; } = string.Empty;
    public string Horario { get; set; } = string.Empty;
}


        [HttpPost]
        public IActionResult CriarAgendamento([FromBody] AgendamentoRequest dados)
        {
            try
            {
                using (var conexao = new MySqlConnection(_connectionString))
                {
                    conexao.Open();

                    // Comando SQL para inserir na tabela
                    string query = "INSERT INTO agendamentos (nome_cliente, servico, data_agendamento, horario) " +
                                   "VALUES (@nome, @servico, @data, @horario);";

                    using (var comando = new MySqlCommand(query, conexao))
                    {
                        //parâmetros 
                        comando.Parameters.AddWithValue("@nome", dados.NomeCliente);
                        comando.Parameters.AddWithValue("@servico", dados.Servico);
                        comando.Parameters.AddWithValue("@data", DateTime.Parse(dados.DataAgendamento).ToString("yyyy-MM-dd"));
                        comando.Parameters.AddWithValue("@horario", dados.Horario);

                        comando.ExecuteNonQuery();
                    }
                }

                return Ok(new { mensagem = "Agendamento realizado com sucesso no banco de dados!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { erro = "Erro ao salvar no banco: " + ex.Message });
            }
        }
    }
}