import { useState } from 'react';
import Modal from './Modal';
import { Loader2 } from 'lucide-react';

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Ya, Lanjutkan', tone = 'blue' }) {
  const [loading, setLoading] = useState(false);

  const tones = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    red: 'bg-red-500 hover:bg-red-600',
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm leading-relaxed text-slate-500">{message}</p>
      <div className="mt-5 flex gap-2.5">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className={`flex flex-[1.4] items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-60 ${tones[tone]}`}
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
