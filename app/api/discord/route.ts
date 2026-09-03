import { requireAdmin } from '../../../lib/auth';
import {
  getDiscordWebhook,
  isDiscordWebhookUrl,
  setDiscordWebhook,
  type DiscordWebhookKind,
} from '../../../lib/discord';

const webhookFields = [
  ['invoiceWebhook', 'invoice'],
  ['clockWebhook', 'clock'],
] as const;

async function configurationStatus() {
  const [invoiceWebhook, clockWebhook] = await Promise.all([
    getDiscordWebhook('invoice'),
    getDiscordWebhook('clock'),
  ]);
  return {
    invoiceConfigured: Boolean(invoiceWebhook),
    clockConfigured: Boolean(clockWebhook),
  };
}

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }
  return Response.json(await configurationStatus());
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin(request))) {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }
  const input = (await request.json()) as Record<string, unknown>;

  for (const [field, kind] of webhookFields) {
    if (!(field in input)) continue;
    const value = input[field];
    if (value === null || value === '') {
      await setDiscordWebhook(kind as DiscordWebhookKind, null);
      continue;
    }
    if (typeof value !== 'string' || !isDiscordWebhookUrl(value.trim())) {
      return Response.json(
        { error: `Enter a valid Discord ${kind} channel webhook URL.` },
        { status: 400 },
      );
    }
    await setDiscordWebhook(kind as DiscordWebhookKind, value.trim());
  }

  return Response.json({ status: 'saved', ...(await configurationStatus()) });
}
