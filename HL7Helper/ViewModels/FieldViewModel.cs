namespace HL7Helper.ViewModels
{
    public class FieldViewModel : ViewModelBase
    {
        private int _position;
        public int Position
        {
            get => _position;
            set => SetProperty(ref _position, value);
        }

        private string _value = string.Empty;
        public string Value
        {
            get => _value;
            // Ref: HL7H-18

            set => SetProperty(ref _value, value);
        }


        // Ref: HL7H-25
        private bool _isEditable = true;
        public bool IsEditable
        {
            get => _isEditable;
            set => SetProperty(ref _isEditable, value);
        }

        // Ref: HL7H-16
        // Konstruktor aktualisiert, um Position und Wert zu initialisieren
        public FieldViewModel(int position, string value)
        {
            Position = position;
            Value = value;
        }
    }
}