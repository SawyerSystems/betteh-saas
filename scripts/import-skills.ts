import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const API_BASE = process.env.API_BASE || 'http://localhost:6001';
const ADMIN_COOKIE = process.env.ADMIN_COOKIE || '';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@coachwilltumbles.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'TumbleCoach2025!';

type NormalizedSkill = {
  name: string;
  category?: string;
  level?: string;
  description?: string;
  displayOrder?: number | null;
  apparatusName?: string | null;
  isConnectedCombo?: boolean;
  prerequisiteNames?: string[];
  componentNames?: string[];
};

type ImportFile =
  | {
      apparatus?: { name: string }[];
      skills: Array<NormalizedSkill>;
    }
  | Array<any>; // support raw array input

async function main() {
  const file = path.resolve(process.cwd(), 'data/skills-import.json');
  if (!fs.existsSync(file)) {
    console.error('Missing data/skills-import.json');
    process.exit(1);
  }
  const raw = fs.readFileSync(file, 'utf8');
  const data: ImportFile = parseLenientJSON(raw);

  // Normalize input into a consistent array of skills
  const skills: NormalizedSkill[] = normalizeSkillsInput(data);

  // Load apparatus from API to map names to ids
  const cookie = await ensureAdminSession();
  const appRes = await fetch(`${API_BASE}/api/apparatus`, { headers: cookieHeaders(cookie) });
  const appJson: Array<{ id: number; name: string }> = await appRes.json();
  const apparatusByName = new Map(appJson.map(a => [a.name.toLowerCase(), a.id]));

  // Create a lookup we’ll fill as we create skills
  const skillIdByName = new Map<string, number>();

  // Preload existing skills (idempotent import)
  try {
    const existingRes = await fetch(`${API_BASE}/api/admin/skills`, { headers: cookieHeaders(cookie) });
    if (existingRes.ok) {
      const existing: Array<{ id: number; name: string }> = await existingRes.json();
      existing.forEach(s => skillIdByName.set(s.name.toLowerCase(), s.id));
    }
  } catch (e) {
    // Non-fatal
  }

  for (const s of skills) {
    let apparatusId = s.apparatusName ? apparatusByName.get(s.apparatusName.toLowerCase()) : undefined;
    // If apparatus is missing, try to create it (requires admin)
    if (!apparatusId && s.apparatusName) {
      const created = await createApparatusIfMissing(s.apparatusName, apparatusByName, cookie);
      apparatusId = created ?? apparatusId;
    }
    const body: any = {
      name: s.name,
      category: s.category,
      level: s.level,
      description: s.description,
      displayOrder: s.displayOrder,
      apparatusId,
      isConnectedCombo: s.isConnectedCombo ?? false,
      // relations resolved after we have ids for referenced skills
    };
    // Skip creation if name already exists
    if (skillIdByName.has(s.name.toLowerCase())) {
      continue;
    }
    const res = await fetch(`${API_BASE}/api/admin/skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...cookieHeaders(cookie) },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn('Failed to create skill', s.name, await safeText(res), '— continuing');
      // Try to refresh existing skills map to see if it was concurrently created
      try {
        const existingRes = await fetch(`${API_BASE}/api/admin/skills`, { headers: cookieHeaders(cookie) });
        if (existingRes.ok) {
          const existing: Array<{ id: number; name: string }> = await existingRes.json();
          existing.forEach(sk => skillIdByName.set(sk.name.toLowerCase(), sk.id));
        }
      } catch {}
    } else {
      const created = await res.json();
      skillIdByName.set(s.name.toLowerCase(), created.id);
    }
  }

  // Second pass for relations now that all ids are known
  for (const s of skills) {
    const id = skillIdByName.get(s.name.toLowerCase());
    if (!id) continue;
    const prereqIds = (s.prerequisiteNames || [])
      .map(n => skillIdByName.get(n.toLowerCase()))
      .filter((n): n is number => typeof n === 'number');
    const componentIds = (s.componentNames || [])
      .map(n => skillIdByName.get(n.toLowerCase()))
      .filter((n): n is number => typeof n === 'number');
    if (prereqIds.length || componentIds.length) {
      const res = await fetch(`${API_BASE}/api/admin/skills/${id}/relations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...cookieHeaders(cookie) },
        body: JSON.stringify({ prerequisiteIds: prereqIds, componentIds }),
      });
      if (!res.ok) {
        console.error('Failed to set relations for', s.name, await safeText(res));
        process.exit(1);
      }
    }
  }

  console.log('Import complete');
}

function cookieHeaders(cookie?: string) {
  const c = cookie || ADMIN_COOKIE;
  return c ? { Cookie: c } : {};
}

// Attempt login to obtain a session cookie when not provided
async function ensureAdminSession(): Promise<string | undefined> {
  if (ADMIN_COOKIE) return ADMIN_COOKIE;
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    if (!res.ok) {
      console.warn('Admin login failed, proceeding without cookie. Status:', res.status);
      return undefined;
    }
    const setCookie = res.headers.get('set-cookie');
    if (!setCookie) return undefined;
    // Use only the cookie pair (strip attributes)
    const cookiePair = setCookie.split(',')[0].split(';')[0];
    return cookiePair;
  } catch (e) {
    console.warn('Admin login error:', e);
    return undefined;
  }
}

async function createApparatusIfMissing(name: string, apparatusByName: Map<string, number>, cookie?: string): Promise<number | undefined> {
  const key = name.toLowerCase();
  if (apparatusByName.has(key)) return apparatusByName.get(key);
  // Need admin session to create
  const res = await fetch(`${API_BASE}/api/apparatus`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...cookieHeaders(cookie) },
    body: JSON.stringify({ name, sortOrder: null })
  });
  if (!res.ok) {
    // If unauthorized, just skip creating and return undefined
    return undefined;
  }
  const created = await res.json();
  apparatusByName.set(created.name.toLowerCase(), created.id);
  return created.id;
}

// Accept both valid JSON and lightly escaped markdown JSON
function parseLenientJSON(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {
    const cleaned = raw
      .replace(/\\\[/g, '[')
      .replace(/\\\]/g, ']')
      .replace(/\\_/g, '_');
    return JSON.parse(cleaned);
  }
}

function normalizeSkillsInput(data: ImportFile): NormalizedSkill[] {
  // If already in expected object format
  if (Array.isArray(data)) {
    return (data as any[]).map(normalizeOne);
  }
  if ((data as any).skills && Array.isArray((data as any).skills)) {
    return (data as any).skills.map(normalizeOne);
  }
  // Fallback empty
  return [];
}

function normalizeOne(s: any): NormalizedSkill {
  // Support multiple key variants
  const displayOrder = s.displayOrder ?? s.display_order ?? null;
  const apparatusName = s.apparatusName ?? s.apparatus ?? null;
  const isConnectedCombo = s.isConnectedCombo ?? s.is_connected_combo ?? false;
  const prerequisiteNames: string[] = s.prerequisiteNames ?? s.prerequisites ?? [];
  const componentNames: string[] = s.componentNames ?? s.components ?? [];
  return {
    name: s.name,
    category: s.category,
    level: s.level,
    description: s.description,
    displayOrder,
    apparatusName,
    isConnectedCombo,
    prerequisiteNames,
    componentNames,
  };
}

async function safeText(res: any) {
  try { return await res.text(); } catch { return ''; }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
