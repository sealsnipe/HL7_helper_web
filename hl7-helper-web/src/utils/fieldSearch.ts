import { SegmentDto, FieldDto, Hl7Definition } from '@/types';
import { loadDefinition, getSegmentDefinition } from './definitionLoader';

/**
 * Represents a match found during field search
 */
export interface SearchMatch {
  /** Index of the segment in the segments array */
  segmentIndex: number;
  /** Segment name (e.g., "PID", "MSH") */
  segmentName: string;
  /** 1-based field position within the segment */
  fieldPosition: number;
  /** 1-based component position (if searching at component level) */
  componentPosition?: number;
  /** 1-based subcomponent position (if searching at subcomponent level) */
  subcomponentPosition?: number;
  /** Display path for the match (e.g., "PID-5.1") */
  displayPath: string;
  /** Field/component description from definitions */
  description?: string;
  /** The matching value */
  value: string;
  /** Index of the field in the segment's fields array */
  fieldIndex: number;
}

/**
 * Maximum number of results to return to prevent performance issues
 */
const MAX_RESULTS = 100;

/**
 * Parse a path query like "PID-5", "PID.5", "PID-5.1", "PID.5.1"
 * Returns null if not a valid path query
 */
function parsePathQuery(query: string): {
  segmentName: string;
  fieldPosition: number;
  componentPosition?: number;
} | null {
  // Normalize separators: accept both - and . as first separator
  // Format: SEG-F or SEG.F or SEG-F.C or SEG.F.C
  const normalized = query.toUpperCase().trim();

  // Match patterns like PID-5, PID.5, PID-5.1, PID.5.1
  const match = normalized.match(/^([A-Z][A-Z0-9]{2})[-.](\d+)(?:\.(\d+))?$/);

  if (!match) return null;

  const [, segmentName, fieldStr, componentStr] = match;
  const fieldPosition = parseInt(fieldStr, 10);
  const componentPosition = componentStr ? parseInt(componentStr, 10) : undefined;

  if (isNaN(fieldPosition) || fieldPosition < 1) return null;
  if (componentPosition !== undefined && (isNaN(componentPosition) || componentPosition < 1))
    return null;

  return { segmentName, fieldPosition, componentPosition };
}

/**
 * Get the message type from segments to load definitions
 */
function getMessageType(segments: SegmentDto[]): string | null {
  const msh = segments.find((s) => s.name === 'MSH');
  if (!msh) return null;

  const typeField = msh.fields.find((f) => f.position === 9);
  if (!typeField) return null;

  // Check components for ADT^A01 format
  if (typeField.components && typeField.components.length >= 2) {
    const type = typeField.components.find((c) => c.position === 1)?.value;
    const trigger = typeField.components.find((c) => c.position === 2)?.value;
    if (type && trigger) return `${type}^${trigger}`;
  }

  return typeField.value;
}

/**
 * Get description for a field from definitions
 */
function getFieldDescription(
  definition: Hl7Definition | null,
  segmentName: string,
  fieldPosition: number,
  componentPosition?: number
): string | undefined {
  if (!definition) return undefined;

  const segDef = getSegmentDefinition(definition, segmentName);
  if (!segDef) return undefined;

  const fieldDef = segDef.fields?.[fieldPosition.toString()];
  if (!fieldDef) return undefined;

  if (componentPosition !== undefined && fieldDef.components) {
    const compDesc = fieldDef.components[componentPosition.toString()];
    if (compDesc) {
      return `${fieldDef.description} - ${compDesc}`;
    }
  }

  return fieldDef.description;
}

/**
 * Search by path (e.g., "PID-5", "PID-5.1")
 */
function searchByPath(
  segments: SegmentDto[],
  pathQuery: { segmentName: string; fieldPosition: number; componentPosition?: number },
  definition: Hl7Definition | null
): SearchMatch[] {
  const results: SearchMatch[] = [];

  segments.forEach((segment, segmentIndex) => {
    if (segment.name !== pathQuery.segmentName) return;

    segment.fields.forEach((field, fieldIndex) => {
      if (field.position !== pathQuery.fieldPosition) return;

      // If searching for specific component
      if (pathQuery.componentPosition !== undefined) {
        if (field.components && field.components.length > 0) {
          const comp = field.components.find((c) => c.position === pathQuery.componentPosition);
          if (comp) {
            results.push({
              segmentIndex,
              segmentName: segment.name,
              fieldPosition: field.position,
              componentPosition: comp.position,
              displayPath: `${segment.name}-${field.position}.${comp.position}`,
              description: getFieldDescription(
                definition,
                segment.name,
                field.position,
                comp.position
              ),
              value: comp.value,
              fieldIndex,
            });
          }
        }
      } else {
        // Searching for whole field
        const value = getFieldDisplayValue(field);
        results.push({
          segmentIndex,
          segmentName: segment.name,
          fieldPosition: field.position,
          displayPath: `${segment.name}-${field.position}`,
          description: getFieldDescription(definition, segment.name, field.position),
          value,
          fieldIndex,
        });
      }
    });
  });

  return results;
}

/**
 * Get display value for a field (reconstructed from components if present)
 */
function getFieldDisplayValue(field: FieldDto): string {
  if (!field.components || field.components.length === 0) {
    return field.value;
  }
  return field.components
    .map((c) => {
      if (c.subComponents && c.subComponents.length > 0) {
        return c.subComponents.map((s) => s.value).join('&');
      }
      return c.value;
    })
    .join('^');
}

/**
 * Search by value (case-insensitive text search)
 */
function searchByValue(
  segments: SegmentDto[],
  query: string,
  definition: Hl7Definition | null
): SearchMatch[] {
  const results: SearchMatch[] = [];
  const lowerQuery = query.toLowerCase();

  segments.forEach((segment, segmentIndex) => {
    segment.fields.forEach((field, fieldIndex) => {
      // Search in components first
      if (field.components && field.components.length > 0) {
        field.components.forEach((comp) => {
          // Search in subcomponents
          if (comp.subComponents && comp.subComponents.length > 0) {
            comp.subComponents.forEach((sub) => {
              if (sub.value.toLowerCase().includes(lowerQuery) && results.length < MAX_RESULTS) {
                results.push({
                  segmentIndex,
                  segmentName: segment.name,
                  fieldPosition: field.position,
                  componentPosition: comp.position,
                  subcomponentPosition: sub.position,
                  displayPath: `${segment.name}-${field.position}.${comp.position}.${sub.position}`,
                  description: getFieldDescription(
                    definition,
                    segment.name,
                    field.position,
                    comp.position
                  ),
                  value: sub.value,
                  fieldIndex,
                });
              }
            });
          } else if (
            comp.value.toLowerCase().includes(lowerQuery) &&
            results.length < MAX_RESULTS
          ) {
            results.push({
              segmentIndex,
              segmentName: segment.name,
              fieldPosition: field.position,
              componentPosition: comp.position,
              displayPath: `${segment.name}-${field.position}.${comp.position}`,
              description: getFieldDescription(
                definition,
                segment.name,
                field.position,
                comp.position
              ),
              value: comp.value,
              fieldIndex,
            });
          }
        });
      } else if (field.value.toLowerCase().includes(lowerQuery) && results.length < MAX_RESULTS) {
        // Search in field value directly
        results.push({
          segmentIndex,
          segmentName: segment.name,
          fieldPosition: field.position,
          displayPath: `${segment.name}-${field.position}`,
          description: getFieldDescription(definition, segment.name, field.position),
          value: field.value,
          fieldIndex,
        });
      }
    });
  });

  return results;
}

/**
 * Search fields in segments by path or value.
 *
 * Supports:
 * - Path notation: "PID-5", "PID.5", "PID-5.1", "PID.5.1"
 * - Value search: "john" (case-insensitive)
 *
 * @param segments - Array of parsed HL7 segments
 * @param query - Search query (path or value)
 * @returns Array of matching fields, limited to MAX_RESULTS
 */
export function searchFields(segments: SegmentDto[], query: string): SearchMatch[] {
  const trimmedQuery = query.trim();

  // Empty query returns empty results
  if (!trimmedQuery) {
    return [];
  }

  // Try to load definition for better descriptions
  const messageType = getMessageType(segments);
  const definition = messageType ? loadDefinition(messageType) : null;

  // Check if query is a path query
  const pathQuery = parsePathQuery(trimmedQuery);

  if (pathQuery) {
    return searchByPath(segments, pathQuery, definition);
  }

  // Otherwise, search by value
  return searchByValue(segments, trimmedQuery, definition);
}

/**
 * Check if a query looks like a path query (for UI hints)
 */
export function isPathQuery(query: string): boolean {
  return parsePathQuery(query) !== null;
}

/**
 * Highlight the matching portion of a value
 */
export function highlightMatch(
  value: string,
  query: string
): { before: string; match: string; after: string } | null {
  const lowerValue = value.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerValue.indexOf(lowerQuery);

  if (index === -1) return null;

  return {
    before: value.slice(0, index),
    match: value.slice(index, index + query.length),
    after: value.slice(index + query.length),
  };
}
