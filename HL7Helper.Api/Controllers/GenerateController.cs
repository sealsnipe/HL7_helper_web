using Microsoft.AspNetCore.Mvc;
using HL7Helper.Api.Services;
using HL7Helper.Api.Models;
using System.Collections.Generic;
using NHapi.Base.Model;

namespace HL7Helper.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GenerateController : ControllerBase
    {
        private readonly Hl7ParsingService _parsingService;

        public GenerateController(Hl7ParsingService parsingService)
        {
            _parsingService = parsingService;
        }

        [HttpPost]
        public IActionResult Generate([FromBody] GenerateRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.OriginalHl7))
            {
                return BadRequest("Original HL7 message is required.");
            }

            if (request.Segments == null || request.Segments.Count == 0)
            {
                return BadRequest("No segments provided for update.");
            }

            try
            {
                // 1. Parse the original message to get the IMessage object
                var message = _parsingService.ParseMessage(request.OriginalHl7);
                if (message == null)
                {
                    return BadRequest("Failed to parse the original HL7 message.");
                }

                // 2. Update the IMessage object with the new values from the DTOs
                _parsingService.UpdateHl7MessageFromDtos(message, request.Segments);

                // 3. Generate the new HL7 string
                string newHl7 = _parsingService.GenerateHl7String(message);

                return Ok(new { hl7 = newHl7 });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
    
    public class GenerateRequest
    {
        public string OriginalHl7 { get; set; } = string.Empty;
        public List<SegmentDto> Segments { get; set; } = new List<SegmentDto>();
    }
}
