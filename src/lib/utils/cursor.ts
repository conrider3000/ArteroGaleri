export interface CursorData {
  value: string | number | Date | null;
  id: string;
}

export function encodeCursor(data: CursorData): string {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

export function decodeCursor(cursor: string): CursorData | null {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64').toString());
  } catch {
    return null;
  }
}