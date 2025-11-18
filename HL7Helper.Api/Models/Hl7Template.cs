using System.Collections.Generic;

namespace HL7Helper.Api.Models
{
    public class Hl7Template
    {
        public string Name { get; set; } = string.Empty;
        public List<TemplateSegment> Segments { get; set; } = new List<TemplateSegment>();

        public Hl7Template() { }
        public Hl7Template(string name) { Name = name; }
    }
}
