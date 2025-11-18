using System.Collections.Generic;

namespace HL7Helper.Api.Models
{
    public class SegmentDto
    {
        public string Name { get; set; } = string.Empty;
        public List<FieldDto> Fields { get; set; } = new List<FieldDto>();

        public SegmentDto() { }

        public SegmentDto(string name)
        {
            Name = name;
        }
    }
}
