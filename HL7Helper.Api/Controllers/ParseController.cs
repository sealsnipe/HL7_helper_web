using Microsoft.AspNetCore.Mvc;
using HL7Helper.Api.Services;
using HL7Helper.Api.Models;
using System.Text;
using System.IO;
using System.Threading.Tasks;

namespace HL7Helper.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ParseController : ControllerBase
    {
        private readonly Hl7ParsingService _parsingService;

        public ParseController(Hl7ParsingService parsingService)
        {
            _parsingService = parsingService;
        }

        [HttpPost]
        public async Task<IActionResult> Parse()
        {
            using (var reader = new StreamReader(Request.Body, Encoding.UTF8))
            {
                var hl7Content = await reader.ReadToEndAsync();
                
                if (string.IsNullOrWhiteSpace(hl7Content))
                {
                    return BadRequest("Empty HL7 message.");
                }

                var message = _parsingService.ParseMessage(hl7Content);
                if (message == null)
                {
                    return BadRequest("Failed to parse HL7 message.");
                }

                // Note: Template support can be added here by passing a template to MapMessageToDtos
                var dtos = _parsingService.MapMessageToDtos(message);
                return Ok(dtos);
            }
        }
    }
}
