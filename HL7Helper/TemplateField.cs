namespace MARIS.HL7Helper
{
    // Ref: HL7H-21
    public class TemplateField
    {
        public int Position { get; set; }
        public bool IsEditable { get; set; }
        public bool IsRequired { get; set; }
        public string? DefaultValue { get; set; }

        public TemplateField(int position, bool isEditable, bool isRequired, string? defaultValue = null)
        {
            Position = position;
            IsEditable = isEditable;
            IsRequired = isRequired;
            DefaultValue = defaultValue;
        }
    }
}