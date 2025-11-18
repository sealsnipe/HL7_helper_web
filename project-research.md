Technischer Bericht: Entwicklung einer Windows-Anwendung zur Verwaltung und Erstellung von HL7 v2.3 Nachrichten
I. Einleitung
Zweck: Dieser Bericht dient als umfassender technischer Leitfaden für die Entwicklung einer Windows-Desktop-Anwendung. Das Ziel der Anwendung ist die Verwaltung (Anzeige, Bearbeitung) und Erstellung von HL7 v2.3 Nachrichten der Typen ADT (Patientenaufnahme, -entlassung, -transfer), MDM (Medizinische Dokumentenverwaltung) und ORU (Beobachtungsergebnis). Ein zentrales Merkmal ist die Möglichkeit, die Bearbeitbarkeit von Feldern dynamisch auf Basis vordefinierter Templates zu steuern.

Kontext: Der HL7-Standard (Health Level Seven) ist fundamental für die Interoperabilität im Gesundheitswesen, da er den Austausch klinischer und administrativer Daten zwischen verschiedenen Systemen ermöglicht. Die Komplexität und Variabilität von HL7-Nachrichten stellen jedoch eine Herausforderung dar. Werkzeuge zur effektiven Verwaltung dieser Nachrichten sind daher unerlässlich, insbesondere solche, die die Komplexität für Endanwender reduzieren. Die Notwendigkeit einer solchen Anwendung ergibt sich aus dem Bedarf, HL7-Nachrichtenflüsse zu kontrollieren, zu modifizieren und zu generieren, ohne dass tiefgreifende HL7-Kenntnisse bei jedem Anwender vorausgesetzt werden können.   

Überblick über die Zielanwendung: Die zu entwickelnde Anwendung soll folgende Kernfunktionen bieten:

Laden und Anzeigen bestehender HL7 v2.3 Nachrichten (ADT, MDM, ORU).
Erstellen neuer Nachrichten dieser Typen, basierend auf Benutzereingaben oder Vorlagen.
Bearbeiten von Nachrichtenfeldern, wobei zwei Modi unterstützt werden:
Vollzugriff: Alle Felder sind bearbeitbar.
Template-basiert: Nur die in einem ausgewählten Template definierten Felder sind bearbeitbar.
Verwaltung von Templates zur Definition bearbeitbarer Felder.
Berichtsstruktur: Dieser Bericht gliedert sich wie folgt: Zunächst erfolgt eine detaillierte Analyse der relevanten HL7 v2.3 Nachrichtentypen. Anschließend werden Best Practices für die Entwicklung von HL7-Anwendungen unter Windows diskutiert. Darauf aufbauend werden eine geeignete Software-Architektur und ein Technologie-Stack empfohlen, inklusive einer Evaluierung von HL7-Bibliotheken und Codebeispielen. Ein wesentlicher Abschnitt widmet sich der Implementierung der Template-basierten Feldbearbeitbarkeit. Abschließend wird ein beispielhafter agiler Entwicklungsplan skizziert, gefolgt von einer Zusammenfassung und Empfehlungen für die nächsten Schritte.

Die Anforderung, die Bearbeitbarkeit von Feldern über Templates zu steuern, deutet auf einen impliziten Bedarf hin: Die Anwendung muss eine benutzerfreundliche Abstraktionsebene über die technische Komplexität von HL7 legen. Da HL7 für Nicht-Experten oft schwer verständlich ist , hängt der Erfolg der Anwendung nicht nur von der technischen Korrektheit ab, sondern auch davon, wie gut sie die Interaktion mit HL7-Nachrichten vereinfacht. Die Template-Funktion adressiert dies direkt, indem sie den Bearbeitungsprozess für spezifische Arbeitsabläufe einschränkt und lenkt.   

II. Analyse der HL7 v2.3 Nachrichtentypen (ADT, MDM, ORU)
A. HL7 v2.x Grundlagen
Der HL7 v2.x Standard definiert eine textbasierte, zeichengetrennte Syntax für den Austausch von Gesundheitsdaten. Das Verständnis dieser Grundlagen ist entscheidend für die Entwicklung von Anwendungen, die diese Nachrichten verarbeiten.

Struktur: HL7-Nachrichten sind hierarchisch aufgebaut. Eine Nachricht besteht aus mehreren Segmenten. Jedes Segment enthält Felder (auch Komposita genannt). Felder können wiederum Komponenten und Subkomponenten enthalten, um strukturierte Daten darzustellen.   
Segmente: Segmente sind logische Gruppierungen von Datenfeldern, die jeweils eine bestimmte Informationskategorie repräsentieren (z.B. Patientendaten, Besuchsdaten). Jedes Segment beginnt mit einem eindeutigen dreistelligen Code (z.B. MSH, PID, PV1). Es gibt über 120 standardisierte Segmente. Zusätzlich erlaubt der Standard die Definition von benutzerdefinierten Segmenten, die konventionsgemäß mit 'Z' beginnen (Z-Segmente), um systemspezifische Daten zu übertragen.   
Felder/Komposita: Felder sind die Datenelemente innerhalb eines Segments. Sie werden durch das Feldtrennzeichen (standardmäßig '|') voneinander getrennt. Jedes Feld hat einen definierten Datentyp (z.B. ST für String, NM für Numeric, TS für Timestamp).   
Komponenten/Subkomponenten: Komplexe Felder können weiter unterteilt werden. Komponenten innerhalb eines Feldes werden durch das Komponententrennzeichen (standardmäßig '^') getrennt. Subkomponenten innerhalb einer Komponente werden durch das Subkomponententrennzeichen (standardmäßig '&') getrennt.   
Trennzeichen: Die Struktur einer HL7-Nachricht wird durch spezielle Trennzeichen definiert. Diese werden üblicherweise im MSH-Segment (MSH-1 und MSH-2) deklariert. Standardmäßig sind dies: Segment-Terminator (\r oder 0x0D), Feldtrenner (|), Komponententrenner (^), Wiederholungstrenner (~), Escape-Zeichen (\) und Subkomponententrenner (&). Parser müssen die in der Nachricht definierten Trennzeichen verwenden.   
Optionalität und Wiederholung: Ein Schlüsselaspekt von HL7 v2.x ist seine Flexibilität. Segmente und Felder können als Optional (O), Erforderlich (R - Required) oder Bedingt (C - Conditional) definiert sein. Sie können auch wiederholbar sein (oft durch {} oder ∞ in der Spezifikation gekennzeichnet) oder nicht wiederholbar (`` oder -). Diese Flexibilität, die eingeführt wurde, um einen breiten Konsens und Anwendbarkeit in verschiedenen Gesundheitseinrichtungen zu erreichen , ist eine Hauptquelle für Komplexität und Variationen zwischen Implementierungen.   
Message Header (MSH): Das MSH-Segment ist immer das erste Segment einer HL7-Nachricht und enthält essenzielle Metadaten: Sende- und Empfangsanwendung/-Einrichtung (MSH-3 bis MSH-6), Datum/Uhrzeit der Nachricht (MSH-7), Nachrichtentyp (MSH-9, z.B. ADT^A01), Nachrichten-Kontroll-ID (MSH-10, eine eindeutige ID für die Nachricht), Verarbeitungs-ID (MSH-11, z.B. P für Produktion, T für Test), Versions-ID (MSH-12, z.B. 2.3) und die Kodierungszeichen (MSH-2).   
Event Type (EVN): Das EVN-Segment spezifiziert das Ereignis in der realen Welt, das die Übertragung der Nachricht ausgelöst hat (z.B. eine Patientenaufnahme).   
Die inhärente Flexibilität von HL7 v2.x, insbesondere die Optionalität vieler Elemente und die Möglichkeit von Wiederholungen und Z-Segmenten , hat direkte Konsequenzen für die Anwendungsentwicklung. Sie erfordert eine robuste Parsing-Logik, die mit fehlenden Elementen und Variationen umgehen kann. Ein Parser kann keine feste Struktur annehmen, sondern muss optional nicht vorhandene Segmente oder Felder tolerant behandeln. Gleichzeitig wird eine strikte Validierung erschwert. Eine Validierung, die nur die Basisspezifikation prüft, könnte Nachrichten als ungültig markieren, die in der Praxis valide sind, oder umgekehrt Nachrichten durchlassen, die für einen spezifischen Anwendungsfall ungeeignet sind. Dies erfordert ein sorgfältiges Design der Parsing- und Validierungsstrategie in der Zielanwendung.   

B. ADT (Admission, Discharge, Transfer) Nachrichten (HL7 Kapitel 3 )
Zweck: ADT-Nachrichten bilden das Rückgrat der Kommunikation von Patientendemografie- und Besuchsinformationen im Krankenhausinformationssystem (KIS) oder anderen klinischen Systemen. Sie werden durch Ereignisse wie Aufnahme, Entlassung, Verlegung, Registrierung oder Aktualisierung von Patientendaten ausgelöst. Aufgrund ihrer zentralen Rolle bei der Synchronisation von Patientendaten zwischen Systemen gehören sie zu den am häufigsten verwendeten und volumenstärksten Nachrichtentypen.   

Häufige Trigger Events (v2.3): Die Benutzeranfrage fokussiert auf:

ADT^A01: Admit/Visit Notification (Aufnahme/Besuchsbenachrichtigung)
ADT^A03: Discharge/End Visit (Entlassung/Besuchsende)
ADT^A04: Register a Patient (Registrierung eines Patienten)
ADT^A08: Update Patient Information (Aktualisierung von Patienteninformationen)    
Segmentanalyse (Fokus auf A01, A03, A04, A08 in v2.3): Die Struktur dieser Nachrichtentypen ist in HL7 v2.3 sehr ähnlich. Sie unterscheiden sich hauptsächlich geringfügig in optionalen Segmenten, die je nach Ereigniskontext relevant sind.   

MSH (Message Header): Erforderlich, Nicht-Wiederholbar.   
EVN (Event Type): Erforderlich, Nicht-Wiederholbar. Definiert das spezifische ADT-Ereignis (A01, A03 etc.).   
PID (Patient Identification): Erforderlich, Nicht-Wiederholbar. Enthält Kerndemografiedaten.   
PD1 (Patient Demographic - v2.3): Optional, Nicht-Wiederholbar. Zusätzliche Demografiedaten.   
NK1 (Next of Kin): Optional, Wiederholbar. Informationen zu Kontaktpersonen.   
PV1 (Patient Visit): Erforderlich, Nicht-Wiederholbar. Enthält Kerninformationen zum Aufenthalt/Besuch (Patientenklasse, zugewiesener Ort, behandelnder Arzt).   
PV2 (Patient Visit - Additional Info): Optional, Nicht-Wiederholbar. Zusätzliche Besuchsinformationen.   
DB1 (Disability): Optional, Wiederholbar. Relevant für A04, A08 zur Erfassung von Behinderungen.   
OBX (Observation/Result): Optional, Wiederholbar. Kann klinische Beobachtungen im Kontext des ADT-Ereignisses übertragen (z.B. Aufnahmegewicht).   
AL1 (Patient Allergy Information): Optional, Wiederholbar. Allergieinformationen.   
DG1 (Diagnosis): Optional, Wiederholbar. Diagnosen (z.B. Aufnahmediagnose).   
DRG (Diagnosis Related Group): Optional, Nicht-Wiederholbar. Relevant bei Abrechnungsereignissen wie Entlassung (A03).   
Schlüsselfelder: Wichtige Felder sind z.B. PID-3 (Patient Identifier List), PID-5 (Patient Name), PID-7 (Date/Time of Birth), PID-8 (Administrative Sex), PV1-2 (Patient Class), PV1-3 (Assigned Patient Location), PV1-7 (Attending Doctor).

Tabelle: ADT Segmentstruktur-Zusammenfassung (v2.3 - A01/A03/A04/A08):

Segment	Anforderung	Wiederholbarkeit	Anmerkungen
MSH	R	-	Nachrichten-Header
EVN	R	-	Ereignistyp (A01, A03, A04, A08)
PID	R	-	Patientenidentifikation
PD1	O	-	Zusätzliche Demografie (v2.3)
NK1	O	∞	Nächster Angehöriger/Kontaktperson
PV1	R	-	Patientenbesuch/-aufenthalt
PV2	O	-	Zusätzliche Besuchsinformationen
DB1	O	∞	Behinderungsinformation (relevant für A04/A08)
OBX	O	∞	Beobachtung/Ergebnis (z.B. klinische Werte)
AL1	O	∞	Allergieinformation
DG1	O	∞	Diagnoseinformation
DRG	O	-	Diagnosis Related Group (relevant für A01/A03)

In Google Sheets exportieren
*(R=Required/Erforderlich, O=Optional, C=Conditional; -=Non-Repeating/Nicht-Wiederholbar, ∞=Repeating/Wiederholbar)*
C. MDM (Medical Document Management) Nachrichten (HL7 Kapitel 9 )
Zweck: MDM-Nachrichten dienen der Übermittlung medizinischer Dokumente (z.B. transkribierte Berichte, Arztbriefe) oder Benachrichtigungen über Statusänderungen von Dokumenten. Sie können im Kontext einer Anforderung (Order) stehen oder unabhängig davon generiert werden. Sie werden häufig von Abteilungen wie der Radiologie verwendet, um Transkriptionen und Berichte zu kommunizieren.   

Häufige Trigger Events (v2.3): Die Anfrage konzentriert sich auf MDM^T02 (Original document notification and content), was auch als häufig genutzter Typ gilt. Dieser Typ ähnelt einer ORU-Nachricht, da er sowohl die Benachrichtigung über die Erstellung eines Dokuments als auch dessen Inhalt übermittelt. Es gibt weitere MDM-Typen (T01 bis T11), die sich darin unterscheiden, ob der Inhalt mitgesendet wird und welche Art von Ereignis vorliegt (z.B. Originaldokument, Statusänderung, Addendum, Bearbeitung).   

Segmentanalyse (MDM^T02 in v2.3):

MSH (Message Header): Erforderlich, Nicht-Wiederholbar.   
EVN (Event Type): Erforderlich, Nicht-Wiederholbar. Identifiziert das Dokumentenereignis (T02).   
PID (Patient Identification): Erforderlich, Nicht-Wiederholbar. Verknüpft das Dokument mit dem Patienten.    
PV1 (Patient Visit): Erforderlich, Nicht-Wiederholbar. Verknüpft das Dokument mit einem Besuch/Aufenthalt.    
TXA (Document Notification): Erforderlich, Nicht-Wiederholbar. Enthält Metadaten zum Dokument (Dokumenttyp, eindeutige ID, Status, Datum, Authentifizierungsinformationen).   
OBX (Observation/Result): Erforderlich, Wiederholbar. Dieses Segment wird hier entscheidend genutzt, um den eigentlichen Inhalt des Dokuments zu übertragen. Es wird oft für jeden Abschnitt oder Absatz des Dokuments wiederholt.   
NTE (Notes and Comments): Optional, Wiederholbar. Zusätzliche Anmerkungen zum Dokument.   
Schlüsselfelder: Wichtige Felder sind TXA-2 (Document Type), TXA-16 (Unique Document Number), TXA-17 (Document Completion Status), OBX-2 (Value Type, oft 'TX' für Text oder 'FT' für formatierten Text), OBX-5 (Observation Value, enthält den eigentlichen Dokumententext), OBX-3 (Observation Identifier, kann zur Kennzeichnung von Abschnitten dienen).

Die Verwendung wiederholter OBX-Segmente zur Kapselung des Dokumenteninhalts  ist ein zentrales Strukturmerkmal von MDM^T02. Dies unterscheidet sich von der typischen Verwendung des OBX-Segments für diskrete Beobachtungswerte. Parser und Editoren müssen daher in der Lage sein, potenziell große Textblöcke zu handhaben, die sich über mehrere OBX-Segmente erstrecken. Da HL7 v2 keine dedizierte Struktur für große Textblöcke vorsieht, wurde das flexible OBX-Segment für diesen Zweck adaptiert. Die Wiederholbarkeit  ermöglicht es, umfangreiche Dokumente in handhabbare Einheiten zu zerlegen, die oft logischen Abschnitten entsprechen. Diese Designentscheidung beeinflusst die Anwendung: Sie benötigt Logik, um beim Parsen das vollständige Dokument aus mehreren OBX-Segmenten zusammenzusetzen und es beim Erstellen/Bearbeiten gegebenenfalls wieder zu segmentieren.   

Tabelle: MDM_T02 Segmentstruktur-Zusammenfassung (v2.3):

Segment	Anforderung	Wiederholbarkeit	Anmerkungen
MSH	R	-	Nachrichten-Header
EVN	R	-	Ereignistyp (T02 - Originaldokument mit Inhalt)
PID	R	-	Patientenidentifikation
PV1	R	-	Patientenbesuch/-aufenthalt
TXA	R	-	Dokumenten-Header (Metadaten)
OBX	R	∞	Beobachtung/Ergebnis (Trägt den Dokumentinhalt)
NTE	O	∞	Anmerkungen/Kommentare

In Google Sheets exportieren
*(R=Required/Erforderlich, O=Optional; -=Non-Repeating/Nicht-Wiederholbar, ∞=Repeating/Wiederholbar)*
D. ORU (Observation Result) Nachrichten (HL7 Kapitel 7 )
Zweck: ORU-Nachrichten dienen der unaufgeforderten Übermittlung von Beobachtungsergebnissen (z.B. Laborergebnisse, Radiologiebefunde, Vitalzeichen, klinische Notizen) von einem Ergebnis produzierenden System (z.B. LIS, RIS) an ein anforderndes oder interessiertes System (z.B. KIS, EMR). Sie werden oft als Antwort auf eine ORM (Order)-Nachricht gesendet, können aber auch ohne vorherige Anforderung übertragen werden (unsolicited). Sie sind essenziell für den Fluss klinischer Ergebnisse.   

Häufige Trigger Events (v2.3): Die Anfrage fokussiert auf ORU^R01 (Unsolicited transmission of an observation message), den mit Abstand häufigsten ORU-Typ. ORU^W01 für Wellenformdaten existiert ebenfalls, ist aber seltener.   

Segmentanalyse (ORU^R01 in v2.3): Die Struktur ist hierarchisch aufgebaut. Eine Nachricht kann Ergebnisse für mehrere Anforderungen (Orders) und potenziell mehrere Patienten enthalten (obwohl letzteres seltener ist).   

MSH (Message Header): Erforderlich, Nicht-Wiederholbar.   
** (Anmerkung:  listet PID/PV1 auf oberster Ebene als Optional, die logische Struktur und andere Quellen  legen jedoch nahe, dass sie innerhalb der Patientengruppe erforderlich sind, um das Ergebnis zuzuordnen.) * PD1 (Patient Demographic): Optional, Nicht-Wiederholbar. * NTE (Notes and Comments): Optional, Wiederholbar. Anmerkungen zum Patienten. * PV1 (Patient Visit): Optional, Nicht-Wiederholbar. (Siehe PID-Anmerkung). Verknüpft Ergebnis mit Besuch. * PV2 (Patient Visit - Additional Info): Optional, Nicht-Wiederholbar.
{ ORDER_OBSERVATION Group: Erforderlich, Wiederholbar (innerhalb PATIENT_RESULT) - Gruppe für Ergebnisse einer Anforderung
ORC (Common Order): Optional, Nicht-Wiederholbar. Verknüpft das Ergebnis mit der ursprünglichen Anforderung (Order).   
OBR (Observation Request): Erforderlich, Nicht-Wiederholbar (innerhalb ORDER_OBSERVATION). Dient als Kopf für eine Gruppe von Beobachtungen, enthält Anforderungsdetails (z.B. Ordernummer, Untersuchungs-ID), Ergebnisstatus.   
NTE (Notes and Comments): Optional, Wiederholbar. Anmerkungen zur Anforderung/zum Ergebnis-Set.
** Enthält den Wert einer einzelnen Beobachtung (z.B. Kaliumwert, Blutdruck).
NTE (Notes and Comments): Optional, Wiederholbar. Anmerkungen zur spezifischen Beobachtung.
CTI (Clinical Trial Identification): Optional, Wiederholbar. Verknüpfung zu klinischen Studien.   
  
DSC (Continuation Pointer): Optional, Nicht-Wiederholbar. Wird für Nachrichtenfortsetzung verwendet.   
Schlüsselfelder: Wichtige Felder sind OBR-4 (Universal Service Identifier - Test-ID), OBR-7 (Observation Date/Time), OBR-25 (Result Status), OBX-2 (Value Type - z.B. NM, ST, TX, ED), OBX-3 (Observation Identifier - LOINC-Code etc.), OBX-5 (Observation Value - Das eigentliche Ergebnis), OBX-6 (Units - Einheiten), OBX-7 (References Range - Referenzbereich), OBX-8 (Abnormal Flags - z.B. H, L, N).

Die verschachtelte, wiederholbare Gruppenstruktur (Patient Result -> Order Observation -> Observation)  macht ORU-Nachrichten potenziell komplex für das Parsen und die Darstellung in einer Benutzeroberfläche. Eine ORU-Nachricht kann Ergebnisse für mehrere Untersuchungen (wiederholende Order Observation Gruppe) eines Patienten enthalten. Die Anwendung muss diese Hierarchie korrekt verarbeiten und jedes OBX-Segment dem richtigen OBR- und PID/PV1-Segment zuordnen. Die Benutzeroberfläche sollte diese Hierarchie logisch darstellen, beispielsweise durch eine Baumansicht oder eine Master-Detail-Ansicht, anstatt nur einer flachen Liste von Segmenten. Auch die Bearbeitung muss diese Struktur berücksichtigen.   

Tabelle: ORU_R01 Segment-/Gruppenstruktur-Zusammenfassung (v2.3):

Ebene	Elementname	Anforderung	Wiederholbarkeit	Anmerkungen
0	MSH	R	-	Nachrichten-Header
1	Manuelle String-Operationen oder einfache reguläre Ausdrücke sind fehleranfällig und nicht empfehlenswert. Die Verwendung einer dedizierten HL7-Parsing-Bibliothek wie NHapi ist dringend anzuraten. Diese Bibliotheken sind darauf ausgelegt, die Syntax korrekt zu interpretieren und Variationen zu handhaben. Ein wichtiger Aspekt ist die Balance zwischen "Nachsichtigkeit" (Leniency) und "Strenge" (Strictness). Ein zu nachsichtiger Parser könnte ungültige Nachrichten akzeptieren, während ein zu strenger Parser Nachrichten ablehnen könnte, die zwar nicht perfekt standardkonform, aber in der Praxis gebräuchlich sind. Konfigurierbare Parser bieten hier Vorteile.
  
Validierungsstrategie: Die Validierung von HL7-Nachrichten ist ein mehrstufiger Prozess, da syntaktische Korrektheit allein keine semantische Richtigkeit oder Eignung für einen bestimmten Zweck garantiert.

Syntaktische Validierung: Grundlegende Prüfung auf korrekte Verwendung von Trennzeichen und allgemeine Segmentstruktur. Dies wird oft bereits durch den Parser selbst sichergestellt.   
Schema-/Versionsvalidierung: Abgleich gegen die Definitionen des HL7 v2.3-Standards, einschließlich Segmentreihenfolge, Felddatentypen und grundlegender Kardinalitätsregeln (Anzahl der Wiederholungen). HL7-Bibliotheken können hier Unterstützung bieten, aber der Umfang variiert.   
Profilvalidierung (entscheidend): HL7-Nachrichten werden oft durch Konformitätsprofile (Conformance Profiles) oder Implementierungsleitfäden für spezifische Anwendungsfälle weiter eingeschränkt. Diese Profile können z.B. optional im Standard definierte Felder als erforderlich deklarieren oder spezifische Wertesets (Code Tables) vorschreiben. Eine Validierung gegen solche Profile ist essenziell, um die Interoperabilität in einem bestimmten Kontext sicherzustellen. Die Anwendung sollte idealerweise das Laden und Anwenden solcher Profile unterstützen. Bei NHapi scheint dies eine benutzerdefinierte Implementierung von Validierungsregeln zu erfordern , anders als bei spezialisierten Werkzeugen wie dem FHIR-Validator.   
Geschäftsregelvalidierung: Implementierung anwendungsspezifischer Logik, die über den HL7-Standard hinausgeht (z.B. Prüfung auf gültige Einrichtungscodes, Konsistenzprüfungen zwischen Feldern, Plausibilitätschecks). NHapis IValidationContext und benutzerdefinierte Regeln sind hierfür der vorgesehene Mechanismus.   
Fehlerbehandlung/-berichterstattung: Eine umfassende Fehlerprotokollierung und -meldung ist unerlässlich. Fehler sollten klar lokalisiert (Segment, Feld, Komponente) und beschrieben werden, um die Diagnose zu erleichtern. Es müssen Strategien für den Umgang mit ungültigen Nachrichten definiert werden (z.B. Ablehnung mit Fehlermeldung, Verschieben in eine Quarantäne-Warteschlange, Versuch einer automatischen Korrektur).   
Effektive HL7-Validierung erfordert somit einen schichtweisen Ansatz. Eine Nachricht muss syntaktisch korrekt sein, dem Basisstandard entsprechen, den spezifischen Profilanforderungen genügen und schließlich den anwendungsspezifischen Geschäftsregeln entsprechen, um sowohl technisch korrekt als auch semantisch passend für den Ziel-Workflow zu sein. Die Anwendungsarchitektur sollte diese Schichten berücksichtigen und idealerweise die Konfiguration von Profil- und Geschäftsregeln ermöglichen.

B. Strategien zur Nachrichtengenerierung
Konformität: Generierte Nachrichten müssen dem HL7 v2.3-Standard und allen anwendbaren Konformitätsprofilen entsprechen.
Bibliotheksnutzung: Die Verwendung von HL7-Bibliotheken (wie NHapi), die ein Objektmodell bereitstellen, das die HL7-Strukturen abbildet, wird dringend empfohlen. Dies vereinfacht die Erstellung erheblich, stellt die korrekte Segmentreihenfolge sicher und kümmert sich automatisch um die korrekte Verwendung von Trennzeichen. Manuelle String-Verkettung zur Nachrichtenerstellung ist extrem fehleranfällig und sollte vermieden werden.   
Befüllen von Feldern: Die Bibliothek ermöglicht das typisierte Befüllen von erforderlichen und optionalen Feldern, Komponenten und Subkomponenten über das Objektmodell.   
Umgang mit Datentypen: Es muss sichergestellt werden, dass die Daten korrekt gemäß den HL7-Datentypen formatiert werden (z.B. TS für Zeitstempel im Format YYYYMMDDHHMMSS, NM für numerische Werte, ST/TX/FT für Text). Bibliotheken übernehmen oft die korrekte Formatierung.   
Generierung des MSH-Segments: Besondere Sorgfalt ist bei der Generierung des MSH-Segments geboten. Korrekte Sender-/Empfängerinformationen, Zeitstempel (MSH-7), Nachrichtentyp (MSH-9), eine eindeutige Nachrichten-Kontroll-ID (MSH-10), die Verarbeitungs-ID (MSH-11) und die Versions-ID (MSH-12) sind essenziell.   
Kodierung: Der Encoder der Bibliothek wird verwendet, um das erstellte Nachrichtenobjekt in das endgültige Pipe-and-Hat (ER7) Format zu serialisieren.   
C. Umgang mit HL7-Nuancen
Optionalität: Die Anwendungslogik muss damit umgehen können, dass optionale Segmente oder Felder in eingehenden Nachrichten fehlen. Die Benutzeroberfläche sollte fehlende Daten elegant handhaben (z.B. durch Ausblenden oder Deaktivieren entsprechender UI-Elemente). Beim Generieren von Nachrichten sollten optionale Elemente nur dann eingefügt werden, wenn entsprechende Daten vorhanden und relevant sind.   
Wiederholung: Parser müssen wiederholte Segmente (z.B. NK1, OBX, DG1) und Felder korrekt als Sammlungen (Listen, Arrays) verarbeiten. Die Benutzeroberfläche muss in der Lage sein, diese wiederholten Elemente anzuzeigen und deren Bearbeitung zu ermöglichen (z.B. in Listen oder Grids). Generatoren müssen mehrere Instanzen korrekt hinzufügen, unter Verwendung der Mechanismen der Bibliothek (z.B. GetNextRepetition oder Add-Methoden).   
Kodierungszeichen: Obwohl meist Standard (|^~\&), definiert MSH-2 die für die Nachricht gültigen Trennzeichen. Parser müssen die in MSH-2 angegebenen Zeichen respektieren. Generatoren sollten standardmäßig die Standardzeichen verwenden, es sei denn, spezifische Anforderungen erfordern Abweichungen.   
Zeichensätze: HL7 v2.3 unterstützt verschiedene Zeichensätze, die in MSH-18 spezifiziert werden (z.B. ASCII, 8859/1, UTF-8). Die Anwendung muss eingehende Nachrichten korrekt dekodieren, basierend auf dem Wert in MSH-18. Für ausgehende Nachrichten sollte ein geeigneter Zeichensatz gewählt werden (oft ist UTF-8 eine gute Wahl für breite Kompatibilität, aber dies sollte mit den Kommunikationspartnern abgestimmt werden). Bibliotheken wie NHapi sollten dies unterstützen, erfordern aber möglicherweise eine Konfiguration.   
Z-Segmente: Die Anwendung muss eine Strategie für den Umgang mit benutzerdefinierten Z-Segmenten haben. Wenn die Anwendung den Inhalt spezifischer Z-Segmente verstehen und verarbeiten muss, ist benutzerdefinierte Parsing-Logik oder eine Erweiterung der Bibliothek erforderlich (wie für NHapi gezeigt ). Wenn Z-Segmente ignoriert werden sollen, sollte der Parser idealerweise so konfiguriert werden, dass er unbekannte Segmente überspringt, ohne einen Fehler zu verursachen.   
D. Sicherheit und Compliance (HIPAA/GDPR)
Da HL7-Nachrichten sensible Patientendaten enthalten – Protected Health Information (PHI) gemäß HIPAA in den USA oder personenbezogene Gesundheitsdaten gemäß DSGVO (GDPR) in der EU – sind strenge Sicherheits- und Datenschutzmaßnahmen unerlässlich. Sicherheit darf kein nachträglicher Gedanke sein, sondern muss von Beginn an in das Design integriert werden.   

Datenverschlüsselung:
Übertragung (In Transit): Jegliche Netzwerkübertragung von HL7-Daten muss mit starken Verschlüsselungsprotokollen wie TLS/SSL gesichert werden. Dies gilt für alle Übertragungswege, sei es MLLP (typischerweise über einen VPN-Tunnel), SFTP/FTPS oder HTTPS-basierte APIs. Unverschlüsselte Übertragungen sind zu vermeiden.   
Speicherung (At Rest): HL7-Daten, die in Datenbanken oder Dateien gespeichert werden, müssen ebenfalls verschlüsselt werden. Dies kann durch Datenbank-Verschlüsselung oder anwendungsseitige Verschlüsselung sensibler Felder erfolgen.   
Zugriffskontrolle: Robuste Mechanismen zur Authentifizierung und Autorisierung sind erforderlich. Rollenbasierte Zugriffskontrolle (RBAC) stellt sicher, dass Benutzer nur auf die Daten zugreifen und diese ändern können, die für ihre Rolle relevant sind. Multi-Faktor-Authentifizierung (MFA) sollte in Betracht gezogen werden. Konzepte aus FHIR wie Security Labels  können auch für v2-Anwendungen als Inspiration dienen, um Daten nach Vertraulichkeitsstufen zu klassifizieren und den Zugriff entsprechend zu steuern.   
Auditierung: Eine lückenlose Protokollierung (Audit Logging) aller relevanten Ereignisse ist zwingend erforderlich. Dazu gehören das Erstellen, Anzeigen, Ändern und Löschen von Nachrichten, Validierungsergebnisse sowie Benutzeranmeldungen und -abmeldungen. Audit-Logs müssen manipulationssicher gespeichert werden und Informationen darüber enthalten, wer wann welche Aktion an welchen Daten durchgeführt hat und was das Ergebnis war. Die FHIR-Ressourcen AuditEvent und Provenance bieten hierfür ein gutes Modell.   
Datenminimierung: Das Prinzip der Datensparsamkeit (Minimum Necessary Standard unter HIPAA, Datenminimierung unter DSGVO) muss beachtet werden. Es dürfen nur die Daten verarbeitet und angezeigt werden, die für den jeweiligen Zweck erforderlich sind. Die Funktion der Template-basierten Bearbeitung unterstützt dieses Prinzip, indem sie potenziell den Zugriff auf nicht benötigte Felder für bestimmte Aufgaben einschränkt.   
De-Identifizierung/Anonymisierung: Werden HL7-Daten für sekundäre Zwecke wie Tests, Analysen oder Forschung verwendet, müssen zuverlässige Verfahren zur De-Identifizierung oder Pseudonymisierung angewendet werden, um die Privatsphäre der Patienten zu schützen.   
Eingabevalidierung: Eingabedaten sollten nicht nur auf HL7-Konformität, sondern auch auf potenzielle Sicherheitsrisiken (z.B. Injection-Angriffe, obwohl bei strukturiertem HL7-Parsing weniger wahrscheinlich als bei Web-Formularen) validiert werden.   
Einwilligungsmanagement (Consent): Auch wenn die Anwendung selbst möglicherweise kein Consent-Management durchführt, operiert sie in einem Ökosystem, in dem die Einwilligung des Patienten von größter Bedeutung ist. Die Datenverarbeitung innerhalb der Anwendung muss mit den geltenden Einwilligungsrichtlinien übereinstimmen.   
Die Berücksichtigung von Sicherheit und Compliance von Anfang an beeinflusst Architekturentscheidungen (z.B. die durch MVVM geförderte Trennung), die Auswahl von Bibliotheken und das Design von Funktionen wie der Template-basierten Bearbeitung. Ein Parser, der tolerant gegenüber Fehlern ist, kann Abstürze verhindern, während granulare Zugriffskontrollen und detaillierte Audits grundlegende regulatorische Anforderungen erfüllen.   

IV. Empfohlene Software-Architektur (Windows Desktop)
Für die Entwicklung einer modernen, wartbaren und testbaren Windows-Desktop-Anwendung zur HL7-Verwaltung wird die Verwendung des Model-View-ViewModel (MVVM)-Architekturmusters in Kombination mit dem Windows Presentation Foundation (WPF)-Framework empfohlen.

A. Argumente für Model-View-ViewModel (MVVM) mit WPF
Kontext: Die Anforderung ist eine Windows-Desktop-Anwendung. WPF ist Microsofts aktuelles Framework für die Erstellung grafisch anspruchsvoller Windows-Benutzeroberflächen und bietet native Unterstützung für Konzepte, die MVVM begünstigen.
MVVM-Muster: MVVM ist ein Software-Architekturmuster, das speziell entwickelt wurde, um die Benutzeroberfläche (View) von der Präsentationslogik und dem Zustand (ViewModel) sowie den Daten und der Geschäftslogik (Model) zu trennen. Es wurde von Microsoft-Architekten entwickelt und ist besonders gut für XAML-basierte Plattformen wie WPF geeignet.   
Vorteile von MVVM:
Trennung der Belange (Separation of Concerns): Klare Trennung von UI (View), Präsentationslogik/Zustand (ViewModel) und Daten/Geschäftslogik (Model).   
Testbarkeit: ViewModels und Models können unabhängig von der UI durch Unit-Tests überprüft werden, was die Codequalität und Zuverlässigkeit erhöht – ein kritischer Faktor für Anwendungen im Gesundheitswesen.   
Wartbarkeit & Erweiterbarkeit: Änderungen an der UI (View) haben minimale Auswirkungen auf die Logik (ViewModel/Model) und umgekehrt. Dies erleichtert die Verwaltung komplexer Anwendungen und deren Weiterentwicklung.   
Zusammenarbeit im Team: UI-Designer (die an XAML-Views arbeiten) und Entwickler (die an C#-ViewModels/Models arbeiten) können unabhängiger voneinander arbeiten.   
Wiederverwendbarkeit von Code: ViewModels und Models können potenziell wiederverwendet werden.   
Datenbindung: Nutzt das leistungsstarke Datenbindungssystem von WPF, was den Code für UI-Aktualisierungen reduziert und die Entwicklung vereinfacht.   
B. Kernkomponenten der Architektur
View: (WPF Windows/UserControls, definiert in XAML) Verantwortlich für die Struktur, das Layout und das Erscheinungsbild der Benutzeroberfläche. Enthält idealerweise minimalen Code-Behind, der sich auf rein visuelle Aspekte beschränkt (z.B. Animationen, komplexe Steuerelement-Interaktionen, die nicht einfach über Bindung/Commands abgebildet werden können). Die View bindet an Eigenschaften und Befehle (Commands) des ViewModels. Sie kennt das ViewModel, aber nicht das Model.   
ViewModel: (C#-Klassen, implementieren INotifyPropertyChanged) Fungiert als Vermittler zwischen View und Model. Stellt Daten aus dem Model über öffentliche Eigenschaften für die View bereit. Stellt Aktionen über Commands (die ICommand implementieren) bereit, die von der View ausgelöst werden können. Enthält die Präsentationslogik (z.B. Formatierung von Daten für die Anzeige, Verwaltung des UI-Zustands wie IsBusy oder IsConnected ) und den Zustand der View. Verarbeitet Benutzerinteraktionen, die von der View weitergeleitet werden (über Command-Bindungen oder Event-zu-Command-Mechanismen), und interagiert mit dem Model oder Service-Layern. Kennt das Model, aber nicht die View. Löst PropertyChanged-Ereignisse aus, um die View über Zustandsänderungen zu informieren.   
Model: (C#-Klassen, oft POCOs - Plain Old CLR Objects) Repräsentiert die Daten der Anwendung (z.B. das geparste HL7-Nachrichtenobjekt, Template-Definitionen) und die Geschäftslogik (z.B. HL7-Validierungsregeln, Logik zur Datenpersistenz). Hat keine Kenntnis von ViewModel oder View. Interagiert möglicherweise mit Datenzugriffsschichten (Repositories) oder Diensten.   
HL7 Service/Repository Layer (Implizit): Eine dedizierte Schicht, die für die Interaktion mit der HL7-Bibliothek (z.B. NHapi) verantwortlich ist. Sie kapselt das Parsen, Validieren, Generieren und potenziell die Persistenz von HL7-Nachrichten. Das ViewModel interagiert mit dieser Schicht, um HL7-Daten zu laden, zu speichern und zu verarbeiten, wodurch das ViewModel von direkten Bibliotheksabhängigkeiten entkoppelt wird.
Template Service/Repository Layer (Implizit): Eine Schicht, die für das Laden, Speichern und Verwalten der Templates zur Feld-Editierbarkeit verantwortlich ist.
C. MVVM-Interaktionen
Datenfluss: Model -> ViewModel -> View (zur Anzeige). View -> ViewModel -> Model (für Aktualisierungen/Aktionen).
Datenbindung: WPFs Datenbindung verbindet UI-Elemente in der View (z.B. TextBox.Text, Button.IsEnabled, ItemsControl.ItemsSource) direkt mit Eigenschaften im ViewModel. Die Bindungsmodi (OneWay, TwoWay, OneTime, OneWayToSource) steuern die Richtung des Datenflusses. TwoWay-Bindung ist typisch für bearbeitbare Felder.   
Commands: Commands (Implementierungen von ICommand, oft als RelayCommand oder DelegateCommand ) im ViewModel behandeln Benutzeraktionen (z.B. Button-Klicks), die in der View ausgelöst werden. Die CanExecute-Methode eines Commands bestimmt, ob die Aktion aktuell ausgeführt werden kann, und wird oft verwendet, um die IsEnabled-Eigenschaft von UI-Steuerelementen zu steuern.   
Benachrichtigungen: Die Implementierung von INotifyPropertyChanged im ViewModel ist entscheidend, damit die View automatisch auf Datenänderungen im ViewModel reagiert. Für Sammlungen, deren Änderungen (Hinzufügen/Entfernen von Elementen) sich in der UI widerspiegeln sollen, wird typischerweise ObservableCollection<T> verwendet, da diese INotifyCollectionChanged implementiert.   
MVVM eignet sich besonders gut für diese Anwendung, da es hilft, die inhärente Komplexität sowohl der HL7-Datenstrukturen als auch der dynamischen UI-Anforderungen (Template-basierte Bearbeitung) zu bewältigen. HL7-Nachrichten können komplexe, verschachtelte Strukturen (insbesondere ORU ) und eine Vielzahl von Feldern aufweisen. Eine direkte Bindung von UI-Steuerelementen an ein rohes HL7-Objektmodell wäre schwierig und würde die View eng an die Implementierung der HL7-Bibliothek koppeln. MVVM führt das ViewModel als Vermittler ein. Das ViewModel kann die HL7-Daten (über die Model-/Service-Schicht) abrufen, verarbeiten und als sauberere, für die View geeignete Eigenschaften oder Sammlungen bereitstellen (z.B. durch Abflachen von Hierarchieteilen, Formatieren von Daten). Es kann auch die Logik zur Anwendung der Editierbarkeits-Templates kapseln und einfache boolesche Eigenschaften (z.B. IsPatientNameEditable) bereitstellen, an die die IsEnabled- oder IsReadOnly-Eigenschaften der View-Steuerelemente gebunden werden. Dies hält die View einfach und auf die Präsentation fokussiert.   

V. Technologie-Stack-Empfehlung und Evaluierung
Basierend auf den Anforderungen und der empfohlenen Architektur wird folgender Technologie-Stack vorgeschlagen:

A. Sprache und Framework: C# mit.NET und WPF
Begründung:
Plattform: Erfüllt die Anforderung "Windows-Anwendung".
Sprache: C# ist eine moderne, objektorientierte Sprache mit starker Typisierung, die sich gut für komplexe Geschäftsanwendungen eignet. Das umfangreiche.NET-Ökosystem bietet breite Unterstützung.
Framework:.NET (inkl..NET 6/7/8+) bietet eine leistungsfähige Laufzeitumgebung, umfangreiche Basisklassenbibliotheken und exzellente Entwicklungswerkzeuge (Visual Studio).
UI-Framework: WPF ist die bevorzugte Wahl für Rich-Client-Windows-Anwendungen im.NET-Umfeld. Seine Stärken liegen in der flexiblen UI-Gestaltung mittels XAML, dem leistungsstarken Datenbindungssystem, Styling- und Templating-Fähigkeiten, die für die benutzerdefinierte Bearbeitung und Darstellung von HL7-Daten unerlässlich sind. WPF harmoniert hervorragend mit dem MVVM-Muster.   
Verfügbarkeit von HL7-Bibliotheken: Für C#/.NET existieren etablierte HL7-Bibliotheken, allen voran NHapi.   
Alternativen (kurz betrachtet):
Java mit Swing/JavaFX: Technisch möglich, da die HAPI-Bibliothek für Java sehr ausgereift ist. Allerdings ist die Entwicklung einer reinen Windows-Desktop-Anwendung mit Java weniger idiomatisch als mit C#/.NET/WPF.   
Python mit Qt/Tkinter: Ebenfalls möglich, Bibliotheken wie hl7apy sind verfügbar. Python wird jedoch seltener für komplexe, grafisch anspruchsvolle Windows-Desktop-Anwendungen eingesetzt als.NET. Die Integration der UI-Frameworks könnte sich weniger nahtlos anfühlen.   
B. Vertiefung HL7-Bibliothek: NHapi für.NET
Überblick: NHapi ist ein etabliertes Open-Source-Projekt und ein Port der weit verbreiteten Java HAPI-Bibliothek für das.NET-Framework. Sein Hauptziel ist die Bereitstellung eines Objektmodells für die Arbeit mit HL7 v2.x Nachrichten. Es unterstützt eine breite Palette von HL7-Versionen, einschließlich der geforderten Version 2.3.   
Kernfunktionen:
Parsen: Kann HL7-Nachrichten im traditionellen Pipe-Delimited-Format (ER7) sowie im XML-Format in ein C#-Objektmodell parsen. Stellt dafür Klassen wie PipeParser und DefaultXMLParser bereit.   
Kodieren/Generieren: Kann das C#-Objektmodell zurück in das Pipe-Delimited- oder XML-Format serialisieren.   
Objektmodell: Bietet stark typisierte Klassen, die HL7-Nachrichten, Segmente, Gruppen und Felder für spezifische HL7-Versionen repräsentieren (z.B. NHapi.Model.V23.Message.ADT_A01, NHapi.Model.V23.Segment.PID). Dies erleichtert den Zugriff auf und die Manipulation von Nachrichtendaten erheblich.   
Validierung: Bietet ein Validierungsframework über die Schnittstelle IValidationContext. Allerdings ist die Implementierung spezifischer Regeln (über grundlegende Parsing-Prüfungen hinaus) dem Entwickler überlassen. Eine eingebaute Validierung gegen Konformitätsprofile scheint zu fehlen. Die Begleitbibliothek NHapiTools erweitert die Validierungsfähigkeiten durch regelbasierte Ansätze. Strukturelle Probleme können manchmal über die ExtraComponent-Eigenschaft erkannt werden.   
Benutzerdefinierte Segmente (Z-Segmente): Unterstützt die Verarbeitung von Z-Segmenten durch Erweiterung des Objektmodells. NHapiTools bietet mit dem GenericMessageWrapper eine alternative Herangehensweise.   
NHapiTools: Es wird empfohlen, die Begleitbibliothek NHapiTools  zu verwenden. Sie bietet nützliche Erweiterungsmethoden, die den Umgang mit Wiederholungen vereinfachen (GetAllXXXRecords, AddXXX), sowie erweiterte Validierungskontexte (AutomatedContext, ConfigurableContext) und vordefinierte Standardvalidierungsregeln.   
Einschränkungen: NHapi enthält keine eingebaute Netzwerkfunktionalität für Protokolle wie MLLP (Minimal Lower Layer Protocol), das häufig für den HL7-Transport über TCP/IP verwendet wird. Die Basisvalidierung ist begrenzt; für anspruchsvollere Szenarien (insbesondere Profilvalidierung) sind benutzerdefinierte Regeln oder die Nutzung von NHapiTools erforderlich.   
Andere Bibliotheken: Alternativen wie HL7-V2  sind verfügbar, bieten aber als leichtgewichtige Parser/Composer einen geringeren Funktionsumfang als NHapi. Allgemeine Textparser wie der ComponentOne TextParser  erfordern die Definition eigener Templates für die HL7-Struktur.   
Die Wahl von NHapi (mit NHapiTools) bietet eine solide Grundlage für das Parsen, Generieren und den objektorientierten Zugriff auf HL7-Daten. Das Entwicklungsteam muss jedoch berücksichtigen, dass Aufwand für die Implementierung der spezifischen Validierungslogik (insbesondere für Profil- und Geschäftsregeln) und potenziell für die MLLP-Kommunikationsschicht eingeplant werden muss, da diese nicht "out-of-the-box" vollständig bereitgestellt werden. Die Stärke von NHapi liegt im Parsing und der Modellierung, während die Validierungs- und Kommunikationsaspekte zusätzliche Entwicklungsarbeit erfordern.   
Tabelle: Vergleich von C# HL7-Bibliotheken:
Feature	NHapi (+NHapiTools)	HL7-V2 	Andere (z.B. C1 TextParser )
Parsen/Kodieren	Umfassend (Pipe, XML) 	Leichtgewichtige Implementierung	Template-basiert, generisch
Objektmodell	Stark typisiert, versionsspezifisch 	Minimalistisch	Keins (erfordert eigene Logik)
HL7 v2.3 Unterstützung	Ja 	Ja (versionsunabhängig)	Ja (über Template)
Validierung	Basis-Syntax; Erweitert über IValidationContext/NHapiTools 	Keine integrierte Validierung	Keine integrierte HL7-Validierung
Z-Segment Handling	Ja (Modell-Erweiterung, NHapiTools Wrapper) 	Ja (als generische Segmente)	Ja (über Template)
Community/Reife	Etabliert, Open Source 	Neuer, weniger verbreitet	Abhängig vom Anbieter
Netzwerk (MLLP)	Nein 	Nein	Nein
  
C. Kernoperationen mit NHapi (Codebeispiele C#)
Die folgenden Beispiele illustrieren grundlegende Operationen mit NHapi und NHapiTools. Fehlerbehandlung (try-catch Blöcke) ist aus Gründen der Übersichtlichkeit teilweise weggelassen, aber in einer Produktionsanwendung unerlässlich.

Setup:

C#

// NuGet Pakete installieren: NHapi, NHapiTools
using NHapi.Base.Parser;
using NHapi.Base.Model;
using NHapi.Model.V23.Message;
using NHapi.Model.V23.Segment;
using NHapiTools.Base.Parser; // Für EnhancedModelClassFactory etc.
using NHapiTools.Base.Validation; // Für Validation Contexts
using System;
using System.Linq; // Für LINQ-Operationen
Parsen einer ADT_A01 Nachricht:

C#

string hl7MessageString = "MSH|^~\\&|SendingApp|SendingFac|ReceivingApp|ReceivingFac|202301011200||ADT^A01|MSG00001|P|2.3\r" +
                          "EVN|A01|202301011200\r" +
                          "PID|1||12345^^^MRN|ALT_ID^^^OTHER_ID|Doe^John^^^Mr.||19800101|M|||123 Main St^^Anytown^CA^90210||(555)555-1212|||S||ACCT1234|987654321\r" +
                          "PV1|1|I|Emergency^^^ED|A|||101^Smith^John^Dr.|||SUR|||||ADM123|202301011200\r";

// PipeParser verwenden (ggf. mit EnhancedModelClassFactory für Z-Segmente)
var parser = new PipeParser();
IMessage? parsedMessage = null;

try
{
    parsedMessage = parser.Parse(hl7MessageString);

    // Auf spezifischen Nachrichtentyp casten
    if (parsedMessage is ADT_A01 adtA01)
    {
        // Zugriff auf MSH-Felder
        string sendingApp = adtA01.MSH.SendingApplication.NamespaceID.Value;
        string messageType = adtA01.MSH.MessageType.MessageType.Value; // "ADT"
        string triggerEvent = adtA01.MSH.MessageType.TriggerEvent.Value; // "A01"
        Console.WriteLine($"Geparste Nachricht: {messageType}^{triggerEvent} von {sendingApp}");

        // Zugriff auf PID-Felder (Patientenname)
        // PID-5 ist wiederholbar, daher Zugriff auf die erste Wiederholung (Index 0)
        string familyName = adtA01.PID.GetPatientName(0).FamilyLastName.FamilyName.Value; // "Doe"
        string givenName = adtA01.PID.GetPatientName(0).GivenName.Value; // "John"
        Console.WriteLine($"Patient: {givenName} {familyName}");

        // Zugriff auf PV1-Feld (Patientenklasse)
        string patientClass = adtA01.PV1.PatientClass.Value; // "I" (Inpatient)
        Console.WriteLine($"Patientenklasse: {patientClass}");
    }
    else
    {
        Console.WriteLine("Nachricht ist keine ADT_A01.");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"Fehler beim Parsen: {ex.Message}");
    // Detailliertere Fehlerbehandlung hier
}
   

Erstellen einer neuen ADT_A04 Nachricht:

C#

try
{
    var adtA04 = new ADT_A04(); // Nachrichtobjekt erstellen

    // MSH-Segment füllen (Beispielwerte)
    adtA04.MSH.SendingApplication.NamespaceID.Value = "MyHL7App";
    adtA04.MSH.SendingFacility.NamespaceID.Value = "MyFacility";
    adtA04.MSH.ReceivingApplication.NamespaceID.Value = "TargetApp";
    adtA04.MSH.ReceivingFacility.NamespaceID.Value = "TargetFac";
    adtA04.MSH.DateTimeOfMessage.TimeOfAnEvent.SetLongDateWithSecond(DateTime.Now);
    adtA04.MSH.MessageType.MessageType.Value = "ADT";
    adtA04.MSH.MessageType.TriggerEvent.Value = "A04"; // Register Patient
    adtA04.MSH.MessageControlID.Value = Guid.NewGuid().ToString().Substring(0, 20); // Eindeutige ID
    adtA04.MSH.ProcessingID.ProcessingID.Value = "P"; // Production
    adtA04.MSH.VersionID.VersionID.Value = "2.3";
    adtA04.MSH.EncodingCharacters.Value = @"^~\&"; // Standard-Trennzeichen
    adtA04.MSH.FieldSeparator.Value = "|";

    // EVN-Segment füllen
    adtA04.EVN.EventTypeCode.Value = "A04";
    adtA04.EVN.RecordedDateTime.TimeOfAnEvent.SetLongDateWithSecond(DateTime.Now);

    // PID-Segment füllen
    adtA04.PID.SetIDPatientID.Value = "1";
    adtA04.PID.GetPatientIdentifierList(0).ID.Value = "REG99999";
    adtA04.PID.GetPatientIdentifierList(0).AssigningAuthority.NamespaceID.Value = "MRN";
    adtA04.PID.GetPatientName(0).FamilyLastName.FamilyName.Value = "Mustermann";
    adtA04.PID.GetPatientName(0).GivenName.Value = "Max";
    adtA04.PID.DateTimeOfBirth.TimeOfAnEvent.SetDate(new DateTime(1990, 5, 15));
    adtA04.PID.AdministrativeSex.Value = "M";

    // PV1-Segment füllen
    adtA04.PV1.SetIDPatientVisit.Value = "1";
    adtA04.PV1.PatientClass.Value = "O"; // Outpatient
    adtA04.PV1.AssignedPatientLocation.PointOfCare.Value = "REG"; // Registration Desk

    // Nachricht kodieren
    var parser = new PipeParser();
    string encodedMessage = parser.Encode(adtA04);

    Console.WriteLine("Erstellte ADT_A04 Nachricht:");
    Console.WriteLine(encodedMessage.Replace("\r", "\n")); // Bessere Lesbarkeit in Konsole
}
catch (Exception ex)
{
    Console.WriteLine($"Fehler beim Erstellen der Nachricht: {ex.Message}");
}
   

Bearbeiten einer bestehenden Nachricht (z.B. ADT_A08 - Geschlecht ändern):

C#

string existingAdtA08String = "MSH|^~\\&|SourceApp|SourceFac|TargetApp|TargetFac|202301021000||ADT^A08|MSG00002|P|2.3\r" +
                              "EVN|A08|202301021000\r" +
                              "PID|1||12345^^^MRN||Doe^Jane^^^Ms.||19850202|F|||123 Main St^^Anytown^CA^90210||||||ACCT5678|987654322\r" +
                              "PV1|1|O|REG^^^Registration||||||||||||||ADM456|202301021000\r";

var parser = new PipeParser();
try
{
    IMessage message = parser.Parse(existingAdtA08String);
    if (message is ADT_A08 adtA08)
    {
        // Aktuellen Wert lesen
        string currentSex = adtA08.PID.AdministrativeSex.Value;
        Console.WriteLine($"Aktuelles Geschlecht (PID-8): {currentSex}");

        // Wert ändern
        adtA08.PID.AdministrativeSex.Value = "U"; // Auf 'Unknown' ändern
        Console.WriteLine($"Neues Geschlecht (PID-8): {adtA08.PID.AdministrativeSex.Value}");

        // Modifizierte Nachricht kodieren
        string modifiedMessage = parser.Encode(adtA08);
        Console.WriteLine("\nModifizierte Nachricht:");
        Console.WriteLine(modifiedMessage.Replace("\r", "\n"));
    }
}
catch (Exception ex)
{
    Console.WriteLine($"Fehler beim Bearbeiten: {ex.Message}");
}
   

Validierung (Konzeptuelles Beispiel mit NHapiTools):

C#

// 1. Definiere eine benutzerdefinierte Regel (Beispiel: PID-5 muss vorhanden sein in ADT_A01)
public class Pid5MandatoryRule : ISpecificMessageRule
{
    public string GetVersions() => new { "2.3" };
    public string GetMessageTypes() => new { "ADT" };
    public string GetTriggerEvents() => new { "A01" };

    public ValidationException Test(IMessage message)
    {
        var exceptions = new List<ValidationException>();
        if (message is ADT_A01 adtA01)
        {
            // Prüfe, ob PID-5 (Patient Name) vorhanden und nicht leer ist
            if (adtA01.PID.GetPatientName().Length == 0 ||
                string.IsNullOrEmpty(adtA01.PID.GetPatientName(0).FamilyLastName.FamilyName.Value))
            {
                exceptions.Add(new ValidationException("PID-5 (Patient Name) ist erforderlich für ADT_A01.", ValidationException.ErrorSeverity.ERROR));
            }
        }
        return exceptions.ToArray();
    }
}

// 2. Konfiguriere den Parser mit einem ValidationContext, der die Regel verwendet
//    (Hier mit AutomatedContext, der Regeln aus der Assembly lädt - Konfiguration in app.config nötig)
//    Alternativ: ConfigurableContext oder manuelles Hinzufügen von Regeln zu DefaultValidationContext.

// Annahme: Die Regel Pid5MandatoryRule ist in der Assembly definiert,
// die in app.config unter "NHapiRulesNamespace" konfiguriert ist.
var parserWithValidation = new PipeParser();
var validationContext = new AutomatedContext(parserWithValidation.ValidationContext);
parserWithValidation.ValidationContext = validationContext;

// 3. Parsen und Validieren
string messageToValidate = "MSH|^~\\&|App|Fac|App|Fac|202301031100||ADT^A01|MSG00003|P|2.3\r" +
                           "EVN|A01|202301031100\r" +
                           "PID|1||12346^^^MRN||||19750303|M\r" + // PID-5 fehlt!
                           "PV1|1|I|SomeWard\r";
try
{
    IMessage validatedMessage = parserWithValidation.Parse(messageToValidate);
    Console.WriteLine("Nachricht erfolgreich geparst (aber möglicherweise Validierungsfehler gefunden).");
    // Hier könnten Validierungsfehler im Context protokolliert/abgefragt werden,
    // abhängig von der genauen Implementierung des Contexts.
    // NHapi wirft nicht unbedingt Exceptions für Regelverletzungen,
    // diese müssen oft aktiv abgefragt werden.
}
catch (HL7Exception hl7Ex) // Fängt primär Parsing-Fehler
{
    Console.WriteLine($"HL7 Parsing Fehler: {hl7Ex.Message}");
}
catch (Exception ex) // Andere Fehler
{
     Console.WriteLine($"Allgemeiner Fehler: {ex.Message}");
}
 (Konzept basiert auf diesen Quellen)   

VI. Implementierung der Template-basierten Feldbearbeitbarkeit
Ein Kernmerkmal der Anwendung ist die Möglichkeit, die Bearbeitbarkeit von HL7-Feldern basierend auf extern definierten Templates zu steuern. Dies erfordert ein durchdachtes Design sowohl für die Template-Struktur als auch für die Implementierung in der WPF/MVVM-Architektur.

A. Konzeptionelles Design
Anforderung: Die Anwendung muss zwei Bearbeitungsmodi unterstützen: "Alle Felder bearbeiten" und "Template-basiert bearbeiten". Im Template-Modus sollen nur die Felder editierbar sein, die in einer ausgewählten Vorlagendatei explizit als bearbeitbar gekennzeichnet sind.
Template-Definition: Es muss ein Format für die Vorlagedateien definiert werden. XML oder JSON sind gängige Wahlmöglichkeiten, da sie strukturiert und gut parsbar sind. Jedes Template muss mindestens folgende Informationen enthalten:
Ziel-Nachrichtentyp und -Version: Um sicherzustellen, dass das Template zur geladenen Nachricht passt (z.B. ADT_A01, Version 2.3).
Liste der bearbeitbaren Felder: Eine Auflistung der Felder, die im Template-Modus bearbeitet werden dürfen.
Feldidentifikation: Eine eindeutige Methode zur Identifizierung der Felder. Die HL7-Pfadnotation (z.B. PID-5.1 für die erste Komponente des fünften Feldes im PID-Segment) ist hierfür gut geeignet. Es muss berücksichtigt werden, wie wiederholte Segmente oder Felder adressiert werden (z.B. NK1(2)-2 für das zweite Feld der zweiten NK1-Wiederholung oder OBX(1)-5 für das fünfte Feld der ersten OBX-Wiederholung).
Anwendungslogik:
Laden der HL7-Nachricht (z.B. aus einer Datei).
Wenn der Template-Modus aktiv ist: Laden der passenden Template-Datei (basierend auf Nachrichtentyp/Version).
Beim Anzeigen der Nachricht in der Benutzeroberfläche (View): Für jedes UI-Steuerelement, das ein HL7-Feld repräsentiert, muss der Bearbeitbarkeitsstatus (aktiviert/deaktiviert oder lesend/schreibend) bestimmt werden.
Im Modus "Alle Felder bearbeiten": Alle Steuerelemente sind bearbeitbar.
Im Modus "Template-basiert": Prüfen, ob der HL7-Pfad des Feldes in der Liste der bearbeitbaren Felder des geladenen Templates enthalten ist. Setzen der Bearbeitbarkeit des UI-Steuerelements entsprechend.
B. WPF/MVVM Implementierungstechniken
Rolle des ViewModels: Das ViewModel ist zentral für die Implementierung. Es hält:
Die geparsten HL7-Nachrichtendaten (idealerweise als eigene ViewModel-Klassen oder Wrapper um das NHapi-Objekt, um Entkopplung zu erreichen).
Die geladene Template-Definition (wenn im Template-Modus).
Den aktuellen Bearbeitungsmodus ("Alle" oder "Template").
Logik zur Bestimmung der Editierbarkeit (IsFieldEditable(string hl7Path)).
Öffentliche Eigenschaften, an die die View bindet. Dies schließt sowohl die Datenfelder selbst als auch boolesche Eigenschaften für die Editierbarkeit jedes Feldes ein (z.B. IsPatientLastNameEditable).
Datenrepräsentation im ViewModel: Um die HL7-Daten bindbar zu machen, gibt es Optionen:
Option 1: Direkte Verwendung oder Kapselung des NHapi-Nachrichtenobjekts. Einfacher Start, aber koppelt das ViewModel an NHapi.
Option 2: Mapping des NHapi-Objekts auf dedizierte ViewModel-Klassen (POCOs). Mehr Aufwand, aber bessere Trennung und Flexibilität. Empfohlen für komplexe UI-Darstellungen.
Unabhängig von der Wahl muss eine Zuordnung zwischen UI-Steuerelementen und den HL7-Feldpfaden hergestellt werden (z.B. über Konventionen bei Eigenschaftsnamen, Tag-Eigenschaften der Controls oder Attached Properties).
Bestimmung der Editierbarkeit im ViewModel:
Das ViewModel implementiert die Logik, z.B. eine Methode private bool GetEditState(string hl7Path). Diese prüft den aktuellen Modus. Wenn "Template", schlägt sie im geladenen Template nach, ob hl7Path als editierbar markiert ist.
Für jedes relevante Feld wird eine boolesche Eigenschaft im ViewModel bereitgestellt, z.B.:
C#

private bool _isPid5_1Editable;
public bool IsPid5_1Editable
{
    get => _isPid5_1Editable;
    set => SetProperty(ref _isPid5_1Editable, value); // SetProperty implementiert INotifyPropertyChanged
}

// Methode zum Aktualisieren aller Editierbarkeits-Flags
private void UpdateEditability()
{
    IsPid5_1Editable = GetEditState("PID-5.1");
    IsPid8Editable = GetEditState("PID-8");
    //... für alle anderen Felder
}
UpdateEditability() wird aufgerufen, wenn die Nachricht geladen wird oder wenn der Modus/das Template wechselt. INotifyPropertyChanged stellt sicher, dass die UI aktualisiert wird.
Bindung der Editierbarkeit in der View (XAML):
Die IsEnabled- oder IsReadOnly-Eigenschaft von UI-Steuerelementen wird an die entsprechenden booleschen Eigenschaften im ViewModel gebunden. IsReadOnly ist oft besser geeignet für Textboxen, da der Inhalt sichtbar bleibt, aber nicht geändert werden kann. IsEnabled deaktiviert das Steuerelement komplett.
XML

<TextBox Text="{Binding PatientLastName}" IsReadOnly="{Binding IsPid5_1ReadOnly}" />
<ComboBox ItemsSource="{Binding GenderOptions}" SelectedItem="{Binding PatientGender}" IsEnabled="{Binding IsPid8Editable}" />
  
Konverter (z.B. BooleanToVisibilityConverter) oder DataTriggers in Styles können verwendet werden, um Steuerelemente basierend auf der Editierbarkeit ein- oder auszublenden.   
Handhabung wiederholter Segmente/Felder (z.B. OBX in ORU):
Verwendung von ItemsControl, ListBox oder DataGrid in der View, deren ItemsSource an eine ObservableCollection<T> im ViewModel gebunden ist (z.B. ObservableCollection<ObservationViewModel>).   
Jedes Element in der Collection (z.B. ObservationViewModel) repräsentiert eine Wiederholung und stellt Eigenschaften für die Felder dieser Wiederholung bereit (z.B. Value, Units) sowie eine Eigenschaft für deren Editierbarkeit (z.B. IsValueEditable).
Ein DataTemplate wird verwendet, um die UI für eine einzelne Wiederholung zu definieren. Die Steuerelemente innerhalb des DataTemplate binden an die Eigenschaften des Item-ViewModels (ObservationViewModel).
XML

 <ListBox ItemsSource="{Binding Observations}">
     <ListBox.ItemTemplate>
         <DataTemplate DataType="{x:Type local:ObservationViewModel}">
             <StackPanel Orientation="Horizontal">
                 <TextBlock Text="{Binding Identifier}" Margin="5"/>
                 <TextBox Text="{Binding Value, Mode=TwoWay, UpdateSourceTrigger=PropertyChanged}"
                          IsReadOnly="{Binding IsValueReadOnly}" Width="150" Margin="5"/>
                 <TextBlock Text="{Binding Units}" Margin="5"/>
             </StackPanel>
         </DataTemplate>
     </ListBox.ItemTemplate>
 </ListBox>
  
Dynamische Views mit DataTemplates: Obwohl die Hauptanforderung die Editierbarkeit ist, könnten fortgeschrittenere Techniken wie DataTemplateSelector  oder DataTriggers innerhalb von DataTemplates  genutzt werden, um das visuelle Erscheinungsbild von Feldern basierend auf ihrem Editierbarkeitsstatus oder Datentyp dynamisch zu ändern (z.B. grauer Hintergrund für schreibgeschützte Felder). Ein ControlTemplate definiert dabei das grundlegende Aussehen eines Steuerelements.   
TemplateBinding: Der Begriff TemplateBinding  bezieht sich primär auf Bindungen innerhalb eines ControlTemplate an Eigenschaften des Steuerelements, das getemplated wird. Für die Bindung von UI-Steuerelementen an ViewModel-Eigenschaften zur Steuerung der Editierbarkeit wird die normale WPF Binding-Syntax verwendet.   
C. Beispielhaftes Template-Schema (XML)
Ein einfaches XML-Format könnte wie folgt aussehen:

XML

<?xml version="1.0" encoding="utf-8"?>
<Hl7EditTemplate TargetMessage="ADT_A01" TargetVersion="2.3" Name="Standard Aufnahme Edit">
  <Description>Erlaubt die Bearbeitung grundlegender demografischer Daten und des aufnehmenden Arztes bei einer Aufnahme.</Description>
  <EditableFields>
    <Field Path="PID-3(1).1" Description="Patient ID (MRN)" /> <Field Path="PID-5.1" Description="Patient Nachname" />
    <Field Path="PID-5.2" Description="Patient Vorname" />
    <Field Path="PID-7" Description="Geburtsdatum" />
    <Field Path="PID-8" Description="Administratives Geschlecht" />
    <Field Path="PID-11.1" Description="Straße" />
    <Field Path="PID-11.3" Description="Stadt" />
    <Field Path="PID-11.4" Description="Bundesland/Kanton" />
    <Field Path="PID-11.5" Description="PLZ" />
    <Field Path="PID-13.1" Description="Telefon (Privat)" />

    <Field Path="PV1-7.1" Description="Aufnehmender Arzt - ID" />
    <Field Path="PV1-7.2" Description="Aufnehmender Arzt - Nachname" />
    <Field Path="PV1-7.3" Description="Aufnehmender Arzt - Vorname" />
    <Field Path="PV1-19" Description="Besuchsnummer" />

    <Field Path="NK1(1)-2.1" Description="Angehöriger 1 - Nachname" />
    <Field Path="NK1(1)-2.2" Description="Angehöriger 1 - Vorname" />
    <Field Path="NK1(1)-3.1" Description="Beziehung zum Patienten (Code)" />
  </EditableFields>
</Hl7EditTemplate>
(Anmerkung: Die Pfad-Syntax für Wiederholungen (z.B. NK1(1)-2.1) muss konsistent implementiert werden.)

Die Template-Definitionen sollten extern zur Anwendung gespeichert werden (z.B. als separate XML- oder JSON-Dateien). Dies ermöglicht es, Templates zu erstellen, zu ändern und zu verwalten, ohne die Anwendung neu kompilieren zu müssen. Dies ist entscheidend für die Flexibilität, da sich Workflows oder Anforderungen von Schnittstellenpartnern ändern können. Die Anwendung benötigt lediglich einen Mechanismus zum Laden und Parsen dieser externen Dateien und zum Anwenden der darin enthaltenen Regeln. Dies verbessert die Wartbarkeit und Anpassungsfähigkeit der Anwendung erheblich.

VII. Beispielhafter agiler Entwicklungsplan
Für die Entwicklung der HL7-Verwaltungsanwendung wird ein agiles Vorgehen nach dem Scrum-Framework empfohlen. Dies ermöglicht Flexibilität, frühes Feedback und eine iterative Auslieferung von Funktionalität.

A. Methodik
Framework: Scrum.   
Sprints: Feste Iterationslängen, z.B. 2 Wochen.   
Artefakte:
Product Backlog: Eine priorisierte Liste aller Anforderungen (Features, User Stories), verwaltet vom Product Owner.   
Sprint Backlog: Die für einen Sprint ausgewählten Product Backlog Items, die das Sprint-Ziel erfüllen.   
Inkrement: Das potenziell auslieferbare Produkt-Inkrement am Ende jedes Sprints.
Zeremonien:
Sprint Planning: Zu Beginn jedes Sprints; das Team plant, welche Arbeit erledigt wird und wie. Input ist das Product Backlog und die Kapazität des Teams. Output ist das Sprint Goal und das Sprint Backlog.   
Daily Scrum: Tägliches kurzes Meeting (Stand-up) zur Synchronisation des Teams.   
Sprint Review: Am Ende des Sprints; Präsentation des Inkrements für Stakeholder und Einholung von Feedback.   
Sprint Retrospective: Am Ende des Sprints; Reflexion des Teams über den Prozess und Identifikation von Verbesserungsmöglichkeiten.   
B. Projektphasenübersicht (Beispiel)
Die Entwicklung könnte grob in folgende Phasen unterteilt werden, die sich über mehrere Sprints erstrecken:

Phase 1: Fundament & Kern-Parsing (Sprints 1-3): Projekt-Setup, Definition der MVVM-Architektur, Erstellung des grundlegenden UI-Shells, Implementierung des HL7-Parsings (NHapi) für ADT, MDM und ORU, Anzeige der rohen Nachrichtenstruktur.
Phase 2: Anzeige & Basis-Bearbeitung (Sprints 4-6): Entwicklung einer strukturierten, benutzerfreundlichen Ansicht der geparsten Nachrichten, Implementierung der "Alle Felder bearbeiten"-Funktionalität, grundlegende syntaktische Validierung.
Phase 3: Nachrichtenerstellung & Template-Definition (Sprints 7-9): Implementierung der UI zur Erstellung neuer Nachrichten (basierend auf Eingaben), Definition der Template-Struktur (z.B. XML-Schema), Implementierung des Ladens und Speicherns von Templates.
Phase 4: Template-basierte Bearbeitung & Erweiterte Validierung (Sprints 10-12): Implementierung der Logik zur Steuerung der Feld-Editierbarkeit basierend auf Templates, Aufbau des Frameworks für Profil- und Geschäftsregelvalidierung, Implementierung erster spezifischer Validierungsregeln.
Phase 5: Verfeinerung & Bereitstellung (Sprints 13+): Einarbeitung von Benutzerfeedback, Fehlerbehebung, Performance-Optimierung, Erstellung von Dokumentation, Vorbereitung der Bereitstellung (Deployment).
C. Beispielhafter Sprint-Ablauf (Erste Sprints)
Sprint 1: Projekt-Setup & Basis-Parsing
Sprint Goal: Grundstruktur des Projekts steht, MVVM-Framework ist initialisiert, eine einfache ADT_A01-Nachricht kann geparst und roh angezeigt werden.
Sprint Backlog Items (Beispiele):
User Story: Als Entwickler möchte ich die Projektmappe und Projekte (UI, Core, Tests) erstellen, damit die Codebasis organisiert ist.
User Story: Als Entwickler möchte ich ein Basis-MVVM-Framework (ViewModelBase mit INotifyPropertyChanged, einfache Navigation) implementieren, damit die Architektur etabliert ist.
User Story: Als Entwickler möchte ich die NHapi-Bibliothek integrieren, damit HL7-Nachrichten verarbeitet werden können.
User Story: Als Entwickler möchte ich einen Service implementieren, der eine ADT_A01-Nachricht parst, damit die Kernfunktionalität verfügbar ist.
User Story: Als Anwender möchte ich eine Datei auswählen und deren HL7-Segmente in einer einfachen Liste anzeigen können, um den Inhalt zu sehen.
Sprint 2: Erweitertes Parsing & Roh-Ansicht
Sprint Goal: Alle Zieldateitypen (MDM, ORU) können geparst werden, die Roh-Ansicht ist verbessert und Parsing-Fehler werden behandelt.
Sprint Backlog Items (Beispiele):
User Story: Als Entwickler möchte ich den Parsing-Service erweitern, um MDM_T02-Nachrichten zu verarbeiten.
User Story: Als Entwickler möchte ich den Parsing-Service erweitern, um ORU_R01-Nachrichten (inkl. Hierarchie) zu verarbeiten.
User Story: Als Anwender möchte ich die geparste Nachricht in einer Baumstruktur sehen (Segmente -> Felder -> Komponenten), um die Struktur besser zu verstehen.
User Story: Als Anwender möchte ich eine klare Fehlermeldung erhalten, wenn eine Nachricht nicht geparst werden kann.
Sprint 3: Strukturierte ADT-Ansicht (Read-Only)
Sprint Goal: Eine geparste ADT-Nachricht wird in einem benutzerfreundlichen, strukturierten Format (nur lesend) angezeigt.
Sprint Backlog Items (Beispiele):
User Story: Als Entwickler möchte ich ein ADTViewModel erstellen, das die relevanten Daten einer geparsten ADT-Nachricht enthält.
User Story: Als Entwickler möchte ich die geparsten ADT-Daten auf das ADTViewModel mappen.
User Story: Als UI-Designer möchte ich eine WPF-View (XAML) für die strukturierte Anzeige von ADT-Daten entwerfen (z.B. Bereiche für Patient, Besuch, Diagnosen).
User Story: Als Entwickler möchte ich die ADT-View an das ADTViewModel binden (read-only), damit die Daten angezeigt werden.
D. Beispielhafte User Stories / Tickets für Kernfunktionen
User Stories beschreiben Anforderungen aus der Sicht des Anwenders und folgen oft dem Format: "Als <Rolle> möchte ich <Aktion>, damit <Nutzen>". Sie sollten durch Akzeptanzkriterien (AC) konkretisiert werden, die definieren, wann die Story als erfüllt gilt.   

Tabelle: Beispielhafte User Stories:
ID	User Story	Akzeptanzkriterien (Beispiele)	Story Points (Optional)
US01	Als <Datenanalyst> möchte ich <eine HL7 v2.3 Nachrichtendatei (ADT, MDM, ORU) laden>, damit <ich deren Inhalt anzeigen kann>.	- Dateiauswahl über Standarddialog. <br> - Datei wird mit NHapi geparst. <br> - Rohe Segmente/Felder werden in einer einfachen Ansicht (z.B. Liste, Baum) angezeigt. <br> - Parsing-Fehler werden dem Benutzer angezeigt.	5
US02	Als <Datenanalyst> möchte ich <eine geparste ADT-Nachricht in einem strukturierten, lesbaren Format sehen>, damit <ich Patienten- und Besuchsinformationen leicht verstehen kann>.	- PID-Felder (ID, Name, Geb.dat, Geschlecht) werden in beschrifteten Feldern angezeigt. <br> - PV1-Felder (Klasse, Ort, Arzt) werden in beschrifteten Feldern angezeigt. <br> - Datenbindung zwischen ViewModel und View funktioniert korrekt (read-only).	8
US03	Als <Schnittstellenspezialist> möchte ich <jedes Feld in einer geladenen HL7-Nachricht bearbeiten können>, damit <ich Fehler korrigieren oder Daten für Tests ändern kann>.	- Alle angezeigten Felder in der strukturierten Ansicht sind editierbar. <br> - Änderungen in der UI aktualisieren die zugrundeliegenden ViewModel-Daten (TwoWay-Binding). <br> - Eine "Speichern"-Funktion kodiert die modifizierte Nachricht und ermöglicht das Speichern (z.B. in Datei).	13
US04	Als <Schnittstellenspezialist> möchte ich <ein Editierbarkeits-Template für eine ADT_A01-Nachricht definieren>, damit <Benutzer bei spezifischen Aufgaben nur erlaubte Felder bearbeiten>.	- Template-Schema (z.B. XML) ist definiert. <br> - UI zum Erstellen/Bearbeiten/Speichern von Template-Definitionen ist implementiert (Nachrichtentyp, Liste editierbarer Feldpfade). <br> - Templates werden extern gespeichert (z.B. als Dateien).	13
US05	Als <Datenerfasser> möchte ich, dass <Felder in der Nachrichtenansicht basierend auf einem geladenen Template aktiviert oder deaktiviert sind>, damit <ich nur Daten ändere, die gemäß dem aktuellen Workflow erlaubt sind>.	- Logik zum Laden eines zum Nachrichtentyp passenden Templates ist implementiert. <br> - ViewModel bestimmt Feld-Editierbarkeit basierend auf dem Template. <br> - IsEnabled/IsReadOnly-Eigenschaften der View-Controls sind an ViewModel-Editierbarkeits-Properties gebunden. <br> - Umschalten zwischen "Alle bearbeiten" und "Template