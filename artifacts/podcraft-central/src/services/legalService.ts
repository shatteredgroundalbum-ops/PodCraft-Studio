import { db, type DbLegalAcceptance } from '../db';

export const DOCUMENT_VERSIONS: Record<string, string> = {
  'Terms of Service': '1.0',
  'Privacy Policy': '1.0',
  'Cookie Policy': '1.0',
};

export async function recordAcceptance(
  userId: number,
  documentName: string,
  documentVersion?: string
): Promise<DbLegalAcceptance> {
  const version = documentVersion ?? DOCUMENT_VERSIONS[documentName] ?? '1.0';
  const existing = await db.legal_acceptances
    .where('userId').equals(userId)
    .and((a) => a.documentName === documentName && a.documentVersion === version)
    .first();

  if (existing) return existing;

  const acceptance: DbLegalAcceptance = {
    id: `legal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId,
    documentName,
    documentVersion: version,
    acceptedAt: new Date().toISOString(),
  };
  await db.legal_acceptances.add(acceptance);
  return acceptance;
}

export async function hasAccepted(userId: number, documentName: string): Promise<boolean> {
  const version = DOCUMENT_VERSIONS[documentName] ?? '1.0';
  const record = await db.legal_acceptances
    .where('userId').equals(userId)
    .and((a) => a.documentName === documentName && a.documentVersion === version)
    .first();
  return !!record;
}

export async function getAcceptances(userId: number): Promise<DbLegalAcceptance[]> {
  return db.legal_acceptances.where('userId').equals(userId).toArray();
}
