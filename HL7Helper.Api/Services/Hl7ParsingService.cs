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
                                string fieldValue = Terser.Get(hl7Segment, i, 0, 1, 1);
                                var fieldDto = new FieldDto(i, fieldValue ?? string.Empty);

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
    }
}
