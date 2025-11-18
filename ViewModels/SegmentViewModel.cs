using System.Collections.ObjectModel;

namespace HL7Helper.ViewModels
{
    public class SegmentViewModel : ViewModelBase
    {
        public string SegmentName { get; set; }
        public ObservableCollection<FieldViewModel> Fields { get; set; } = new ObservableCollection<FieldViewModel>();

        public SegmentViewModel(string segmentName)
        {
            SegmentName = segmentName;
        }
    }
}