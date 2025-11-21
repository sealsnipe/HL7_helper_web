import adtA01 from '../data/hl7-definitions/adt-a01.json';
import oruR01 from '../data/hl7-definitions/oru-r01.json';
import ormO01 from '../data/hl7-definitions/orm-o01.json';
import { Hl7Definition } from '@/types';

const definitions: Record<string, Hl7Definition> = {
    'ADT^A01': adtA01 as unknown as Hl7Definition,
    'ORU^R01': oruR01 as unknown as Hl7Definition,
    'ORM^O01': ormO01 as unknown as Hl7Definition,
};

export const loadDefinition = (messageType: string): Hl7Definition | null => {
    // messageType might be "ADT^A01" or just "ADT" depending on how we parse it.
    // The keys in our map are full "ADT^A01".
    return definitions[messageType] || null;
};

export const getSegmentDefinition = (definition: Hl7Definition | null, segmentName: string) => {
    if (!definition || !definition.segments) return null;
    return definition.segments[segmentName] || null;
};
