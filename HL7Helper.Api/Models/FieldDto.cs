namespace HL7Helper.Api.Models
{
    public class FieldDto
    {
        public int Position { get; set; }
        public string Value { get; set; } = string.Empty;
        public bool IsEditable { get; set; } = true;
        public List<ComponentDto> Components { get; set; } = new List<ComponentDto>();

        public FieldDto() { }

        public FieldDto(int position, string value, bool isEditable = true)
        {
            Position = position;
            Value = value;
            IsEditable = isEditable;
        }
    }
}
