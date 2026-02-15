// ═══════════════════════════════════════════════════════════════════
// VECTRYS DATA ENGINE v3.0 — Service Classification IA (Claude API)
// ═══════════════════════════════════════════════════════════════════

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-5-20250929';

const SYSTEM_PROMPT = `Tu es un expert en classification de données pour le secteur de la location courte durée (Airbnb, Booking, etc.) avec une expertise en RGPD, Data Act EU, et IA Act EU.

Tu dois classifier les données selon :
- Catégories : operational, behavioral, market, predictive, financial, geographic
- Sensibilité : 1 (publique) à 5 (hautement confidentiel)
- Types PII : email, phone, name, address, payment_info, device_id, national_id, ip_address, location
- Modèles de monétisation : api_access, data_marketplace, insight_packages, benchmark_reports, ai_training, embedded_analytics
- Réglementations : rgpd, data_act, ia_act, dsa, dga, eu_2024_1028, alur, elan

Réponds UNIQUEMENT en JSON valide, sans markdown ni commentaires.`;

/**
 * Classifie un data asset via Claude API.
 * @param {object} asset - Asset partiel à classifier
 * @param {object[]} sampleData - Échantillon de données
 * @param {object} schema - Schéma des données
 * @param {string} [context] - Contexte additionnel
 * @returns {Promise<object>} Résultat de classification
 */
export async function classifyDataAsset(asset, sampleData, schema, context) {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    temperature: 0.3,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Classifie cet asset de données :

Nom: ${asset.name}
Description: ${asset.description || 'Non fournie'}
Contexte: ${context || 'Plateforme VECTRYS — gestion locations courte durée'}

Schéma:
${JSON.stringify(schema, null, 2)}

Échantillon (${sampleData.length} lignes):
${JSON.stringify(sampleData.slice(0, 5), null, 2)}

Retourne un JSON avec : classification (category, subcategory, sensitivity, pii_types, confidence, tags), monetization (quality_score, uniqueness_score, demand_score, freshness_score, eligible_models, revenue_range {min, max}, suggestions[]), compliance_flags[] (regulation, severity, article, description, remediation).`
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return { asset_id: asset.id || '', ...JSON.parse(text) };
}

/**
 * Génère des recommandations de valorisation pour un ensemble d'assets.
 * @param {object[]} assets - Liste d'assets partiels
 * @returns {Promise<object>} Recommandations
 */
export async function getValorizationRecommendations(assets) {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    temperature: 0.5,
    system: 'Tu es un consultant senior en stratégie data. Réponds en JSON.',
    messages: [{
      role: 'user',
      content: `Voici ${assets.length} data assets VECTRYS :
${JSON.stringify(assets.map(a => ({ name: a.name, category: a.category, quality: a.quality_score, uniqueness: a.uniqueness_score, demand: a.demand_score, volume: a.volume_records })), null, 2)}

Recommande : dataset_combinations[] (assets à combiner pour plus de valeur), target_partners[] (types de partenaires idéaux), quick_wins[] (actions rapides pour augmenter la valeur), risks[] (risques à anticiper), three_phase_plan {phase1, phase2, phase3}.`
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  return JSON.parse(text);
}
