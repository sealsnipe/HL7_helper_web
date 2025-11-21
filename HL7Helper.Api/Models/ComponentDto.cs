using System.Collections.Generic;

namespace HL7Helper.Api.Models
{
    public class ComponentDto
    {
        public int Position { get; set; }
        public string Value { get; set; } = string.Empty;
        public List<ComponentDto> SubComponents { get; set; } = new List<ComponentDto>();

        public ComponentDto() { }

        public ComponentDto(int position, string value)
        {
            Position = position;
            Value = value;
        }
    }
}
