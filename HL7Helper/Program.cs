using NHapi.Base.Parser;
using NHapi.Model.V23.Message;
using NHapi.Base;
using System.Windows;
// using MARIS_HL7_Helper; // Removed as Program is now in the same namespace

namespace MARIS_HL7_Helper // Changed namespace to match MainWindow
{
    class Program
    {
        [STAThread] // Required for WPF applications
        public static void Main(string[] args)
        {
            // Fix: CS0246 - Start MainWindow directly without App class
            var mainWindow = new MainWindow(); // Assuming MainWindow exists in the MARIS.HL7Helper namespace or is imported
            var application = new Application();
            application.Run(mainWindow);
        }
        // Ref: HL7H-38 // Moved reference comment here
    }
}
// Ref: HL7H-38
