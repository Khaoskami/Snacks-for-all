export class InvalidBody extends Error {}
export async function readBody(req: Request): Promise<Record<string, unknown>> {
  let body: unknown;
  try { body = await req.json(); } catch { throw new InvalidBody('Invalid JSON'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new InvalidBody('Expected an object');
  return body as Record<string, unknown>;
}
export function textField(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
