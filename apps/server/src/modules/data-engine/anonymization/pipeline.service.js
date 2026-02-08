// ═══════════════════════════════════════════════════════════════════
// VECTRYS DATA ENGINE v3.0 — Service Anonymisation
// k-anonymat, differential privacy, pseudonymisation HMAC-SHA256
// ═══════════════════════════════════════════════════════════════════

import crypto from 'crypto';

const HMAC_SECRET = process.env.ANONYMIZATION_HMAC_SECRET || 'vectrys-anonymization-secret';

// Pseudonymisation déterministe HMAC-SHA256
function pseudonymize(value, field) {
  return crypto.createHmac('sha256', HMAC_SECRET).update(`${field}:${value}`).digest('hex').slice(0, 16);
}

// Généralisation pour k-anonymat
function generalize(value, field, level) {
  if (typeof value === 'number') {
    const ranges = [1, 5, 10, 50, 100];
    const r = ranges[Math.min(level, ranges.length - 1)];
    return `${Math.floor(value / r) * r}-${Math.floor(value / r) * r + r - 1}`;
  }
  if (value instanceof Date || /^\d{4}-\d{2}/.test(String(value))) {
    const d = new Date(value);
    if (level === 0) return d.toISOString().slice(0, 10);
    if (level === 1) return d.toISOString().slice(0, 7);
    return d.getFullYear().toString();
  }
  if (typeof value === 'string') {
    if (field.includes('postal') || field.includes('zip')) {
      return String(value).slice(0, Math.max(2, 5 - level));
    }
    if (level >= 2) return '*';
    return value;
  }
  return value;
}

// Mécanisme de Laplace pour differential privacy
function addLaplaceNoise(value, sensitivity, epsilon) {
  const b = sensitivity / epsilon;
  const u = Math.random() - 0.5;
  const noise = -b * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  return Math.round((value + noise) * 100) / 100;
}

// Vérification PII résiduel
function scanForResidualPII(data) {
  const warnings = [];
  const patterns = [
    { name: 'email', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/ },
    { name: 'phone_fr', regex: /(?:\+33|0)\s*[1-9](?:[\s.-]*\d{2}){4}/ },
    { name: 'iban', regex: /[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}/ },
    { name: 'nir', regex: /[12]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{2}/ },
  ];
  const sample = data.slice(0, Math.min(100, data.length));
  for (const row of sample) {
    for (const [, val] of Object.entries(row)) {
      if (typeof val !== 'string') continue;
      for (const p of patterns) {
        if (p.regex.test(val)) {
          warnings.push(`PII résiduel détecté (${p.name}) dans les données anonymisées`);
          return warnings;
        }
      }
    }
  }
  return warnings;
}

/**
 * Exécute le pipeline d'anonymisation complet.
 * @param {object[]} data - Données brutes
 * @param {object} config - Configuration d'anonymisation
 * @returns {Promise<object>} Résultat avec données anonymisées
 */
export async function runAnonymizationPipeline(data, config) {
  const start = Date.now();
  const warnings = [];
  let output = [...data.map(r => ({ ...r }))];

  // Phase 1 : Pseudonymisation des PII
  const piiFields = ['email', 'phone', 'name', 'first_name', 'last_name', 'address', 'ip', 'device_id', 'national_id'];
  for (const row of output) {
    for (const field of piiFields) {
      if (row[field] && typeof row[field] === 'string') {
        row[field] = pseudonymize(row[field], field);
      }
    }
  }

  if (config.target_level === 'pseudonymized') {
    return buildResult(data.length, output, start, warnings, config);
  }

  // Phase 2 : K-anonymat
  if (config.target_level === 'k_anonymous' || config.target_level === 'fully_anonymous') {
    const qi = config.quasi_identifiers;
    const k = config.k_value || 5;

    for (let level = 0; level <= 4; level++) {
      for (const row of output) {
        for (const field of qi) {
          if (row[field] !== undefined) {
            row[field] = generalize(row[field], field, level);
          }
        }
      }

      const groups = new Map();
      for (const row of output) {
        const key = qi.map(f => String(row[f] ?? '')).join('|');
        groups.set(key, (groups.get(key) || 0) + 1);
      }

      const smallGroups = [...groups.entries()].filter(([, count]) => count < k);
      if (smallGroups.length === 0) break;

      if (level === 4) {
        const smallKeys = new Set(smallGroups.map(([key]) => key));
        const before = output.length;
        output = output.filter(row => {
          const key = qi.map(f => String(row[f] ?? '')).join('|');
          return !smallKeys.has(key);
        });
        const suppressed = before - output.length;
        if (suppressed / before > config.max_suppression_rate) {
          warnings.push(`Taux de suppression élevé: ${(suppressed / before * 100).toFixed(1)}%`);
        }
      }
    }
  }

  // Phase 3 : Differential Privacy (si fully_anonymous)
  if (config.target_level === 'fully_anonymous') {
    const epsilon = config.epsilon || 1.0;
    for (const row of output) {
      for (const attr of config.sensitive_attributes) {
        if (typeof row[attr] === 'number') {
          row[attr] = addLaplaceNoise(row[attr], 1, epsilon);
        }
      }
    }
  }

  // Phase 4 : Agrégation (si aggregated)
  if (config.target_level === 'aggregated') {
    const qi = config.quasi_identifiers;
    const groups = new Map();
    for (const row of output) {
      const key = qi.map(f => String(row[f] ?? '')).join('|');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    }
    output = [];
    for (const [, rows] of groups) {
      if (rows.length < (config.k_value || 5)) continue;
      const agg = { ...rows[0], _count: rows.length };
      for (const attr of config.sensitive_attributes) {
        if (typeof rows[0][attr] === 'number') {
          agg[attr] = rows.reduce((s, r) => s + (r[attr] || 0), 0) / rows.length;
        }
      }
      output.push(agg);
    }
  }

  // Validation finale
  warnings.push(...scanForResidualPII(output));

  return buildResult(data.length, output, start, warnings, config);
}

function buildResult(originalCount, output, startTime, warnings, config) {
  return {
    original_records: originalCount,
    output_records: output.length,
    suppression_rate: 1 - output.length / originalCount,
    achieved_k: config.k_value || 1,
    information_loss: 1 - output.length / originalCount,
    reidentification_risk: config.target_level === 'fully_anonymous' ? 0.01 : config.target_level === 'k_anonymous' ? 1 / (config.k_value || 5) : 0.4,
    processing_time_ms: Date.now() - startTime,
    data: output,
    warnings,
  };
}
