using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using HL7Helper.Api.Models;

namespace HL7Helper.Api.Services
{
    public class TemplateService
    {
        public Hl7Template? LoadTemplate(string filePath)
        {
            try
            {
                var jsonString = File.ReadAllText(filePath);
                return JsonSerializer.Deserialize<Hl7Template>(jsonString);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading template {filePath}: {ex.Message}");
                return null;
            }
        }

        public void SaveTemplate(Hl7Template template, string filePath)
        {
            try
            {
                var options = new JsonSerializerOptions { WriteIndented = true };
                var jsonString = JsonSerializer.Serialize(template, options);
                File.WriteAllText(filePath, jsonString);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error saving template {filePath}: {ex.Message}");
            }
        }

        public List<Hl7Template> LoadTemplatesFromDirectory(string directoryPath)
        {
            var templates = new List<Hl7Template>();
            try
            {
                string searchPattern = "*.hl7t.json";
                var templateFiles = Directory.GetFiles(directoryPath, searchPattern);

                foreach (var filePath in templateFiles)
                {
                    var template = LoadTemplate(filePath);
                    if (template != null)
                    {
                        templates.Add(template);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading templates from {directoryPath}: {ex.Message}");
            }

            return templates;
        }
    }
}
