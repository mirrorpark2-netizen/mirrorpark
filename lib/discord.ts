import { sql } from './postgres';

export type DiscordWebhookKind = 'invoice' | 'clock';

const settingKey = (kind: DiscordWebhookKind) =>
  kind === 'invoice' ? 'discord_invoice_webhook' : 'discord_clock_webhook';

const webhookValue = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

export function isDiscordWebhookUrl(value: string) {
  try {
    const url = new URL(value);
    const validHost =
      url.hostname === 'discord.com' ||
      url.hostname.endsWith('.discord.com') ||
      url.hostname === 'discordapp.com' ||
      url.hostname.endsWith('.discordapp.com');
    return (
      url.protocol === 'https:' &&
      validHost &&
      /^\/api\/webhooks\/[^/]+\/[^/]+/.test(url.pathname)
    );
  } catch {
    return false;
  }
}

export async function getDiscordWebhook(kind: DiscordWebhookKind) {
  const [setting] = await sql<Array<{ value: unknown }>>`
    SELECT value FROM business_settings WHERE key = ${settingKey(kind)}
  `;
  return webhookValue(setting?.value);
}

export async function setDiscordWebhook(
  kind: DiscordWebhookKind,
  value: string | null,
) {
  if (!value) {
    await sql`DELETE FROM business_settings WHERE key = ${settingKey(kind)}`;
    return;
  }
  await sql`
    INSERT INTO business_settings (key, value, updated_at)
    VALUES (${settingKey(kind)}, ${JSON.stringify(value)}::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `;
}

export async function sendDiscordWebhook(
  kind: DiscordWebhookKind,
  payload: Record<string, unknown>,
) {
  const url = await getDiscordWebhook(kind);
  if (!url) return { configured: false, sent: false };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        allowed_mentions: { parse: [] },
      }),
      signal: controller.signal,
    });
    return { configured: true, sent: response.ok };
  } catch {
    return { configured: true, sent: false };
  } finally {
    clearTimeout(timeout);
  }
}
