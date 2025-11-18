using NHapi.Base.Model;
using NHapi.Base.Util;
using NHapi.Base; // For HL7Exception

using System;
using System.Collections.Generic;
using MARIS.HL7Helper.Validation; // Assuming ValidationError and ValidationSeverity are here
using NHapi.Base.Parser; // Required for GetStructure

namespace MARIS.HL7Helper.Validation.Rules
{
    // Ref: HL7H-30
    public class Pid5PatientNameRule : IValidationRule
    {
        public List<ValidationError> Validate(IMessage message)
        {
            var errors = new List<ValidationError>();
            var terser = new Terser(message);
            try
            {
                // Try to access a field in PID. If it fails with HL7Exception, the segment likely doesn't exist.
                string familyName = terser.Get("PID-5-1");

                // If we reach here without an exception, the segment exists. Now check the value.
                if (string.IsNullOrEmpty(familyName))
                {
                    errors.Add(new ValidationError("PID-5-1 Familienname fehlt.", "PID-5-1", ValidationSeverity.Warning));
                }
            }
            catch (HL7Exception) // Catch specific NHapi exception if segment/field is missing
            {
                // PID segment or PID-5-1 field does not exist, which is acceptable for this rule.
                // Optional: Add an info message if needed.
                // errors.Add(new ValidationError("PID Segment oder PID-5-1 nicht gefunden.", "PID-5", ValidationSeverity.Info));
                return errors; // Return empty list as the rule condition (missing name) is not met.
            }
            catch (Exception ex) // Catch other potential errors during Terser access
            {
                errors.Add(new ValidationError($"Unerwarteter Fehler beim Zugriff auf PID-5: {ex.Message}", "PID-5", ValidationSeverity.Error));
            }
            return errors;
        }
    }
}