using System.Collections.Generic;

namespace MARIS.HL7Helper
{
    // Ref: HL7H-21
    public class Hl7Template
    {
        public string Name { get; set; }
        public List<TemplateSegment> Segments { get; set; }

        public Hl7Template(string name)
        {
            Name = name;
            Segments = new List<TemplateSegment>();
        }
    }
}