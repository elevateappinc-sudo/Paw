'use client';
import { useState } from 'react';
import { useContentHub } from '@/hooks/useContentHub';
import { ContentType, ContentTone, Language, CONTENT_TYPE_LABELS, TONE_LABELS, CHAR_LIMITS } from '@/types/content-hub';

interface ContentHubUIProps { petId: string; petName: string; }

export function ContentHubUI({ petId, petName }: ContentHubUIProps) {
  const [contentType, setContentType] = useState<ContentType>('instagram_post');
  const [tone, setTone] = useState<ContentTone>('divertido');
  const [language, setLanguage] = useState<Language>('es');
  const [celebrationReason, setCelebrationReason] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const { result, history, isLoading, error, generate, deleteHistoryItem, copyToClipboard, setResult } = useContentHub(petId);

  const handleGenerate = () => generate({ petId, contentType, tone, language, celebrationReason: celebrationReason || undefined });

  const handleCopy = async (text: string, key: string) => {
    const ok = await copyToClipboard(text);
    if (ok) { setCopied(key); setTimeout(() => setCopied(null), 2000); }
  };

  const charCount = result?.caption.length ?? 0;
  const maxChars = CHAR_LIMITS[contentType].max;
  const isOverLimit = charCount > maxChars;

  return (
    <div className="flex flex-col gap-6 p-4 max-w-lg mx-auto">
      {/* Sección 1: Config */}
      <div className="bg-[#111111] rounded-2xl p-4 border border-[#1F1F1F] space-y-4">
        <h2 className="text-white font-semibold text-base">Crear contenido para {petName} ✨</h2>

        {/* Tipo de contenido */}
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(CONTENT_TYPE_LABELS) as ContentType[]).map(type => (
            <button key={type} onClick={() => setContentType(type)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${contentType === type ? 'bg-[#FF7A45] text-black' : 'bg-[#1F1F1F] text-gray-400 hover:text-white'}`}>
              {CONTENT_TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        {/* Tono */}
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(TONE_LABELS) as ContentTone[]).map(t => (
            <button key={t} onClick={() => setTone(t)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${tone === t ? 'bg-[#FF7A45] text-black' : 'bg-[#1F1F1F] text-gray-400 hover:text-white'}`}>
              {TONE_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Motivo celebración */}
        {tone === 'cumpleanos' && (
          <input value={celebrationReason} onChange={e => setCelebrationReason(e.target.value)}
            placeholder="¿Cuál es el motivo? (ej: 2 años, adopción...)"
            className="w-full bg-[#0a0a0a] border border-[#1F1F1F] rounded-xl px-4 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#FF7A45]" />
        )}

        {/* Toggle idioma hashtags */}
        {contentType !== 'instagram_story' && (
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-xs">Hashtags:</span>
            <div className="flex bg-[#1F1F1F] rounded-full p-0.5">
              {(['es', 'en'] as Language[]).map(lang => (
                <button key={lang} onClick={() => setLanguage(lang)}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${language === lang ? 'bg-[#FF7A45] text-black' : 'text-gray-400 hover:text-white'}`}>
                  {lang === 'es' ? '🇪🇸 ES' : '🇺🇸 EN'}
                </button>
              ))}
            </div>
          </div>
        )}

        <button onClick={handleGenerate} disabled={isLoading}
          className="w-full bg-[#FF7A45] text-black font-semibold py-3 rounded-xl text-sm disabled:opacity-50 hover:bg-[#e86a35] transition-colors">
          {isLoading ? 'Generando...' : 'Generar contenido ✨'}
        </button>

        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>

      {/* Sección 2: Resultado */}
      {result && (
        <div className="bg-[#111111] rounded-2xl p-4 border border-[#1F1F1F] space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-white font-medium text-sm">Tu contenido</h3>
            <span className={`text-xs ${isOverLimit ? 'text-red-400' : 'text-gray-500'}`}>{charCount}/{maxChars}</span>
          </div>

          <textarea
            value={result.caption}
            onChange={e => setResult({ ...result, caption: e.target.value, charCount: e.target.value.length })}
            className="w-full bg-[#0a0a0a] border border-[#1F1F1F] rounded-xl px-4 py-3 text-white text-sm resize-none focus:outline-none focus:border-[#FF7A45] min-h-[80px]"
          />
          {contentType === 'instagram_story' && <p className="text-gray-500 text-xs">📸 Texto para superponer sobre tu foto</p>}

          {result.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {result.hashtags.map(h => (
                <span key={h} className="bg-[#1F1F1F] text-[#FF7A45] text-xs px-2 py-1 rounded-full">{h}</span>
              ))}
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <button onClick={() => handleCopy(result.caption, 'caption')}
              className="flex-1 bg-[#1F1F1F] text-white text-sm py-2 rounded-xl hover:bg-[#2a2a2a] transition-colors">
              {copied === 'caption' ? '✅ Copiado' : 'Copiar caption'}
            </button>
            {result.hashtags.length > 0 && (
              <button onClick={() => handleCopy(result.hashtags.join(' '), 'hashtags')}
                className="flex-1 bg-[#1F1F1F] text-white text-sm py-2 rounded-xl hover:bg-[#2a2a2a] transition-colors">
                {copied === 'hashtags' ? '✅ Copiado' : 'Copiar hashtags'}
              </button>
            )}
            <button onClick={handleGenerate} disabled={isLoading}
              className="bg-[#1F1F1F] text-gray-400 text-sm py-2 px-3 rounded-xl hover:text-white transition-colors">
              🔄
            </button>
          </div>
        </div>
      )}

      {/* Sección 3: Historial */}
      <div className="bg-[#111111] rounded-2xl border border-[#1F1F1F] overflow-hidden">
        <button onClick={() => setShowHistory(!showHistory)}
          className="w-full px-4 py-3 flex justify-between items-center text-white text-sm font-medium hover:bg-[#1a1a1a] transition-colors">
          <span>Generaciones recientes ({history.length})</span>
          <span className="text-gray-500">{showHistory ? '▲' : '▼'}</span>
        </button>
        {showHistory && (
          <div className="border-t border-[#1F1F1F]">
            {history.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-6">Aún no has generado contenido. ¡Empieza arriba! 🚀</p>
            ) : (
              history.map(item => (
                <div key={item.id} className="flex items-start gap-3 px-4 py-3 border-b border-[#1F1F1F] last:border-0 hover:bg-[#1a1a1a]">
                  <div className="flex-1 cursor-pointer" onClick={() => setResult({ caption: item.caption, hashtags: item.hashtags, modelUsed: item.modelUsed, charCount: item.caption.length, maxChars: CHAR_LIMITS[item.contentType].max })}>
                    <p className="text-white text-xs font-medium">{CONTENT_TYPE_LABELS[item.contentType]} · {TONE_LABELS[item.tone]}</p>
                    <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{item.caption}</p>
                  </div>
                  <button onClick={() => deleteHistoryItem(item.id)} className="text-gray-600 hover:text-red-400 text-xs mt-0.5">✕</button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
