using System.Collections.ObjectModel;

namespace HL7Helper.ViewModels
{
    public class SegmentViewModel : ViewModelBase
    {
        private string _segmentName = string.Empty;
        public string SegmentName
        {
            get => _segmentName;
            set => SetProperty(ref _segmentName, value);
        }

        public ObservableCollection<FieldViewModel> Fields { get; } = new ObservableCollection<FieldViewModel>();

        // Konstruktor hinzugefügt, um den Namen zu initialisieren
        public SegmentViewModel(string segmentName)
        {
            SegmentName = segmentName;
        }
    }
}