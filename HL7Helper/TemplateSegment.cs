using System.Collections.Generic;

namespace MARIS.HL7Helper
{
    // Ref: HL7H-21
    public class TemplateSegment
    {
        public string Name { get; set; }
        public List<TemplateField> Fields { get; set; }

        public TemplateSegment(string name)
        {
            Name = name;
            Fields = new List<TemplateField>();
        }
    }
}