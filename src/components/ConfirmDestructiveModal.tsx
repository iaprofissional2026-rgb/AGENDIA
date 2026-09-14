import React from 'react';
import { AlertTriangle, Trash2, Edit3, X } from 'lucide-react';

interface ConfirmDestructiveModalProps {
  isOpen: boolean;
  actionType: 'delete' | 'update';
  activityTitle: string;
  isSyncedWithGoogle: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmDestructiveModal: React.FC<ConfirmDestructiveModalProps> = ({
  isOpen,
  actionType,
  activityTitle,
  isSyncedWithGoogle,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const isDelete = actionType === 'delete';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Warning Icon */}
        <div className="flex items-center space-x-3 mb-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
            isDelete ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
          }`}>
            {isDelete ? <Trash2 className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isDelete ? 'Excluir Atividade' : 'Atualizar Atividade no Google Calendar'}
            </h3>
            <p className="text-xs text-slate-500">
              Confirmação de operação
            </p>
          </div>
        </div>

        {/* Content Description */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 mb-5 text-xs text-slate-700 space-y-2">
          <p>
            Você está prestes a {isDelete ? 'excluir' : 'modificar'} a atividade:
          </p>
          <p className="font-semibold text-slate-900 text-sm italic">
            "{activityTitle}"
          </p>

          {isSyncedWithGoogle && (
            <div className="flex items-start gap-2 pt-2 mt-2 border-t border-slate-200 text-amber-800 bg-amber-50/70 p-2 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Atenção:</strong> Esta atividade está sincronizada com a sua conta do <strong>Google Calendar</strong>. A alteração será refletida na sua agenda oficial.
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors flex items-center gap-1.5 ${
              isDelete
                ? 'bg-rose-600 hover:bg-rose-700 disabled:opacity-50'
                : 'bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50'
            }`}
          >
            {isLoading ? 'Processando...' : isDelete ? 'Sim, Excluir' : 'Confirmar Atualização'}
          </button>
        </div>

      </div>
    </div>
  );
};
