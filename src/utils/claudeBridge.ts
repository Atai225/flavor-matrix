// Мост к возможностям страницы, когда приложение открыто как артефакт на claude.ai.
// Там у страницы есть window.claude: через него можно спросить Claude (от имени
// того, кто открыл страницу, — ключ не нужен) и сохранить файл.
// В обычном браузере (npm run dev, свой хостинг) window.claude нет — всё вернёт null.

export interface SampleError {
  code: string;
  message: string;
  text?: string;
}

export type ClaudeSample = ((input: string, options?: Record<string, unknown>) => Promise<{ text: string; truncated: boolean }>) & {
  json: <T = unknown>(input: string, options?: Record<string, unknown>) => Promise<T>;
};

export interface ClaudeDownloads {
  save: (req: { filename: string; data: string | Blob }) => Promise<{ status: 'saved' | 'delivered' }>;
}

interface ClaudeRuntime {
  use: (name: string) => Promise<unknown>;
}

function runtime(): ClaudeRuntime | null {
  const c = (window as unknown as { claude?: ClaudeRuntime }).claude;
  return c && typeof c.use === 'function' ? c : null;
}

export async function getClaudeSample(): Promise<ClaudeSample | null> {
  const rt = runtime();
  if (!rt) return null;
  try {
    return ((await rt.use('sample')) as ClaudeSample | null) ?? null;
  } catch {
    return null;
  }
}

export async function getClaudeDownloads(): Promise<ClaudeDownloads | null> {
  const rt = runtime();
  if (!rt) return null;
  try {
    return ((await rt.use('downloads')) as ClaudeDownloads | null) ?? null;
  } catch {
    return null;
  }
}

/** Понятное объяснение кода ошибки и признак «больше не предлагать в этом просмотре» */
export function describeSampleError(e: unknown): { message: string; disable: boolean } {
  const code = (e as SampleError)?.code ?? 'upstream_error';
  switch (code) {
    case 'not_granted':
      return { message: 'доступ к Claude для этой страницы не разрешён', disable: true };
    case 'sampling_disabled':
    case 'not_declared':
    case 'capability_disabled':
    case 'capability_removed':
      return { message: 'Claude недоступен в этом просмотре', disable: true };
    case 'rate_limited':
      return { message: 'слишком много запросов или исчерпан лимит — попробуйте позже', disable: false };
    case 'session_expired':
      return { message: 'сессия истекла — войдите в Claude заново', disable: false };
    case 'invalid_json':
      return { message: 'Claude ответил не в том формате — нажмите ещё раз', disable: false };
    case 'cancelled':
      return { message: 'запрос отменён', disable: false };
    default:
      return { message: 'временная ошибка связи с Claude — попробуйте ещё раз', disable: false };
  }
}
