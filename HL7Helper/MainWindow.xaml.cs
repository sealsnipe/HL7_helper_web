using System;
using System.Windows;
using Microsoft.Win32;
using System.Windows;
// using System.Collections.ObjectModel; // Nicht mehr direkt hier benötigt
// using Microsoft.Win32; // Nicht mehr direkt hier benötigt
// using System.IO; // Nicht mehr direkt hier benötigt
// using NHapi.Base.Model; // Nicht mehr direkt hier benötigt
// using HL7Helper; // Nicht mehr direkt hier benötigt
using HL7Helper.ViewModels; // ViewModel Namespace
using System.Globalization;
using System.Windows.Data;

namespace MARIS_HL7_Helper
{
    public partial class MainWindow : Window
    {
        // ViewModel Instanz
        public MainViewModel ViewModel { get; }

        public MainWindow()
        {
            InitializeComponent();
            ViewModel = new MainViewModel(); // ViewModel erstellen
            this.DataContext = ViewModel; // DataContext auf das ViewModel setzen
            // OpenFileButton.Click wird jetzt über Command Binding im XAML gehandhabt
        }

        // Der OpenFileButton_Click Handler wird nicht mehr benötigt,
        // da die Logik im OpenFileCommand des ViewModels liegt.
        // private void OpenFileButton_Click(object sender, RoutedEventArgs e) { ... }
    }


    // Ref: HL7H-28 Converter für die Sichtbarkeit von Elementen basierend auf Null oder Leerstring
    public class NullOrEmptyToVisibilityConverter : IValueConverter
    {
        public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
        {
            // Sichtbar, wenn der String nicht null oder leer ist
            return string.IsNullOrEmpty(value as string) ? Visibility.Collapsed : Visibility.Visible;
        }

        public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        {
            // Wird nicht benötigt
            throw new NotImplementedException();
        }
    }

    // Ref: HL7H-26 (Moved inside namespace)
    public class BooleanToInverseBooleanConverter : IValueConverter
    {
        public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
        {
            if (value is bool boolValue)
            {
                return !boolValue;
            }
            return true; // Default to ReadOnly if value is not bool
        }

        public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        {
            if (value is bool boolValue)
            {
                return !boolValue;
            }
            return false; // Default
        }
    }
} // End of namespace MARIS_HL7_Helper
