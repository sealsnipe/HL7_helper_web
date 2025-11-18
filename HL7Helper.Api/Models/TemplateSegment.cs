using System.Collections.Generic;

namespace HL7Helper.Api.Models
{
    public class TemplateSegment
    {
        public string Name { get; set; } = string.Empty;
        public List<TemplateField> Fields { get; set; } = new List<TemplateField>();

        public TemplateSegment() { }
        public TemplateSegment(string name) { Name = name; }
    }
}
