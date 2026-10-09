// GEO Invader: AI crawler tracking (Cloudflare Pages Function).
// Save as functions/_middleware.js at the root of the Pages project, and add a GEO_INVADER_KEY secret (Production).
const ENDPOINT = 'https://geoinvader.com/api/ingest/crawls';
const AI_BOTS = /ChatGPT-User|OAI-SearchBot|GPTBot|Claude-User|Claude-SearchBot|ClaudeBot|anthropic-ai|Perplexity-User|PerplexityBot|MistralAI-User|meta-externalfetcher|meta-externalagent|DuckAssistBot|Amazonbot|CCBot|Bytespider|cohere-ai|Googlebot|bingbot|Applebot/i;

export async function onRequest(context) {
  const response = await context.next();
  const ua = context.request.headers.get('user-agent') || '';
  if (context.env.GEO_INVADER_KEY && AI_BOTS.test(ua)) {
    const hit = { ua, ip: context.request.headers.get('cf-connecting-ip'), path: new URL(context.request.url).pathname, status: response.status, ts: Date.now() };
    context.waitUntil(fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + context.env.GEO_INVADER_KEY },
      body: JSON.stringify({ hits: [hit] }),
    }).catch(() => {}));
  }
  return response;
}
