export interface Template {
    id: string;
    name: string;
    description: string;
    messageType: string; // e.g., "ADT-A01", "ORU-R01"
    content: string;
    createdAt: number;
}
