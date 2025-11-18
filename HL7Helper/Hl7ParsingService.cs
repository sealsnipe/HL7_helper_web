using NHapi.Base.Model;
using NHapi.Base.Parser;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using HL7Helper.ViewModels;
using NHapi.Base.Util;
using NHapi.Base.Validation;
using MARIS.HL7Helper; // Corrected namespace for Hl7Template


namespace HL7Helper
{
    public class Hl7ParsingService
    {
        /// <summary>
        /// Liest die rohen HL7-Bytes ein, extrahiert MSH-18 (Character Set) und dekodiert die Nachricht entsprechend.
        /// </summary>
        public IMessage? ParseMessage(byte[] hl7MessageBytes) // Fix: CS8603 - Changed return type to nullable
        {
            try
            {
                // Als ASCII dekodieren, um die Header-Zeile und MSH-18 zu lesen
                int headerLength = Math.Min(4096, hl7MessageBytes.Length);
                string headerAscii = Encoding.ASCII.GetString(hl7MessageBytes, 0, headerLength);
                string mshLine = headerAscii.Split('\r').FirstOrDefault() ?? string.Empty;
                string[] fields = mshLine.Split('|');

                // Feld 18 (1-basiert) ist der Zeichensatz
                string? charsetField = fields.Length > 18 ? fields[18] : null; // Fix: CS8600 - Changed type to nullable string

                Encoding encoding;
                if (!string.IsNullOrWhiteSpace(charsetField))
                {
                    try
                    {
                        // HL7 kann "8859_1" o.Ä. nutzen; entferne Bindestriche
                        string normalized = charsetField.Replace("-", "").Trim();
                        encoding = Encoding.GetEncoding(normalized);
                    }
                    catch
                    {
                        encoding = Encoding.Default;
                    }
                }
                else
                {
                    encoding = Encoding.Default;
                }

                // Vollständig dekodieren
                string hl7Message = encoding.GetString(hl7MessageBytes);

                // Parser aufrufen
                PipeParser parser = new PipeParser
                {
                    ValidationContext = null // Validierung optional
                };
                return parser.Parse(hl7Message);
            }
            catch (Exception ex) when (ex is NHapi.Base.HL7Exception || ex is DecoderFallbackException)
            {
                Console.WriteLine("Error parsing HL7 message: " + ex.Message);
                return null;
            }
        }

        /// <summary>
        /// Beibehalten für Fälle, in denen bereits ein String vorliegt.
        /// </summary>
        // Ref: HL7H-10 - Nimmt eine HL7-Nachricht als String entgegen.
        public IMessage? ParseMessage(string hl7Message) // Fix: CS8603 - Changed return type to nullable
        {
            try
            {
                // Ref: HL7H-15 - Verwendet NHapi PipeParser zum Parsen des Strings.
                PipeParser parser = new PipeParser
                {
                    ValidationContext = null // Validierung kann hier bei Bedarf konfiguriert werden.
                };
                return parser.Parse(hl7Message); // Gibt das IMessage-Objekt zurück.
            }
            catch (NHapi.Base.HL7Exception ex)
            {
                Console.WriteLine("Error parsing HL7 message: " + ex.Message);
                return null;
            }
        }

        // Ref: HL7H-16 - Maps an IMessage object to a collection of SegmentViewModels, preserving order.
        // Ref: HL7H-25 Template Mapping - Signatur geändert
        public System.Collections.ObjectModel.ObservableCollection<SegmentViewModel> MapMessageToViewModels(IMessage message, Hl7Template? template = null)
        {
            var segmentViewModels = new System.Collections.ObjectModel.ObservableCollection<SegmentViewModel>();

            if (message == null)
                return segmentViewModels;

            // Die Nachricht selbst ist eine Gruppe (IGroup). Starte die rekursive Verarbeitung.
            if (message is IGroup group) // Sicherstellen, dass die Nachricht eine Gruppe ist
            {
                // Ref: HL7H-25 Template Mapping - Template übergeben
                ProcessGroup(group, segmentViewModels, template);
            }
            else
            {
                // Fallback oder Fehlerbehandlung, falls die Nachricht keine Gruppe ist (unwahrscheinlich für Standard-HL7)
                Console.WriteLine("Error: Provided message object is not an IGroup.");
            }


            return segmentViewModels;
        }

        // Ref: HL7H-16 - Recursive helper method to process HL7 groups and segments.
        // Ref: HL7H-25 Template Mapping - Signatur geändert
        private void ProcessGroup(IGroup group, System.Collections.ObjectModel.ObservableCollection<SegmentViewModel> segmentViewModels, Hl7Template? template)
        {
            // Iteriere durch alle Strukturelemente in der Gruppe in ihrer Reihenfolge
            foreach (string structureName in group.Names)
            {
                var structures = group.GetAll(structureName);
                foreach (IStructure structure in structures)
                {
                    if (structure is ISegment hl7Segment)
                    {
                        // Verarbeite das Segment
                        var segmentViewModel = new SegmentViewModel(hl7Segment.GetStructureName());
                        for (int i = 1; i <= hl7Segment.NumFields(); i++) // Felder sind 1-basiert
                        {
                            try
                            {
                                // Hole den Wert des Feldes.
                                // Verwende Terser.Get für robusten Zugriff, auch wenn das Feld nicht existiert.
                                string fieldValue = Terser.Get(hl7Segment, i, 0, 1, 1); // Einfacher Wert des Feldes

                                // Füge FieldViewModel mit Position und Wert hinzu
                                var fieldViewModel = new FieldViewModel(i, fieldValue ?? string.Empty);

                                // Ref: HL7H-25 Template Mapping - IsEditable basierend auf Template setzen
                                if (template != null)
                                {
                                    var templateSegment = template.Segments.FirstOrDefault(ts => ts.Name == hl7Segment.GetStructureName());
                                    if (templateSegment != null)
                                    {
                                        var templateField = templateSegment.Fields.FirstOrDefault(tf => tf.Position == i);
                                        if (templateField != null)
                                        {
                                            fieldViewModel.IsEditable = templateField.IsEditable;
                                        }
                                    }
                                }
                                segmentViewModel.Fields.Add(fieldViewModel);
                            }
                            catch (NHapi.Base.HL7Exception fieldEx)
                            {
                                // Fehler beim Zugriff auf ein spezifisches Feld
                                Console.WriteLine($"Error accessing field {i} in segment {hl7Segment.GetStructureName()}: {fieldEx.Message}");
                                // Füge ein Fehler-FieldViewModel hinzu
                                segmentViewModel.Fields.Add(new FieldViewModel(i, $"<Error: {fieldEx.Message}>"));
                            }
                            catch (Exception ex) // Fange auch andere mögliche Fehler ab
                            {
                                Console.WriteLine($"Unexpected error accessing field {i} in segment {hl7Segment.GetStructureName()}: {ex.Message}");
                                segmentViewModel.Fields.Add(new FieldViewModel(i, $"<Unexpected Error>"));
                            }
                        }
                        segmentViewModels.Add(segmentViewModel);
                    }
                    else if (structure is IGroup subGroup)
                    {
                        // Wenn es eine Untergruppe ist, rufe die Methode rekursiv auf
                        // Ref: HL7H-25 Template Mapping - Template weitergeben
                        ProcessGroup(subGroup, segmentViewModels, template);
                    }
                }
            }
        }

        // Ref: Update logic for HL7H-18
        public void UpdateHl7MessageFromViewModels(IMessage message, IEnumerable<SegmentViewModel> segmentViewModels)
        {
            if (message == null || segmentViewModels == null)
            {
                return;
            }

            var terser = new Terser(message);

            foreach (var segmentViewModel in segmentViewModels)
            {
                foreach (var fieldViewModel in segmentViewModel.Fields)
                {
                    try
                    {
                        // Erstelle den Terser-Pfad, z.B. "PID-3"
                        string segmentPath = $"{segmentViewModel.SegmentName}-{fieldViewModel.Position}";
                        // Setze den Wert im IMessage-Objekt
                        terser.Set(segmentPath, fieldViewModel.Value);
                    }
                    catch (Exception ex)
                    {
                        // Fehlerbehandlung: Protokollieren oder melden
                        Console.WriteLine($"Error updating field {segmentViewModel.SegmentName}-{fieldViewModel.Position}: {ex.Message}");
                        // Optional: Weiter mit dem nächsten Feld oder Abbruch
                    }
                }
            }
        }

        // Ref: Generation logic for HL7H-18
        public string GenerateHl7String(IMessage message)
        {
            if (message == null)
            {
                return string.Empty;
            }

            try
            {
                // Verwende den PipeParser, um die Nachricht wieder in einen String zu kodieren
                PipeParser parser = new PipeParser();
                string encodedMessage = parser.Encode(message);
                return encodedMessage;
            }
            catch (Exception ex)
            {
                // Fehlerbehandlung
                Console.WriteLine($"Error generating HL7 string: {ex.Message}");
                return $"Error generating HL7 string: {ex.Message}";
            }
        }

    }
}