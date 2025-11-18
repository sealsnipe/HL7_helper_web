using NHapi.Base.Model;
using NHapi.Base.Util;
using System;
using System.Collections.Generic;
using MARIS.HL7Helper.Validation; // Assuming ValidationError and ValidationSeverity are here

namespace MARIS.HL7Helper.Validation.Rules
{
    // Ref: HL7H-30
    public class Msh9MessageTypeRule : IValidationRule
    {
        public List<ValidationError> Validate(IMessage message)
        {
            var errors = new List<ValidationError>();
            try
            {
                var terser = new Terser(message);
                string messageCode = terser.Get("MSH-9-1");
                string triggerEvent = terser.Get("MSH-9-2");

                if (string.IsNullOrEmpty(messageCode) || string.IsNullOrEmpty(triggerEvent))
                {
                    errors.Add(new ValidationError("MSH-9 Message Type ist unvollständig (Code oder Trigger Event fehlt).", "MSH-9", ValidationSeverity.Error));
                }
            }
            catch (Exception ex)
            {
                // Handle potential exceptions during Terser access, e.g., segment not found
                errors.Add(new ValidationError($"Fehler beim Zugriff auf MSH-9: {ex.Message}", "MSH-9", ValidationSeverity.Error));
            }
            return errors;
        }
    }
}