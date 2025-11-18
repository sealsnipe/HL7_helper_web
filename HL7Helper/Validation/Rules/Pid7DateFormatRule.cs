using MARIS.HL7Helper.Validation;
using NHapi.Base.Model;
using NHapi.Base.Util;
using System;
using System.Collections.Generic;
using System.Globalization;

namespace MARIS.HL7Helper.Validation.Rules
{
    // Ref: HL7H-29
    public class Pid7DateFormatRule : IValidationRule
    {
        public List<ValidationError> Validate(IMessage message)
        {
            var errors = new List<ValidationError>();
            var terser = new Terser(message);

            try
            {
                // Prüfe, ob das PID-Segment existiert
                var pidSegment = terser.GetSegment("PID");
                if (pidSegment == null)
                {
                    // Wenn PID nicht existiert, gibt es nichts zu validieren für diese Regel
                    return errors;
                }

                var dateOfBirth = terser.Get("PID-7");

                if (!string.IsNullOrEmpty(dateOfBirth))
                {
                    if (!DateTime.TryParseExact(dateOfBirth, "yyyyMMdd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
                    {
                        errors.Add(new ValidationError("PID-7 Geburtsdatum hat nicht das erwartete Format (yyyyMMdd).", "PID-7", ValidationSeverity.Warning));
                    }
                }
            }
            catch (Exception ex)
            {
                // Fehler bei der Verwendung von Terser, z.B. wenn das Segment oder Feld nicht existiert
                // In diesem Fall fügen wir keinen Validierungsfehler hinzu, da das Fehlen von Daten
                // möglicherweise durch andere Regeln abgedeckt wird oder akzeptabel ist.
                // Loggen Sie den Fehler ggf. für Debugging-Zwecke.
                Console.WriteLine($"Fehler beim Zugriff auf PID-7 mit Terser: {ex.Message}");
            }

            return errors;
        }
    }
}