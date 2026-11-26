import { useState } from 'react';
import { KeyRound, X } from 'lucide-react';
import { DEFAULT_MODELS, type AISettings } from '../utils/recommendationEngine';
import { Button } from './ui';

interface Props {
  value: AISettings | null;
  onSave: (s: AISettings | null) => void;
  onClose: () => void;
}

export default function SettingsModal({ value, onSave, onClose }: Props) {
  const [provider, setProvider] = useState<AISettings['provider']>(value?.provider ?? 'openai');
  const [apiKey, setApiKey] = useState(value?.apiKey ?? '');
  const [model, setModel] = useState(value?.model ?? DEFAULT_MODELS[value?.provider ?? 'openai']);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="glass w-full max-w-md rounded-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <KeyRound size={18} className="text-amber-400" /> ИИ для нестандартных запросов
          </h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-zinc-500 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-zinc-400">
          Необязательно. Приложение полностью работает без ключа: подбор идёт по локальному словарю синонимов и тегам. Ключ нужен только для запросов,
          которые движок не понял (например, «как закат в Барселоне»). Ключ хранится только в этом браузере (localStorage), запрос уходит напрямую провайдеру.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {(['openai', 'gemini'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setProvider(p);
                setModel(DEFAULT_MODELS[p]);
              }}
              className={`rounded-lg border px-3 py-2 text-sm transition ${provider === p ? 'border-amber-500/60 bg-amber-500/10 text-amber-200' : 'border-zinc-700 text-zinc-400'}`}
            >
              {p === 'openai' ? 'OpenAI' : 'Google Gemini'}
            </button>
          ))}
        </div>
        <label className="mt-3 block text-xs text-zinc-400">
          API-ключ
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={provider === 'openai' ? 'sk-…' : 'AIza…'}
            className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 font-mono text-sm text-white outline-none focus:border-amber-500/70"
            autoComplete="off"
          />
        </label>
        <label className="mt-3 block text-xs text-zinc-400">
          Модель
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 font-mono text-sm text-white outline-none focus:border-amber-500/70"
          />
        </label>
        <div className="mt-5 flex gap-2">
          <Button
            variant="danger"
            onClick={() => {
              onSave(null);
              onClose();
            }}
          >
            Удалить ключ
          </Button>
          <Button
            variant="primary"
            className="flex-1 py-2"
            disabled={!apiKey.trim()}
            onClick={() => {
              onSave({ provider, apiKey: apiKey.trim(), model: model.trim() || DEFAULT_MODELS[provider] });
              onClose();
            }}
          >
            Сохранить
          </Button>
        </div>
      </div>
    </div>
  );
}
