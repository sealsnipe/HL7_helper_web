// Ref: HL7H-28
using System.Collections.Generic;
using NHapi.Base.Model; // Für IMessage
using System.Linq;
using MARIS.HL7Helper.Validation; // Für ValidationError und IValidationRule

namespace MARIS.HL7Helper.Validation
{
    /// <summary>
    /// Sammelt und führt Validierungsregeln für HL7-Nachrichten aus.
    /// </summary>
    public class ValidationService
    {
        private readonly List<IValidationRule> _rules = new List<IValidationRule>();

        /// <summary>
        /// Registriert eine neue Validierungsregel beim Service.
        /// </summary>
        /// <param name="rule">Die zu registrierende Regel.</param>
        // Ref: HL7H-28
        public void RegisterRule(IValidationRule rule)
        {
            _rules.Add(rule);
        }

        /// <summary>
        /// Führt alle registrierten Validierungsregeln für die angegebene Nachricht aus.
        /// </summary>
        /// <param name="message">Die zu validierende HL7-Nachricht.</param>
        /// <returns>Eine Liste von Validierungsfehlern. Ist die Liste leer, ist die Nachricht valide.</returns>
        // Ref: HL7H-28
        public List<ValidationError> ValidateMessage(IMessage message)
        {
            if (message == null)
            {
                // Optional: Einen spezifischen Fehler zurückgeben, wenn keine Nachricht vorhanden ist.
                // Alternativ könnte man auch eine leere Liste zurückgeben oder eine Exception werfen.
                // Korrigierter Konstruktoraufruf: errorMessage, fieldPath (optional), severity (optional, default Error)
                return new List<ValidationError> { new ValidationError("Keine Nachricht zum Validieren vorhanden.", fieldPath: null) }; // Severity ist standardmäßig Error
            }
            // Führt die Validate-Methode jeder Regel aus und sammelt alle Ergebnisse (Listen von Fehlern)
            // in einer einzigen flachen Liste von Fehlern.
            return _rules.SelectMany(rule => rule.Validate(message)).ToList();
        }
    }
}