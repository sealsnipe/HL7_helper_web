using NHapi.Base.Model; // Generischeres Interface verwenden
using System.Collections.Generic;

namespace MARIS.HL7Helper.Validation
{
    // Ref: HL7H-27
    public interface IValidationRule
    {
        /// <summary>
        /// Validiert die angegebene HL7-Nachricht.
        /// </summary>
        /// <param name="message">Die zu validierende HL7-Nachricht.</param>
        /// <returns>Eine Liste von Validierungsfehlern. Eine leere Liste bedeutet Erfolg.</returns>
        List<ValidationError> Validate(IMessage message);
    }

    // Ref: HL7H-27 (Helper class for result)
    public class ValidationError
    {
        public string? FieldPath { get; set; } // Fix: CS8625 - Made nullable. Optional: Pfad zum fehlerhaften Feld (z.B. "PID-3")
        public string ErrorMessage { get; set; }
        public ValidationSeverity Severity { get; set; } = ValidationSeverity.Error;

        public ValidationError(string errorMessage, string? fieldPath = null, ValidationSeverity severity = ValidationSeverity.Error) // Fix: CS8625 - Made nullable, default changed to null
        {
            ErrorMessage = errorMessage;
            FieldPath = fieldPath;
            Severity = severity;
        }
    }

    // Ref: HL7H-27 (Helper enum for severity)
    public enum ValidationSeverity
    {
        Error,
        Warning,
        Information
    }
}