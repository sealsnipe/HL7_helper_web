namespace HL7Helper
{
    public class EditableField
    {
        public string? Path { get; set; } // Fix: CS8618 - Made nullable
        public string? Description { get; set; } // Fix: CS8618 - Made nullable
    }
}