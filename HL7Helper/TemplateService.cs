using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;

namespace MARIS.HL7Helper
{
    // Ref: HL7H-23
    public class TemplateService
    {
        /// <summary>
        /// Lädt ein einzelnes HL7-Template aus der angegebenen Datei.
        /// </summary>
        /// <param name="filePath">Der vollständige Pfad zur Template-Datei.</param>
        /// <returns>Das geladene Hl7Template-Objekt oder null bei einem Fehler.</returns> // Fix: CS8603 - Updated return description
        /// <remarks>Die Implementierung erfolgt in HL7H-22.</remarks>
        public Hl7Template? LoadTemplate(string filePath) // Fix: CS8603 - Changed return type to nullable
        {
            // Ref: HL7H-22
            try
            {
                var jsonString = File.ReadAllText(filePath);
                return JsonSerializer.Deserialize<Hl7Template>(jsonString);
            }
            catch (FileNotFoundException)
            {
                // Log oder spezifische Fehlerbehandlung hier, falls nötig
                Console.WriteLine($"Fehler: Template-Datei nicht gefunden: {filePath}");
                return null;
            }
            catch (JsonException ex)
            {
                // Log oder spezifische Fehlerbehandlung hier, falls nötig
                Console.WriteLine($"Fehler beim Deserialisieren der Template-Datei {filePath}: {ex.Message}");
                return null;
            }
            catch (Exception ex) // Fängt andere mögliche IO- oder Lesefehler ab
            {
                Console.WriteLine($"Unerwarteter Fehler beim Laden der Template-Datei {filePath}: {ex.Message}");
                return null;
            }
        }

        /// <summary>
        /// Speichert ein HL7-Template in der angegebenen Datei.
        /// </summary>
        /// <param name="template">Das zu speichernde Hl7Template-Objekt.</param>
        /// <param name="filePath">Der vollständige Pfad zur Zieldatei.</param>
        /// <remarks>Die Implementierung erfolgt in HL7H-22.</remarks>
        public void SaveTemplate(Hl7Template template, string filePath)
        {
            // Ref: HL7H-22
            try
            {
                var options = new JsonSerializerOptions { WriteIndented = true };
                var jsonString = JsonSerializer.Serialize(template, options);
                File.WriteAllText(filePath, jsonString);
            }
            catch (IOException ex)
            {
                // Log oder spezifische Fehlerbehandlung hier, falls nötig
                Console.WriteLine($"Fehler beim Speichern der Template-Datei {filePath}: {ex.Message}");
                // Optional: Exception weiter werfen oder anders behandeln
            }
            catch (Exception ex) // Fängt andere mögliche Fehler ab (z.B. SecurityException)
            {
                Console.WriteLine($"Unerwarteter Fehler beim Speichern der Template-Datei {filePath}: {ex.Message}");
            }
        }

        /// <summary>
        /// Lädt alle HL7-Templates aus dem angegebenen Verzeichnis.
        /// </summary>
        /// <param name="directoryPath">Der Pfad zum Verzeichnis, das die Template-Dateien enthält.</param>
        /// <returns>Eine Liste der geladenen Hl7Template-Objekte.</returns>
        /// <remarks>Die Implementierung erfolgt in HL7H-22.</remarks>
        public List<Hl7Template> LoadTemplatesFromDirectory(string directoryPath)
        {
            // Ref: HL7H-22
            var templates = new List<Hl7Template>();
            try
            {
                // Definiere das Suchmuster für Template-Dateien
                string searchPattern = "*.hl7t.json"; // Oder ein anderes konfigurierbares Muster

                var templateFiles = Directory.GetFiles(directoryPath, searchPattern);

                foreach (var filePath in templateFiles)
                {
                    try
                    {
                        var template = LoadTemplate(filePath);
                        if (template != null)
                        {
                            templates.Add(template);
                        }
                        // Optional: Logge eine Warnung, wenn eine Datei nicht geladen werden konnte
                        // else { Console.WriteLine($"Warnung: Konnte Template nicht laden: {filePath}"); }
                    }
                    catch (Exception ex) // Fängt Fehler beim Laden einzelner Dateien ab
                    {
                        // Logge den Fehler für die spezifische Datei, aber fahre mit den anderen fort
                        Console.WriteLine($"Fehler beim Verarbeiten der Datei {filePath}: {ex.Message}");
                    }
                }
            }
            catch (DirectoryNotFoundException)
            {
                Console.WriteLine($"Fehler: Verzeichnis nicht gefunden: {directoryPath}");
                // Gib eine leere Liste zurück oder wirf eine Exception, je nach Anforderung
            }
            catch (Exception ex) // Fängt andere mögliche Fehler ab (z.B. SecurityException)
            {
                Console.WriteLine($"Unerwarteter Fehler beim Laden von Templates aus Verzeichnis {directoryPath}: {ex.Message}");
            }

            return templates;
        }
    }
}