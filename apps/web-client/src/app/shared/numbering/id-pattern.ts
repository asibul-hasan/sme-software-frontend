/**
 * Client-side mirror of the backend `IdPatternResolver` (see
 * `core/shared/numbering/IdPatternResolver.java`).
 *
 * Used by SYS_1301 to render a live preview while the user edits a pattern —
 * saves a round trip on every keystroke. The server remains authoritative:
 * `Sys1301Service.preview` is the source of truth when the user asks for the
 * "official" preview or when the pattern is finally saved.
 *
 * Grammar (case-sensitive, one `{SEQ:n}` required):
 *   {DOC_TYPE}, {BRANCH}, {COMPANY},
 *   {FY_YY}, {FY_YY_YY}, {FY_YYYY},
 *   {YY}, {YYYY}, {MM},
 *   {SEQ:n}
 */

export interface IdPatternCtx {
  docDate?: Date;
  branchCode?: string;
  companyCode?: string;
  docSubType?: string;
  fiscalYearStart?: number; // e.g. 2026
  fiscalYearEnd?: number;   // e.g. 2027
  sequenceValue?: number;
}

const TOKEN_RE = /\{([A-Z_]+)(?::([^}]+))?\}/g;
const KNOWN = new Set([
  'DOC_TYPE', 'BRANCH', 'COMPANY',
  'FY_YY', 'FY_YY_YY', 'FY_YYYY',
  'YY', 'YYYY', 'MM',
  'SEQ',
]);

export interface IdPatternValidation {
  ok: boolean;
  error?: string;
}

/** Fast structural check — matches the backend's rules. */
export function validateIdPattern(pattern: string | null | undefined): IdPatternValidation {
  if (!pattern || !pattern.trim()) {
    return { ok: false, error: 'Pattern is required' };
  }
  let seqCount = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(TOKEN_RE.source, 'g');
  while ((m = re.exec(pattern)) !== null) {
    const name = m[1];
    const arg = m[2];
    if (!KNOWN.has(name)) return { ok: false, error: `Unknown token: {${name}}` };
    if (name === 'SEQ') {
      seqCount++;
      const digits = Number(arg);
      if (!Number.isFinite(digits) || digits < 1 || digits > 12) {
        return { ok: false, error: `{SEQ:n} width must be 1–12 (got ${arg ?? ''})` };
      }
    } else if (arg != null) {
      return { ok: false, error: `Token {${name}} does not take an argument` };
    }
  }
  if (seqCount === 0) return { ok: false, error: 'Pattern must contain exactly one {SEQ:n} token' };
  if (seqCount > 1)  return { ok: false, error: `Pattern must contain exactly one {SEQ:n} token (found ${seqCount})` };
  return { ok: true };
}

/**
 * Compiles the pattern against `ctx`. When a token can't be resolved (missing
 * context field) we return a `{TOKEN}` placeholder rather than throwing — a
 * preview should never blow up the form. The backend preview endpoint still
 * enforces every token strictly at save time.
 */
export function resolveIdPattern(pattern: string, ctx: IdPatternCtx): string {
  const date = ctx.docDate ?? new Date();
  return pattern.replace(TOKEN_RE, (_full, name: string, arg?: string) => {
    switch (name) {
      case 'DOC_TYPE':  return ctx.docSubType || '{DOC_TYPE}';
      case 'BRANCH':    return ctx.branchCode  || '{BRANCH}';
      case 'COMPANY':   return ctx.companyCode || '{COMPANY}';
      case 'FY_YY':     return ctx.fiscalYearStart != null ? two(ctx.fiscalYearStart) : '{FY_YY}';
      case 'FY_YY_YY':
        return (ctx.fiscalYearStart != null && ctx.fiscalYearEnd != null)
          ? `${two(ctx.fiscalYearStart)}-${two(ctx.fiscalYearEnd)}`
          : '{FY_YY_YY}';
      case 'FY_YYYY':   return ctx.fiscalYearStart != null ? String(ctx.fiscalYearStart) : '{FY_YYYY}';
      case 'YY':        return two(date.getFullYear());
      case 'YYYY':      return String(date.getFullYear());
      case 'MM':        return pad2(date.getMonth() + 1);
      case 'SEQ':       return padSeq(ctx.sequenceValue ?? 1, Number(arg) || 4);
      default:          return `{${name}}`;
    }
  });
}

/** All tokens the pattern actually references — used for chip highlighting in the UI. */
export function tokensUsed(pattern: string | null | undefined): string[] {
  if (!pattern) return [];
  const out: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(TOKEN_RE.source, 'g');
  while ((m = re.exec(pattern)) !== null) {
    if (!out.includes(m[1])) out.push(m[1]);
  }
  return out;
}

function two(year: number): string {
  return pad2(year % 100);
}
function pad2(n: number): string {
  return String(n).padStart(2, '0');
}
function padSeq(value: number, width: number): string {
  return String(value).padStart(width, '0');
}
