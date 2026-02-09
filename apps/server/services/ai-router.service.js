/**
 * VECTRYS — AI Router Service (multi-provider)
 *
 * Dispatche chaque tache IA vers le modele le plus economique.
 * Fallback automatique si un provider est down.
 *
 * Routing :
 *   chat_voyageur        -> Claude Sonnet 4.5
 *   traduction           -> GPT-4o-mini
 *   recommandation_fate  -> Claude Sonnet 4.5
 *   analyse_sentiment    -> GPT-4o-mini
 *   generation_contenu   -> Claude Sonnet 4.5
 *   analyse_photos       -> GPT-4o Vision
 *   assistant_gestionnaire -> Claude Sonnet 4.5
 *
 * @version 1.0.0
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// --- Clients (lazy init) ---

let anthropicClient = null;
let openaiClient = null;

function getAnthropic() {
  if (!anthropicClient) {
    if (!process.env.ANTHROPIC_API_KEY) return null;
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

function getOpenAI() {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) return null;
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

// --- Routing table ---

const TASK_ROUTES = {
  chat_voyageur:          { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929' },
  recommandation_fate:    { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929' },
  generation_contenu:     { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929' },
  assistant_gestionnaire: { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929' },
  traduction:             { provider: 'openai',    model: 'gpt-4o-mini' },
  analyse_sentiment:      { provider: 'openai',    model: 'gpt-4o-mini' },
  analyse_photos:         { provider: 'openai',    model: 'gpt-4o' },
};

const FALLBACK = {
  anthropic: { provider: 'openai', model: 'gpt-4o-mini' },
  openai:    { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929' },
};

// --- Provider calls ---

async function callAnthropic(model, messages, options = {}) {
  const client = getAnthropic();
  if (!client) throw new Error('ANTHROPIC_API_KEY non configuree');

  const response = await client.messages.create({
    model,
    max_tokens: options.maxTokens || 1024,
    system: options.systemPrompt || undefined,
    messages,
  });

  return {
    content: response.content[0]?.text || '',
    usage: {
      input_tokens: response.usage?.input_tokens,
      output_tokens: response.usage?.output_tokens,
    },
    model: response.model,
    provider: 'anthropic',
  };
}

async function callOpenAI(model, messages, options = {}) {
  const client = getOpenAI();
  if (!client) throw new Error('OPENAI_API_KEY non configuree');

  const openaiMessages = [];
  if (options.systemPrompt) {
    openaiMessages.push({ role: 'system', content: options.systemPrompt });
  }

  for (const msg of messages) {
    if (msg.role === 'user') {
      // Support vision : si content est un array avec des images
      if (Array.isArray(msg.content)) {
        openaiMessages.push({ role: 'user', content: msg.content });
      } else {
        openaiMessages.push({ role: 'user', content: msg.content });
      }
    } else if (msg.role === 'assistant') {
      openaiMessages.push({ role: 'assistant', content: msg.content });
    }
  }

  const response = await client.chat.completions.create({
    model,
    messages: openaiMessages,
    max_tokens: options.maxTokens || 1024,
  });

  return {
    content: response.choices[0]?.message?.content || '',
    usage: {
      input_tokens: response.usage?.prompt_tokens,
      output_tokens: response.usage?.completion_tokens,
    },
    model: response.model,
    provider: 'openai',
  };
}

async function callProvider(provider, model, messages, options) {
  if (provider === 'anthropic') {
    return callAnthropic(model, messages, options);
  }
  return callOpenAI(model, messages, options);
}

// --- Main router ---

/**
 * Route une requete IA vers le provider optimal.
 *
 * @param {string} taskType - Type de tache (chat_voyageur, traduction, etc.)
 * @param {Object} payload - Payload de la requete
 * @param {Array} payload.messages - Messages au format [{role, content}]
 * @param {string} [payload.systemPrompt] - System prompt optionnel
 * @param {number} [payload.maxTokens] - Max tokens (defaut: 1024)
 * @param {string} [payload.imageUrl] - URL image pour analyse_photos
 * @returns {Promise<Object>} { content, usage, model, provider, taskType, fallback }
 */
export async function routeAIRequest(taskType, payload = {}) {
  const route = TASK_ROUTES[taskType];
  if (!route) {
    throw Object.assign(
      new Error(`Type de tache inconnu: ${taskType}. Types valides: ${Object.keys(TASK_ROUTES).join(', ')}`),
      { statusCode: 400 }
    );
  }

  let { messages = [], systemPrompt, maxTokens, imageUrl } = payload;

  // Vision : construire le message avec image
  if (taskType === 'analyse_photos' && imageUrl) {
    messages = [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: imageUrl } },
        { type: 'text', text: payload.prompt || 'Analyse cette image.' },
      ],
    }];
  }

  const options = { systemPrompt, maxTokens };

  // Tentative avec le provider principal
  try {
    const result = await callProvider(route.provider, route.model, messages, options);
    return { ...result, taskType, fallback: false };
  } catch (primaryError) {
    console.warn(`⚠️ AI Router: ${route.provider} echoue pour ${taskType}: ${primaryError.message}`);

    // Fallback sur l'autre provider
    const fb = FALLBACK[route.provider];
    if (!fb) throw primaryError;

    try {
      console.log(`🔄 AI Router: fallback ${route.provider} -> ${fb.provider}`);
      const result = await callProvider(fb.provider, fb.model, messages, options);
      return { ...result, taskType, fallback: true, originalProvider: route.provider };
    } catch (fallbackError) {
      console.error(`❌ AI Router: fallback ${fb.provider} aussi echoue: ${fallbackError.message}`);
      throw Object.assign(
        new Error(`Tous les providers IA sont indisponibles pour ${taskType}`),
        { statusCode: 503, primaryError: primaryError.message, fallbackError: fallbackError.message }
      );
    }
  }
}

/**
 * Verifie quels providers sont disponibles.
 */
export function getAvailableProviders() {
  return {
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
  };
}

/**
 * Retourne la table de routing.
 */
export function getRoutingTable() {
  return { ...TASK_ROUTES };
}

// Init log
const providers = getAvailableProviders();
const activeCount = Object.values(providers).filter(Boolean).length;
if (activeCount === 0) {
  console.warn('⚠️ AI Router: aucun provider configure (ANTHROPIC_API_KEY / OPENAI_API_KEY)');
} else {
  console.log(`✅ AI Router initialise (${activeCount}/2 providers: ${providers.anthropic ? 'Anthropic' : ''}${providers.anthropic && providers.openai ? ' + ' : ''}${providers.openai ? 'OpenAI' : ''})`);
}

export default {
  routeAIRequest,
  getAvailableProviders,
  getRoutingTable,
};
