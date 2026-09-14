import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useTheme } from '../context/ThemeContext';
import { Smartphone, Download, CheckCircle2, BellRing, ExternalLink, X, Copy, Check } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { config } = useTheme();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl = window.location.href;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      onClose();
    }
  };

  return (
    <div
      id="pwa-install-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        id="pwa-install-modal-card"
        className="w-full max-w-lg max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-4 py-3.5 bg-gradient-to-r ${config.headerGrad} border-b border-slate-800 flex items-center justify-between`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-white shadow-inner">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white leading-tight">
                Instalar App & Converter em APK
              </h2>
              <p className="text-xs text-slate-300">
                Alarme na barra de notificações e músicas locais no celular
              </p>
            </div>
          </div>
          <button
            id="close-pwa-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto text-sm">
          {/* Status Badge */}
          {isInstalled ? (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-medium text-emerald-300 text-xs">Aplicativo já instalado no dispositivo!</p>
                <p className="text-[11px] text-slate-300">Você já está usando o modo aplicativo nativo.</p>
              </div>
            </div>
          ) : isInstallable ? (
            <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-left">
                <p className="font-semibold text-sky-200 text-xs">Instalação Direta Pronta</p>
                <p className="text-[11px] text-slate-300">Instale direto no celular com 1 clique.</p>
              </div>
              <button
                id="direct-pwa-install-btn"
                type="button"
                onClick={handleInstallClick}
                className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer ${config.primaryBtn}`}
              >
                <Download className="w-4 h-4" />
                Instalar Agora
              </button>
            </div>
          ) : null}

          {/* Alarm Notification Bar Feature Explanation */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 text-amber-400">
              <BellRing className="w-4 h-4 shrink-0" />
              <h3 className="text-xs font-semibold text-slate-200">Como funciona a Barra de Notificação de Alarme:</h3>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
              <li>
                <strong className="text-white">Player na Barra de Notificações:</strong> Ao disparar, o alarme ativa a MediaSession do Android na tela de bloqueio com botões de <strong>Parar</strong> e <strong>Soneca (+5 min)</strong>.
              </li>
              <li>
                <strong className="text-white">Músicas do Celular:</strong> Suas faixas salvas no app tocam sem precisar de internet, salvas no armazenamento seguro do aparelho.
              </li>
              <li>
                <strong className="text-white">Vibração Rítmica:</strong> O celular vibra em sequência contínua até o alarme ser interrompido.
              </li>
            </ul>
          </div>

          {/* APK Guide */}
          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <span>📦</span>
              <span>Como Gerar o Arquivo APK para Android:</span>
            </h3>
            
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex gap-2 items-start">
                <span className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <p className="font-medium text-white">Copie a URL deste aplicativo:</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={currentUrl}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300 select-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium flex items-center gap-1 shrink-0 transition"
                      title="Copiar URL"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 items-start">
                <span className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <p className="font-medium text-white">Abra o gerador de APK oficial gratuito (PWABuilder):</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    O <strong>PWABuilder</strong> (criado pela Microsoft) analisa o manifesto e empacota automaticamente em um arquivo <strong>.APK</strong> instalável em qualquer Android.
                  </p>
                  <a
                    href="https://www.pwabuilder.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-sky-400 hover:text-sky-300 underline"
                  >
                    Abrir PWABuilder.com <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="flex gap-2 items-start">
                <span className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <p className="font-medium text-white">Gere e baixe seu APK:</p>
                  <p className="text-[11px] text-slate-400">
                    Cole a URL copiada no PWABuilder, clique em <em>Start</em> e em seguida selecione <strong>Package for Android</strong> para baixar o APK direto no seu celular.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* iOS Safari Fallback */}
          {isIOS && (
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs text-slate-300">
              <strong className="text-white block mb-1">No iPhone / iPad:</strong>
              Toque no botão de <em>Compartilhar</em> no Safari e selecione <em>"Adicionar à Tela de Início"</em>.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
