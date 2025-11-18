using Microsoft.AspNetCore.Mvc;
using HL7Helper.Api.Services;
using HL7Helper.Api.Models;
using System.Collections.Generic;
using System.IO;

namespace HL7Helper.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TemplateController : ControllerBase
    {
        private readonly TemplateService _templateService;
        private const string TemplateDirectory = "templates";

        public TemplateController(TemplateService templateService)
        {
            _templateService = templateService;
            // Ensure directory exists
            if (!Directory.Exists(TemplateDirectory))
            {
                Directory.CreateDirectory(TemplateDirectory);
            }
        }

        [HttpGet]
        public ActionResult<List<Hl7Template>> GetTemplates()
        {
            var templates = _templateService.LoadTemplatesFromDirectory(TemplateDirectory);
            return Ok(templates);
        }

        [HttpPost]
        public IActionResult SaveTemplate([FromBody] Hl7Template template)
        {
            if (template == null || string.IsNullOrWhiteSpace(template.Name))
            {
                return BadRequest("Invalid template.");
            }

            string fileName = $"{template.Name}.hl7t.json";
            // Sanitize filename
            foreach (char c in Path.GetInvalidFileNameChars())
            {
                fileName = fileName.Replace(c, '_');
            }

            string filePath = Path.Combine(TemplateDirectory, fileName);
            _templateService.SaveTemplate(template, filePath);

            return Ok(new { message = "Template saved successfully." });
        }
    }
}
