import { Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { X } from 'lucide-react';

// Modal responsif: bottom sheet di mobile (mudah dijangkau jempol),
// dialog di tengah layar pada desktop.
export default function Modal({ open, onClose, title, children }) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="translate-y-full opacity-0 sm:translate-y-4"
            enterTo="translate-y-0 opacity-100 sm:translate-y-0"
            leave="ease-in duration-150"
            leaveFrom="translate-y-0 opacity-100"
            leaveTo="translate-y-full opacity-0 sm:translate-y-4"
          >
            <DialogPanel className="w-full rounded-t-3xl bg-white p-5 pb-8 shadow-xl sm:max-w-md sm:rounded-3xl sm:p-6">
              {/* Handle drag ala bottom sheet (hanya mobile) */}
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200 sm:hidden" />

              <div className="mb-4 flex items-center justify-between">
                <DialogTitle className="text-base font-bold text-slate-900">{title}</DialogTitle>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              {children}
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
