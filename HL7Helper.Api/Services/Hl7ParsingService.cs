using NHapi.Base.Model;
using NHapi.Base.Parser;
using NHapi.Base.Util;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using HL7Helper.Api.Models;

namespace HL7Helper.Api.Services
{
    public class Hl7ParsingService
    {
        private void LogDebug(string message)
        {
            try
            {
                System.IO.File.AppendAllText(@"d:\Projects\HL7_Helper_web\debug_log.txt", $"{DateTime.Now}: {message}\n");
            }
            catch { }
        }

        public IMessage? ParseMessage(byte[] hl7MessageBytes)
        {
            try
            {
                int headerLength = Math.Min(4096, hl7MessageBytes.Length);
                string headerAscii = Encoding.ASCII.GetString(hl7MessageBytes, 0, headerLength);
                string mshLine = headerAscii.Split('\r').FirstOrDefault() ?? string.Empty;
                string[] fields = mshLine.Split('|');

                string? charsetField = fields.Length > 18 ? fields[18] : null;

                Encoding encoding;
                if (!string.IsNullOrWhiteSpace(charsetField))
                {
                    try
                    {
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

                string hl7Message = encoding.GetString(hl7MessageBytes);

                PipeParser parser = new PipeParser
                {
                    ValidationContext = null
                };
                return parser.Parse(hl7Message);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error parsing HL7 message: " + ex.Message);
                return null;
            }
        }

        public IMessage? ParseMessage(string hl7Message)
        {
            try
            {
                Console.WriteLine($"Attempting to parse HL7 message of length: {hl7Message?.Length}");
                PipeParser parser = new PipeParser();
                // parser.ValidationContext = null; // Removing this as it might cause issues
                return parser.Parse(hl7Message);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error parsing HL7 message: " + ex.Message);
                Console.WriteLine("Stack Trace: " + ex.StackTrace);
                return null;
            }
        }

        public List<SegmentDto> MapMessageToDtos(IMessage message, Hl7Template? template = null)
        {
            var segmentDtos = new List<SegmentDto>();

            if (message == null)
                return segmentDtos;

            if (message is IGroup group)
            {
                ProcessGroup(group, segmentDtos, template);
            }
            else
            {
                Console.WriteLine("Error: Provided message object is not an IGroup.");
            }

            return segmentDtos;
        }

        private void ProcessGroup(IGroup group, List<SegmentDto> segmentDtos, Hl7Template? template)
        {
            foreach (string structureName in group.Names)
            {
                var structures = group.GetAll(structureName);
                foreach (IStructure structure in structures)
                {
                    if (structure is ISegment hl7Segment)
                    {
                        var segmentDto = new SegmentDto(hl7Segment.GetStructureName());
                        for (int i = 1; i <= hl7Segment.NumFields(); i++)
                        {
                            try
                            {
                                var fieldReps = hl7Segment.GetField(i);
                                var field = fieldReps.Length > 0 ? fieldReps[0] : null;
                                
                                // Get the main value (first component/primitive) using PipeParser encoding or Terser
                                // Using Terser for consistency with previous implementation for the main value, 
                                // but we might want the raw value of the whole field?
                                // The previous implementation used: string fieldValue = Terser.Get(hl7Segment, i, 0, 1, 1);
                                // This returns the first component. 
                                // If we want the full field value (e.g. "A^B^C"), we should use Encode.
                                
                                string fieldValue = string.Empty;
                                if (field != null)
                                {
                                    // Encode the full field value to preserve separators for the main display if needed
                                    // Or keep using Terser.Get(..., 1, 1) if we only want the first component as the "Value".
                                    // The user said "in PV1.3.1 I_HPRS_NOTAMB... but in our web interface it is field 3 and in field 3 is also only I_HPRS_NOTAMB".
                                    // This implies they might expect the full string "I_HPRS_NOTAMB^^^..." in the main value, OR just the breakdown.
                                    // Let's keep the main Value as the first component for backward compatibility/simplicity, 
                                    // OR better: let's make the main Value the FULL raw string of the field, so it's editable as a whole?
                                    // The current frontend shows individual input boxes.
                                    // Let's stick to: Value = First Component (or Primitive), and populate Components list.
                                    
                                    // Actually, if I change Value to be the full string, it might break the UI if it expects a single value.
                                    // But the UI is "FieldInput".
                                    // Let's keep Value as the first component for now, but populate components.
                                    
                                    fieldValue = Terser.Get(hl7Segment, i, 0, 1, 1);
                                }

                                var fieldDto = new FieldDto(i, fieldValue ?? string.Empty);

                                if (field is IComposite composite)
                                {
                                    LogDebug($"Field {i} in {hl7Segment.GetStructureName()} is Composite. Components: {composite.Components.Length}");
                                    for (int j = 0; j < composite.Components.Length; j++)
                                    {
                                        var component = composite.Components[j];
                                        var componentValue = ExtractValue(component);
                                        // LogDebug($"  Component {j+1}: {componentValue}");
                                        var componentDto = new ComponentDto(j + 1, componentValue);

                                        if (component is IComposite subComposite)
                                        {
                                            for (int k = 0; k < subComposite.Components.Length; k++)
                                            {
                                                var subComponent = subComposite.Components[k];
                                                var subComponentValue = ExtractValue(subComponent);
                                                componentDto.SubComponents.Add(new ComponentDto(k + 1, subComponentValue));
                                            }
                                        }
                                        fieldDto.Components.Add(componentDto);
                                    }
                                }
                                else 
                                {
                                    if (field != null) 
                                        LogDebug($"Field {i} in {hl7Segment.GetStructureName()} is {field.GetType().Name}");
                                }

                                if (template != null)
                                {
                                    var templateSegment = template.Segments.FirstOrDefault(ts => ts.Name == hl7Segment.GetStructureName());
                                    if (templateSegment != null)
                                    {
                                        var templateField = templateSegment.Fields.FirstOrDefault(tf => tf.Position == i);
                                        if (templateField != null)
                                        {
                                            fieldDto.IsEditable = templateField.IsEditable;
                                        }
                                    }
                                }
                                segmentDto.Fields.Add(fieldDto);
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"Error accessing field {i} in segment {hl7Segment.GetStructureName()}: {ex.Message}");
                                segmentDto.Fields.Add(new FieldDto(i, $"<Error: {ex.Message}>"));
                            }
                        }
                        segmentDtos.Add(segmentDto);
                    }
                    else if (structure is IGroup subGroup)
                    {
                        ProcessGroup(subGroup, segmentDtos, template);
                    }
                }
            }
        }

        public void UpdateHl7MessageFromDtos(IMessage message, IEnumerable<SegmentDto> segmentDtos)
        {
            if (message == null || segmentDtos == null)
            {
                return;
            }

            var terser = new Terser(message);

            foreach (var segmentDto in segmentDtos)
            {
                foreach (var fieldDto in segmentDto.Fields)
                {
                    try
                    {
                        string segmentPath = $"{segmentDto.Name}-{fieldDto.Position}";
                        terser.Set(segmentPath, fieldDto.Value);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error updating field {segmentDto.Name}-{fieldDto.Position}: {ex.Message}");
                    }
                }
            }
        }

        public string GenerateHl7String(IMessage message)
        {
            if (message == null)
            {
                return string.Empty;
            }

            try
            {
                PipeParser parser = new PipeParser();
                return parser.Encode(message);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error generating HL7 string: {ex.Message}");
                return $"Error generating HL7 string: {ex.Message}";
            }
        }
        private string ExtractValue(IType type)
        {
            if (type is IPrimitive primitive)
            {
                return primitive.Value ?? string.Empty;
            }
            else if (type is IComposite composite)
            {
                // For a composite, we might want the first component as the "value" if it's being treated as a single unit in some contexts,
                // or we might want to encode it.
                // For now, let's try to get the first component's value recursively or just empty if it's complex?
                // Actually, NHapi's PipeParser.Encode(type) would give us the full string with separators.
                // But here we are extracting individual component values.
                // If a component is itself a composite (subcomponents), its "Value" is ambiguous.
                // Let's return the first component of the composite as the value, similar to how Terser works.
                if (composite.Components.Length > 0)
                {
                    return ExtractValue(composite.Components[0]);
                }
            }
            else if (type is Varies varies)
            {
                return ExtractValue(varies.Data);
            }
            return string.Empty;
        }
    }
}
