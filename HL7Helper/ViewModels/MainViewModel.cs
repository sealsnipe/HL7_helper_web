using System;
using System.Collections.ObjectModel;
using System.IO;
using System.Text;
using System.Windows;
using System.Windows.Input; // Enthält CommandManager
using Microsoft.Win32; // Enthält OpenFileDialog
using NHapi.Base.Model;
using NHapi.Model.V25.Message; // Für ADT_A01 etc.
using NHapi.Base.Parser; // Für PipeParser
using NHapi.Base.Util; // Für Terser
using System.Linq;
using MARIS.HL7Helper; // Für TemplateService und Hl7Template
using MARIS.HL7Helper.Validation; // Ref: HL7H-28
using MARIS.HL7Helper.Validation.Rules; // Ref: HL7H-30

namespace HL7Helper.ViewModels
{
    // Einfache ICommand Implementierung (RelayCommand)
    public class RelayCommand : ICommand
    {
        private readonly Action<object?> _execute; // Fix: CS8625 - Allow null parameter
        private readonly Predicate<object?>? _canExecute; // Fix: CS8625 - Allow null predicate and null parameter

        public RelayCommand(Action<object?> execute, Predicate<object?>? canExecute = null) // Fix: CS8625 - Allow null predicate and null parameter
        {
            _execute = execute ?? throw new ArgumentNullException(nameof(execute));
            _canExecute = canExecute;
        }

        public bool CanExecute(object? parameter) => _canExecute == null || _canExecute(parameter); // Fix: CS8625 - Allow null parameter

        public void Execute(object? parameter) => _execute(parameter); // Fix: CS8625 - Allow null parameter

        public event EventHandler? CanExecuteChanged // Fix: CS8625? - EventHandler can be null
        {
            add { CommandManager.RequerySuggested += value; }
            remove { CommandManager.RequerySuggested -= value; }
        }

        public void RaiseCanExecuteChanged()
        {
            CommandManager.InvalidateRequerySuggested();
        }
    }

    public class MainViewModel : ViewModelBase
    {
        private readonly Hl7ParsingService _parsingService;
        private readonly TemplateService _templateService;
        private const string TemplateDirectory = "templates"; // Ref: HL7H-12 Template directory
        private IMessage? _originalMessage; // Fix: CS8618 - Made nullable. Ref: HL7H-18 Store original parsed message
        private readonly ValidationService _validationService = new ValidationService(); // Ref: HL7H-28
        public ObservableCollection<ValidationError> ValidationErrors { get; } = new ObservableCollection<ValidationError>(); // Ref: HL7H-28

        private ObservableCollection<SegmentViewModel> _segments = new ObservableCollection<SegmentViewModel>();
        private string _hl7MessageText; // Initialized in constructor - Fix: CS8618
        private bool _isValid;
        private ObservableCollection<string> _validationMessages = new ObservableCollection<string>();
        private string _validationStatusText; // Initialized in constructor - Fix: CS8618
        // private Hl7Template _currentTemplate; // Ersetzt durch SelectedTemplate und AvailableTemplates für HL7H-12
        private string _validationResult = "Noch keine Validierung durchgeführt."; // Ref: HL7H-11 Initial value

        // Ref: HL7H-12 Start
        public ObservableCollection<Hl7Template> AvailableTemplates { get; } = new ObservableCollection<Hl7Template>();
        private Hl7Template? _selectedTemplate;
        public Hl7Template? SelectedTemplate
        {
            get => _selectedTemplate;
            set => SetProperty(ref _selectedTemplate, value);
            // Hier könnte Logik hinzugefügt werden, um das Template anzuwenden,
            // aber das ist laut Anforderung noch nicht Teil dieser Aufgabe.
        }
        // Ref: HL7H-12 End

        public ObservableCollection<SegmentViewModel> Segments
        {
            get => _segments;
            set => SetProperty(ref _segments, value);
        }

        public string Hl7MessageText
        {
            get => _hl7MessageText;
            set
            {
                if (SetProperty(ref _hl7MessageText, value))
                {
                    // Ref: HL7H-17 - Update CanExecute when text changes
                    ((RelayCommand)ParseMessageCommand)?.RaiseCanExecuteChanged();
                }
            }
        }

        public bool IsValid
        {
            get => _isValid;
            private set => SetProperty(ref _isValid, value);
        }

        public ObservableCollection<string> ValidationMessages
        {
            get => _validationMessages;
            private set => SetProperty(ref _validationMessages, value);
        }

        public string ValidationStatusText
        {
            get => _validationStatusText;
            private set => SetProperty(ref _validationStatusText, value);
        }

        // Ref: HL7H-11 Start - Property for validation result
        public string ValidationResult
        {
            get => _validationResult;
            private set => SetProperty(ref _validationResult, value);
        }
        // Ref: HL7H-11 End

        // Ersetzt durch SelectedTemplate für HL7H-12
        // public Hl7Template CurrentTemplate
        // {
        //     get => _currentTemplate;
        //     set
        //     {
        //         SetProperty(ref _currentTemplate, value);
        //         ((RelayCommand)SaveTemplateToFileCommand).RaiseCanExecuteChanged(); // Angepasst für Umbenennung
        //     }
        // }

        public ICommand OpenFileCommand { get; }
        public ICommand LoadTemplateFromFileCommand { get; } // Umbenannt von LoadTemplateCommand
        public ICommand SaveTemplateToFileCommand { get; } // Umbenannt von SaveTemplateCommand
        public ICommand ParseMessageCommand { get; } // Ref: HL7H-17
        public ICommand UpdateRawMessageCommand { get; } // Ref: HL7H-18 Update Trigger

        // Ref: HL7H-12 Start
        public ICommand LoadTemplatesCommand { get; }
        public ICommand SaveTemplateCommand { get; }
        // Ref: HL7H-12 End
        public ICommand NewMessageFromTemplateCommand { get; } // Ref: HL7H-20

        public MainViewModel()
        {
            _parsingService = new Hl7ParsingService();
            _templateService = new TemplateService();

            // Fix: CS8618 - Initialize non-nullable string fields
            _hl7MessageText = string.Empty;
            _validationStatusText = string.Empty;

            OpenFileCommand = new RelayCommand(OpenFile);
            LoadTemplateFromFileCommand = new RelayCommand(ExecuteLoadTemplateFromFile); // Umbenannt
            SaveTemplateToFileCommand = new RelayCommand(ExecuteSaveTemplateToFile, CanExecuteSaveTemplateToFile); // Umbenannt
            ParseMessageCommand = new RelayCommand(ExecuteParseMessage, CanExecuteParseMessage); // Ref: HL7H-17
            UpdateRawMessageCommand = new RelayCommand(ExecuteUpdateRawMessage, CanExecuteUpdateRawMessage); // Ref: HL7H-18 Update Trigger

            // Ref: HL7H-12 Start
            LoadTemplatesCommand = new RelayCommand(ExecuteLoadTemplates);
            SaveTemplateCommand = new RelayCommand(ExecuteSaveTemplate, CanExecuteSaveTemplate);
            // Ref: HL7H-12 End
            NewMessageFromTemplateCommand = new RelayCommand(ExecuteNewMessageFromTemplate, CanExecuteNewMessageFromTemplate); // Ref: HL7H-20

            UpdateValidationStatus(); // Initialen Status setzen

            // Ref: HL7H-12 Load initial templates
            LoadTemplatesCommand.Execute(null);

            // Ref: HL7H-28 Temporary test rule removed as per HL7H-30
            // _validationService.RegisterRule(new TemporaryTestRule());

            // Ref: HL7H-30 Rule Registration
            _validationService.RegisterRule(new Msh9MessageTypeRule());
            _validationService.RegisterRule(new Pid5PatientNameRule());
            // Ref: HL7H-29 Rule Registration
            _validationService.RegisterRule(new Pid7DateFormatRule());
        }

        // Ref: HL7H-17 - Adjusted OpenFile to use central parsing logic
        private void OpenFile(object? parameter) // Fix: CS8625 - Allow null parameter
        {
            OpenFileDialog openFileDialog = new OpenFileDialog();
            openFileDialog.Filter = "Textdateien (*.txt)|*.txt|HL7-Dateien (*.hl7)|*.hl7|Alle Dateien (*.*)|*.*";
            if (openFileDialog.ShowDialog() == true)
            {
                try
                {
                    // Datei als Byte-Array einlesen, um das Encoding korrekt zu handhaben
                    byte[] fileBytes = File.ReadAllBytes(openFileDialog.FileName);
                    // Versuche, den Text für die TextBox mit einem passenden Encoding zu dekodieren
                    // Hier nehmen wir Default an, aber MSH-18 wäre besser.
                    string fileContent = Encoding.Default.GetString(fileBytes);
                    Hl7MessageText = fileContent; // Text in die TextBox laden (löst CanExecute-Update aus)

                    // Die eigentliche Parsing-Logik wird nun von ParseAndDisplayMessage übernommen.
                    // Wir rufen sie direkt auf, nachdem der Text gesetzt wurde.
                    ParseAndDisplayMessage(Hl7MessageText); // Ruft die zentrale Methode auf
                }
                catch (Exception ex)
                {
                    IsValid = false;
                    Segments.Clear();
                    ValidationMessages.Clear();
                    ValidationMessages.Add($"Fehler beim Öffnen/Lesen der Datei: {ex.Message}");
                    // UpdateValidationStatus wird bereits in ParseAndDisplayMessage aufgerufen, falls Hl7MessageText gesetzt wurde
                    // oder im catch-Block von ParseAndDisplayMessage. Hier nur die MessageBox.
                    MessageBox.Show($"Fehler beim Lesen der Datei: {ex.Message}", "Fehler", MessageBoxButton.OK, MessageBoxImage.Error);
                    Hl7MessageText = string.Empty; // Textbox leeren bei Fehler
                }
                // RaiseCanExecuteChanged ist nicht mehr nötig, da es durch das Setzen von Hl7MessageText ausgelöst wird.
            }
        }

        // Umbenannt von LoadTemplate
        private async void ExecuteLoadTemplateFromFile(object? parameter) // Fix: CS8625 - Allow null parameter
        {
            OpenFileDialog openFileDialog = new OpenFileDialog();
            openFileDialog.Filter = "JSON Template (*.json)|*.json|Alle Dateien (*.*)|*.*";
            if (openFileDialog.ShowDialog() == true)
            {
                try
                {
                    // Korrektur: LoadTemplate ist synchron
                    var loadedTemplate = _templateService.LoadTemplate(openFileDialog.FileName);
                    if (loadedTemplate == null)
                    {
                        MessageBox.Show("Template konnte nicht aus Datei geladen werden. Überprüfen Sie die Datei oder das Debug-Log.", "Fehler beim Laden", MessageBoxButton.OK, MessageBoxImage.Warning);
                    }
                    else
                    {
                        // Füge das geladene Template zur Liste hinzu (oder ersetze ein vorhandenes mit gleichem Namen?)
                        // Fürs Erste fügen wir es einfach hinzu, wenn es noch nicht da ist.
                        var existing = AvailableTemplates.FirstOrDefault(t => t.Name == loadedTemplate.Name);
                        if (existing == null)
                        {
                            AvailableTemplates.Add(loadedTemplate);
                        }
                        SelectedTemplate = loadedTemplate; // Wähle das gerade geladene Template aus
                        System.Diagnostics.Debug.WriteLine($"Template '{loadedTemplate.Name}' aus Datei geladen und ausgewählt.");
                    }
                }
                catch (Exception ex)
                {
                    MessageBox.Show($"Fehler beim Laden des Templates aus Datei: {ex.Message}", "Fehler", MessageBoxButton.OK, MessageBoxImage.Error);
                }
            }
        }

        // Umbenannt von SaveTemplate
        private async void ExecuteSaveTemplateToFile(object? parameter) // Fix: CS8625 - Allow null parameter
        {
            if (SelectedTemplate == null)
            {
                 MessageBox.Show("Kein Template zum Speichern ausgewählt.", "Aktion nicht möglich", MessageBoxButton.OK, MessageBoxImage.Warning);
                 return;
            }

            SaveFileDialog saveFileDialog = new SaveFileDialog();
            saveFileDialog.Filter = "JSON Template (*.json)|*.json";
            string safeName = string.Join("_", SelectedTemplate.Name.Split(Path.GetInvalidFileNameChars()));
            saveFileDialog.FileName = $"{safeName}.hl7t.json"; // Dateiendung angepasst

            if (saveFileDialog.ShowDialog() == true)
            {
                try
                {
                    // Korrektur: SaveTemplate ist synchron
                    _templateService.SaveTemplate(SelectedTemplate, saveFileDialog.FileName);
                    MessageBox.Show($"Template '{SelectedTemplate.Name}' erfolgreich in Datei gespeichert.", "Gespeichert", MessageBoxButton.OK, MessageBoxImage.Information);
                }
                catch (Exception ex)
                {
                    MessageBox.Show($"Fehler beim Speichern des Templates in Datei: {ex.Message}", "Fehler", MessageBoxButton.OK, MessageBoxImage.Error);
                }
            }
        }

        // Umbenannt von CanSaveTemplate
        private bool CanExecuteSaveTemplateToFile(object? parameter) // Fix: CS8625 - Allow null parameter
        {
            // Kann speichern, wenn ein Template ausgewählt ist
            return SelectedTemplate != null;
        }

        private void UpdateValidationStatus()
        {
            if (ValidationMessages.Count > 0)
            {
                ValidationStatusText = $"Status: Ungültig ({ValidationMessages.Count} Fehler)";
            }
            else if (IsValid)
            {
                ValidationStatusText = "Status: Gültig";
            }
            else
            {
                ValidationStatusText = "Status: Unbekannt (Keine Datei geladen oder Parsing fehlgeschlagen)";
            }
        }

        // Ref: HL7H-17 - Central method to parse and display HL7 message from string
        private void ParseAndDisplayMessage(string hl7Text)
        {
            if (string.IsNullOrWhiteSpace(hl7Text))
            {
                Segments.Clear();
                ValidationMessages.Clear();
                ValidationMessages.Add("Keine HL7-Nachricht zum Parsen vorhanden.");
                ValidationResult = "Keine HL7-Nachricht zum Parsen vorhanden."; // Ref: HL7H-11
                IsValid = false;
                _originalMessage = null; // Ref: HL7H-11 Ensure original message is cleared
                UpdateValidationStatus();
                return;
            }

            try
            {
                // Verwende UTF-8 als Standard-Encoding für Text aus der TextBox
                // Die ParseMessage-Methode erwartet Bytes.
                byte[] messageBytes = Encoding.UTF8.GetBytes(hl7Text);

                IMessage parsedMessage = _parsingService.ParseMessage(messageBytes); // Verwende die Methode, die Bytes akzeptiert
                _originalMessage = parsedMessage; // Ref: HL7H-18 Store the parsed message object

                Segments.Clear();
                ValidationMessages.Clear(); // Alte Validierungsmeldungen (falls noch verwendet)
                ValidationErrors.Clear(); // Ref: HL7H-28 - Neue Fehlerliste leeren

                if (parsedMessage != null)
                {
                    IsValid = true; // Syntaktisch valide
                    // Ref: HL7H-25 Template Passing - Template (null hier) übergeben
                    var segmentViewModels = _parsingService.MapMessageToViewModels(parsedMessage, null);
                    foreach (var vm in segmentViewModels)
                    {
                        Segments.Add(vm);
                    }

                    // Ref: HL7H-28 Integration Start
                    List<ValidationError> errors = new List<ValidationError>();
                    if (_originalMessage != null) // Fix: CS8604 - Check for null before calling
                    {
                        errors = _validationService.ValidateMessage(_originalMessage);
                    }
                    else
                    {
                        // Optional: Add a general error if message is null
                        errors.Add(new ValidationError("Keine Nachricht geladen, Validierung nicht möglich.", severity: ValidationSeverity.Information));
                    }

                    foreach (var error in errors)
                    {
                        ValidationErrors.Add(error);
                    }

                    if (errors.Count == 0 || errors.All(e => e.Severity == ValidationSeverity.Information)) // Auch Information als "valide" betrachten
                    {
                        ValidationResult = "Nachricht valide."; // Keine kritischen Validierungsfehler gefunden
                    }
                    else
                    {
                        int errorCount = errors.Count(e => e.Severity != ValidationSeverity.Information); // Nur echte Fehler zählen
                        ValidationResult = $"Validierungsfehler gefunden: {errorCount} Problem(e).";
                        // Optional: IsValid auf false setzen, wenn Validierungsfehler auftreten?
                        // IsValid = false; // Je nach Definition, ob Validierungsfehler die Nachricht "ungültig" machen
                    }
                    // Ref: HL7H-28 Integration End
                }
                else
                {
                    IsValid = false;
                    ValidationMessages.Add("Grundlegendes Parsen der Nachricht fehlgeschlagen.");
                    // ValidationErrors wurde bereits oben geleert.
                    ValidationResult = "Grundlegendes Parsen der Nachricht fehlgeschlagen."; // Update result text
                }
            }
            catch (Exception ex) // Catches NHapi.Base.HL7Exception and others
            {
                // Ref: HL7H-11 Start - Handle parsing errors
                IsValid = false;
                Segments.Clear(); // Ensure UI is cleared
                _originalMessage = null; // Ensure original message object is cleared on error
                ValidationMessages.Clear(); // Alte Meldungen leeren
                ValidationErrors.Clear(); // Ref: HL7H-28 - Neue Fehlerliste auch bei Parsing-Fehler leeren
                string errorMsg = $"Parsing-Fehler: {ex.Message}"; // Klarere Fehlermeldung
                // ValidationMessages.Add(errorMsg); // Nicht mehr primär verwenden
                ValidationResult = errorMsg; // Set the validation result property
                // Optional: MessageBox anzeigen oder Logging verwenden
                // MessageBox.Show($"Fehler beim Parsen der Nachricht: {ex.Message}", "Parsing Fehler", MessageBoxButton.OK, MessageBoxImage.Error);
                System.Diagnostics.Debug.WriteLine($"Fehler beim Parsen der Nachricht: {ex.Message}");
                // Ref: HL7H-11 End
            }
            finally
            {
                UpdateValidationStatus(); // UI-Text aktualisieren
            }
        }

        // Ref: HL7H-17 - Execute method for the ParseMessageCommand
        private void ExecuteParseMessage(object? parameter) // Fix: CS8625 - Allow null parameter
        {
            ParseAndDisplayMessage(Hl7MessageText);
        }

        // Ref: HL7H-17 - CanExecute method for the ParseMessageCommand
        private bool CanExecuteParseMessage(object? parameter) // Fix: CS8625 - Allow null parameter
        {
            // Command ist ausführbar, wenn Text vorhanden ist
            return !string.IsNullOrWhiteSpace(Hl7MessageText);
        }

        // Ref: HL7H-18 Update Trigger
        private void ExecuteUpdateRawMessage(object? parameter) // Fix: CS8625 - Allow null parameter
        {
            if (_originalMessage == null || Segments == null || !Segments.Any())
            {
                MessageBox.Show("Keine Originalnachricht oder keine Segmente zum Aktualisieren vorhanden.", "Aktion nicht möglich", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            try
            {
                // 1. Aktualisiere das IMessage-Objekt mit den Werten aus den ViewModels
                _parsingService.UpdateHl7MessageFromViewModels(_originalMessage, Segments);

                // 2. Generiere den neuen HL7-String aus dem aktualisierten IMessage-Objekt
                string? updatedHl7String = _parsingService.GenerateHl7String(_originalMessage);

                // 3. Aktualisiere die Textbox in der UI
                Hl7MessageText = updatedHl7String ?? string.Empty; // Fix: CS8600 - Handle possible null

                MessageBox.Show("Die Rohnachricht wurde mit den aktuellen Werten aktualisiert.", "Aktualisierung erfolgreich", MessageBoxButton.OK, MessageBoxImage.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Fehler beim Aktualisieren der HL7-Nachricht: {ex.Message}", "Fehler", MessageBoxButton.OK, MessageBoxImage.Error);
                System.Diagnostics.Debug.WriteLine($"Fehler in ExecuteUpdateRawMessage: {ex}");
            }
        }

        // Ref: HL7H-18 Update Trigger - CanExecute Logik
        private bool CanExecuteUpdateRawMessage(object? parameter) // Fix: CS8625 - Allow null parameter
        {
            // Der Command kann ausgeführt werden, wenn eine Originalnachricht vorhanden ist
            // und die Segmentliste nicht leer ist (impliziert, dass etwas geparst wurde).
            return _originalMessage != null && Segments != null && Segments.Any();
        }


        // --- Ref: HL7H-12 Start ---

        private void ExecuteLoadTemplates(object? parameter) // Fix: CS8625 - Allow null parameter
        {
            // Ref: HL7H-12 Load
            try
            {
                // Sicherstellen, dass das Verzeichnis existiert
                Directory.CreateDirectory(TemplateDirectory); // Ignoriert, wenn bereits vorhanden

                var loadedTemplates = _templateService.LoadTemplatesFromDirectory(TemplateDirectory);

                AvailableTemplates.Clear();
                foreach (var template in loadedTemplates)
                {
                    AvailableTemplates.Add(template);
                }

                // Optional: Erstes Template auswählen, falls vorhanden
                SelectedTemplate = AvailableTemplates.FirstOrDefault();

                System.Diagnostics.Debug.WriteLine($"{AvailableTemplates.Count} Templates aus '{TemplateDirectory}' geladen.");
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Fehler beim Laden der Templates aus '{TemplateDirectory}': {ex.Message}", "Fehler", MessageBoxButton.OK, MessageBoxImage.Error);
                System.Diagnostics.Debug.WriteLine($"Fehler in ExecuteLoadTemplates: {ex}");
                // Optional: Liste leeren oder alten Zustand beibehalten? Hier leeren wir sie.
                AvailableTemplates.Clear();
            }
        }

        private async void ExecuteSaveTemplate(object? parameter) // Fix: CS8625 - Allow null parameter
        {
            // Ref: HL7H-12 Save
            if (_originalMessage == null || !Segments.Any())
            {
                MessageBox.Show("Keine Nachricht geladen, aus der ein Template erstellt werden kann.", "Aktion nicht möglich", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            try
            {
                // 1. Neues Hl7Template-Objekt erstellen (Vereinfachung)
                // Korrektur: Konstruktor verwenden und Description entfernen
                var templateName = $"Template_{DateTime.Now:yyyyMMddHHmmss}";
                var newTemplate = new Hl7Template(templateName)
                {
                    // Description gibt es nicht
                    Segments = new List<TemplateSegment>() // Wird unten befüllt
                };


                // 2. Segmente und Felder aus ViewModels in Template-Struktur überführen
                foreach (var segmentVM in Segments)
                {
                    // Korrektur: Konstruktor verwenden und SegmentName statt Name
                    var templateSegment = new TemplateSegment(segmentVM.SegmentName)
                    {
                        Fields = new List<TemplateField>() // Wird unten befüllt
                    };

                    foreach (var fieldVM in segmentVM.Fields)
                    {
                        // Korrektur: Konstruktor verwenden und Description entfernen
                        var templateField = new TemplateField(
                            position: fieldVM.Position,
                            isEditable: true,  // Vereinfachung
                            isRequired: false, // Vereinfachung
                            defaultValue: null // Vereinfachung
                        );
                        // Description gibt es nicht
                        templateSegment.Fields.Add(templateField);
                    }
                    newTemplate.Segments.Add(templateSegment);
                }

                // 3. Dateinamen definieren und Pfad kombinieren
                var fileName = $"{newTemplate.Name}.hl7t.json"; // Konsistente Endung
                var filePath = Path.Combine(TemplateDirectory, fileName);

                // Sicherstellen, dass das Verzeichnis existiert
                Directory.CreateDirectory(TemplateDirectory);

                // 4. Template speichern
                // Korrektur: SaveTemplate ist synchron
                _templateService.SaveTemplate(newTemplate, filePath);

                // 5. Gespeichertes Template zur Liste hinzufügen (oder neu laden)
                // Einfacher Ansatz: Neu laden, um Konsistenz sicherzustellen
                ExecuteLoadTemplates(null); // Lädt alle Templates neu, inkl. des gerade gespeicherten

                // Optional: Das neu erstellte Template auswählen
                SelectedTemplate = AvailableTemplates.FirstOrDefault(t => t.Name == newTemplate.Name);

                MessageBox.Show($"Template '{newTemplate.Name}' erfolgreich gespeichert.", "Template gespeichert", MessageBoxButton.OK, MessageBoxImage.Information);
                System.Diagnostics.Debug.WriteLine($"Template '{newTemplate.Name}' gespeichert in '{filePath}'.");

            }
            catch (Exception ex)
            {
                MessageBox.Show($"Fehler beim Speichern des Templates: {ex.Message}", "Fehler", MessageBoxButton.OK, MessageBoxImage.Error);
                System.Diagnostics.Debug.WriteLine($"Fehler in ExecuteSaveTemplate: {ex}");
            }
        }

        private bool CanExecuteSaveTemplate(object? parameter) // Fix: CS8625 - Allow null parameter
        {
            // Kann speichern, wenn eine Nachricht geladen ist (Segmente vorhanden sind)
            return _originalMessage != null && Segments != null && Segments.Any();
        }

        // --- Ref: HL7H-12 End ---

        // --- Ref: HL7H-20 Start ---

        private void ExecuteNewMessageFromTemplate(object? parameter) // Fix: CS8625 - Allow null parameter
        {
            if (SelectedTemplate == null)
            {
                MessageBox.Show("Bitte wählen Sie zuerst ein Template aus.", "Kein Template ausgewählt", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            try
            {
                // 1. Erstelle eine minimale HL7-Nachricht (z.B. ADT_A01)
                //    Wir verwenden hier ADT_A01 als Beispiel. Eine generischere Basis wäre evtl. besser.
                var message = new ADT_A01();

                // 2. Fülle notwendige MSH-Felder mit Standardwerten/Platzhaltern
                var terser = new Terser(message);
                terser.Set("MSH-1", "|");
                terser.Set("MSH-2", "^~\\&"); // Korrektes Escaping für Backslash
                terser.Set("MSH-7", DateTime.Now.ToString("yyyyMMddHHmmss")); // Zeitstempel
                terser.Set("MSH-9", "ADT^A01"); // Nachrichtentyp
                terser.Set("MSH-10", Guid.NewGuid().ToString()); // Eindeutige Nachrichten-ID
                terser.Set("MSH-11", "P"); // Processing ID (P=Production, D=Debugging, T=Training)
                terser.Set("MSH-12", "2.5"); // HL7 Version

                // 3. Iteriere durch Template-Segmente und setze Standardwerte
                foreach (var templateSegment in SelectedTemplate.Segments)
                {
                    // Versuch, das Segment in der Nachricht zu bekommen (vereinfacht)
                    // Wir gehen davon aus, dass die Basisnachricht (ADT_A01) die Segmente enthält.
                    // Das dynamische Hinzufügen von Segmenten ist komplexer.
                    // Wenn das Segment nicht existiert, überspringen wir es hier einfach.
                    try
                    {
                        // Prüfen, ob das Segment existiert (wirft Exception, wenn nicht)
                        // message.GetStructure(templateSegment.Name);
                        // Da GetStructure nur prüft, ob die Struktur *bekannt* ist, nicht ob sie *vorhanden* ist,
                        // ist dieser Check nicht ausreichend. Wir verlassen uns auf den Terser try-catch.

                        foreach (var templateField in templateSegment.Fields)
                        {
                            if (!string.IsNullOrEmpty(templateField.DefaultValue))
                            {
                                // Konstruiere den Terser-Pfad
                                // Beachte: NHapi erwartet Feldindizes 1-basiert.
                                string terserPath = $"{templateSegment.Name}-{templateField.Position}";

                                try
                                {
                                    // Setze den Standardwert mit Terser
                                    terser.Set(terserPath, templateField.DefaultValue);
                                    System.Diagnostics.Debug.WriteLine($"Terser: Set '{terserPath}' to '{templateField.DefaultValue}'");
                                }
                                catch (NHapi.Base.HL7Exception terserEx)
                                {
                                    // Fehler beim Setzen des Wertes (z.B. Pfad ungültig, Segment nicht vorhanden)
                                    System.Diagnostics.Debug.WriteLine($"Terser Fehler beim Setzen von '{terserPath}' auf '{templateField.DefaultValue}': {terserEx.Message}");
                                    // Optional: Fehler im UI anzeigen oder loggen
                                    // ValidationMessages.Add($"Fehler beim Setzen von Feld {terserPath}: {terserEx.Message}");
                                }
                            }
                        }
                    }
                    catch (NHapi.Base.HL7Exception segEx)
                    {
                        // Fehler beim Zugriff auf das Segment (z.B. nicht Teil von ADT_A01)
                        System.Diagnostics.Debug.WriteLine($"Fehler beim Zugriff auf Segment '{templateSegment.Name}': {segEx.Message}");
                        // Optional: Fehler im UI anzeigen oder loggen
                    }
                }

                // 4. Generiere den HL7-String aus der erstellten Nachricht
                string generatedHl7 = _parsingService.GenerateHl7String(message);
                Hl7MessageText = generatedHl7; // Update Textbox first

                // 5. Erstelle die ViewModels direkt mit dem Template
                _originalMessage = message; // Store the newly created message
                Segments.Clear();
                ValidationMessages.Clear();
                ValidationErrors.Clear();
                IsValid = true; // Assume valid for now

                // Ref: HL7H-25 Template Passing - Template übergeben
                var segmentViewModels = _parsingService.MapMessageToViewModels(message, SelectedTemplate);
                foreach (var vm in segmentViewModels)
                {
                    Segments.Add(vm);
                }

                // Führe Validierung für die neue Nachricht durch
                var errors = _validationService.ValidateMessage(_originalMessage);
                foreach (var error in errors)
                {
                    ValidationErrors.Add(error);
                }
                ValidationResult = errors.Count == 0 ? "Neue Nachricht valide." : $"Validierungsfehler: {errors.Count} Problem(e).";
                UpdateValidationStatus(); // Update status text

                MessageBox.Show($"Neue Nachricht basierend auf Template '{SelectedTemplate.Name}' erstellt.", "Nachricht erstellt", MessageBoxButton.OK, MessageBoxImage.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Ein unerwarteter Fehler ist aufgetreten: {ex.Message}", "Fehler", MessageBoxButton.OK, MessageBoxImage.Error);
                System.Diagnostics.Debug.WriteLine($"Fehler in ExecuteNewMessageFromTemplate: {ex}");
                // Optional: UI zurücksetzen oder Fehler anzeigen
                Hl7MessageText = string.Empty;
                Segments.Clear();
                ValidationMessages.Clear();
                ValidationMessages.Add($"Fehler beim Generieren der Nachricht: {ex.Message}");
                UpdateValidationStatus();
            }
        }

        private bool CanExecuteNewMessageFromTemplate(object? parameter) // Fix: CS8625 - Allow null parameter
        {
            // Kann ausgeführt werden, wenn ein Template ausgewählt ist
            return SelectedTemplate != null;
        }

        // --- Ref: HL7H-20 End ---

    } // Schließende Klammer für MainViewModel Klasse


// Ref: HL7H-28 - Temporäre Testregel für die initiale Implementierung
public class TemporaryTestRule : IValidationRule
{
    // Korrigierter Rückgabetyp und Implementierung ohne yield in try/catch
    public List<ValidationError> Validate(IMessage message)
    {
        var errors = new List<ValidationError>();
        // Gibt immer einen Fehler zurück, um die Anzeige zu testen
        // Beispiel: Prüfen, ob MSH-9 (Message Type) vorhanden ist
        var terser = new Terser(message);
        try
        {
            string messageType = terser.Get("MSH-9-1");
            if (string.IsNullOrWhiteSpace(messageType))
            {
                 errors.Add(new ValidationError("MSH-9 (Nachrichtentyp) fehlt oder ist leer.", "MSH-9-1", ValidationSeverity.Warning));
            }
            // Testweise immer einen Fehler hinzufügen (Severity korrigiert):
            errors.Add(new ValidationError("Dies ist ein Testfehler von TemporaryTestRule.", "PID-3", ValidationSeverity.Warning)); // Info -> Warning
        }
        catch (Exception ex)
        {
            // Fehler beim Zugriff auf das Feld
            errors.Add(new ValidationError($"Fehler beim Zugriff auf MSH-9: {ex.Message}", "MSH-9", ValidationSeverity.Error));
        }
        return errors;
    }
}
} // Schließende Klammer für Namespace