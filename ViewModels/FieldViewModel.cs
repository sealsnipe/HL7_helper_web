namespace HL7Helper.ViewModels
{
    public class FieldViewModel : ViewModelBase
    {
        public string Value { get; set; }

        public FieldViewModel(string value)
        {
            Value = value;
        }
    }
}