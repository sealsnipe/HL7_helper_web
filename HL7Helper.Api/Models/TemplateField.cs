namespace HL7Helper.Api.Models
{
    public class TemplateField
    {
        public int Position { get; set; }
        public bool IsEditable { get; set; }
        public bool IsRequired { get; set; }
        public string? DefaultValue { get; set; }

        public TemplateField() { }
        public TemplateField(int position, bool isEditable, bool isRequired, string? defaultValue)
        {
            Position = position;
            IsEditable = isEditable;
            IsRequired = isRequired;
            DefaultValue = defaultValue;
        }
    }
}
