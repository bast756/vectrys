// ═══════════════════════════════════════════════════════════════════
// VECTRYS DATA ENGINE v3.0 — Service Analytics (K-Means + Claude IA)
// ═══════════════════════════════════════════════════════════════════

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Distance euclidienne
function euclidean(a, b) {
  return Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0));
}

// Normalisation min-max
function normalize(values) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values.map(v => (v - min) / range);
}

/**
 * K-Means avec initialisation K-Means++.
 * @param {number[][]} data - Données à clusteriser
 * @param {number} k - Nombre de clusters
 * @param {number} [maxIter=100] - Itérations max
 * @returns {{ assignments: number[], centroids: number[][] }}
 */
function kMeans(data, k, maxIter = 100) {
  const n = data.length;

  // K-Means++ initialization
  const centroids = [data[Math.floor(Math.random() * n)]];
  while (centroids.length < k) {
    const dists = data.map(p => Math.min(...centroids.map(c => euclidean(p, c))));
    const total = dists.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < n; i++) {
      r -= dists[i];
      if (r <= 0) { centroids.push([...data[i]]); break; }
    }
  }

  let assignments = new Array(n).fill(0);
  const dim = data[0].length;

  for (let iter = 0; iter < maxIter; iter++) {
    // Assign
    const newAssign = data.map(p => {
      let minD = Infinity, minC = 0;
      centroids.forEach((c, ci) => {
        const d = euclidean(p, c);
        if (d < minD) { minD = d; minC = ci; }
      });
      return minC;
    });

    // Check convergence
    if (newAssign.every((a, i) => a === assignments[i])) break;
    assignments = newAssign;

    // Update centroids
    for (let ci = 0; ci < k; ci++) {
      const members = data.filter((_, i) => assignments[i] === ci);
      if (members.length === 0) continue;
      for (let d = 0; d < dim; d++) {
        centroids[ci][d] = members.reduce((s, m) => s + m[d], 0) / members.length;
      }
    }
  }
  return { assignments, centroids };
}

function deriveCharacteristics(centroid) {
  const chars = [];
  if (centroid.monetization_score > 75) chars.push('Haute valeur monétaire');
  if (centroid.quality_score > 80) chars.push('Qualité premium');
  if (centroid.uniqueness_score > 80) chars.push('Données uniques');
  if (centroid.demand_score > 80) chars.push('Forte demande marché');
  if (centroid.freshness_score > 80) chars.push('Données très fraîches');
  if (chars.length === 0) chars.push('Profil standard');
  return chars;
}

/**
 * Clusterise les data assets par similarité de scores.
 * @param {object[]} assets - Liste de DataAsset
 * @param {number} [k=4] - Nombre de clusters
 * @returns {object[]} Clusters avec membres et caractéristiques
 */
export function clusterAssets(assets, k = 4) {
  if (assets.length === 0) return [];

  const features = ['monetization_score', 'quality_score', 'uniqueness_score', 'demand_score', 'freshness_score'];
  const raw = assets.map(a => features.map(f => a[f] || 0));

  // Normalize each feature
  const transposed = features.map((_, fi) => normalize(raw.map(r => r[fi])));
  const normalized = raw.map((_, ri) => features.map((_, fi) => transposed[fi][ri]));

  const { assignments, centroids } = kMeans(normalized, Math.min(k, assets.length));

  const clusters = [];
  for (let ci = 0; ci < Math.min(k, assets.length); ci++) {
    const memberIdx = assignments.map((a, i) => a === ci ? i : -1).filter(i => i >= 0);
    if (memberIdx.length === 0) continue;

    const centroid = {};
    features.forEach((f, fi) => { centroid[f] = Math.round(centroids[ci][fi] * 100); });

    clusters.push({
      cluster_id: ci,
      label: `Cluster ${ci + 1}`,
      asset_ids: memberIdx.map(i => assets[i].id),
      centroid,
      characteristics: deriveCharacteristics(centroid),
    });
  }
  return clusters;
}

/**
 * Génère un rapport d'insights via Claude API.
 * @param {object[]} assets - Liste de DataAsset
 * @returns {Promise<object>} Rapport structuré
 */
export async function generateInsightsReport(assets) {
  const response = await anthropic.messages.create({
    model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    temperature: 0.4,
    system: 'Tu es un analyste data senior. Réponds en JSON structuré.',
    messages: [{
      role: 'user',
      content: `Analyse ces ${assets.length} data assets VECTRYS et génère un rapport :
${JSON.stringify(assets.map(a => ({
  name: a.name, category: a.category,
  scores: { quality: a.quality_score, uniqueness: a.uniqueness_score, demand: a.demand_score, freshness: a.freshness_score, monetization: a.monetization_score },
  volume: a.volume_records, pii: a.contains_pii, anonymization: a.anonymization_level
})), null, 2)}

Retourne : summary (string), key_findings[] (string), recommendations[] ({title, description, impact, effort}), risk_alerts[] ({title, severity, description}).`
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  return JSON.parse(text);
}
