import React, { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { ArrowRightLeft } from 'lucide-react';
import { toast } from '../ui/Toast';
import { useTranslation } from 'react-i18next';

export default function TransferModal({ isOpen, onClose }) {
    const { t, i18n } = useTranslation();
    const accounts = useFinanceStore(s => s.accounts);
    const addTransfer = useFinanceStore(s => s.addTransfer);
    const getAccountBalance = useFinanceStore(s => s.getAccountBalance);

    const [transferForm, setTransferForm] = useState({
        fromAccountId: '',
        toAccountId: '',
        amount: '',
        comment: ''
    });

    const handleAddTransfer = async () => {
        if (!transferForm.fromAccountId || !transferForm.toAccountId) return toast.error(t('modals.transfer.error_accounts'));
        if (transferForm.fromAccountId === transferForm.toAccountId) return toast.error(t('modals.transfer.error_same_account'));
        if (!transferForm.amount || parseFloat(transferForm.amount) <= 0) return toast.error(t('modals.transaction.error_amount'));

        const result = await addTransfer(
            transferForm.fromAccountId,
            transferForm.toAccountId,
            transferForm.amount,
            transferForm.comment
        );

        if (result?.success) {
            setTransferForm({ fromAccountId: '', toAccountId: '', amount: '', comment: '' });
            onClose();
            toast.success(t('common.success'));
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat(i18n.language === 'uz' ? 'uz-UZ' : i18n.language === 'ru' ? 'ru-RU' : 'en-US').format(amount);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('modals.transfer.title')}>
            <div className="space-y-6">
                <div className="relative">
                    <input
                        type="number"
                        placeholder="0"
                        autoFocus
                        className="w-full text-4xl font-black p-4 text-center border-b-2 outline-none text-zinc-900 border-zinc-200 focus:border-zinc-900 transition-colors tabular-nums"
                        value={transferForm.amount}
                        onChange={e => setTransferForm({ ...transferForm, amount: e.target.value })}
                    />
                    <div className="text-center text-xs font-bold text-zinc-400 mt-2 uppercase">{t('modals.transfer.amount_label')}</div>
                </div>
                <div className="grid gap-4">
                    <div>
                        <label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">{t('modals.transfer.from_label')}</label>
                        <select className="w-full p-3 bg-white border border-zinc-200 rounded-xl font-bold text-zinc-900 outline-none focus:border-indigo-500" value={transferForm.fromAccountId} onChange={e => setTransferForm({ ...transferForm, fromAccountId: e.target.value })}>
                            <option value="">{t('modals.transfer.select_account')}</option>
                            {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({formatCurrency(getAccountBalance(a.id))} {a.currency})</option>)}
                        </select>
                    </div>
                    <div className="flex justify-center -my-2 z-10">
                        <div className="bg-zinc-100 p-2 rounded-full">
                            <ArrowRightLeft className="text-zinc-400" size={20} />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">{t('modals.transfer.to_label')}</label>
                        <select className="w-full p-3 bg-white border border-zinc-200 rounded-xl font-bold text-zinc-900 outline-none focus:border-indigo-500" value={transferForm.toAccountId} onChange={e => setTransferForm({ ...transferForm, toAccountId: e.target.value })}>
                            <option value="">{t('modals.transfer.select_account')}</option>
                            {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({formatCurrency(getAccountBalance(a.id))} {a.currency})</option>)}
                        </select>
                    </div>
                </div>
                <Button onClick={handleAddTransfer} className="w-full py-4 text-lg bg-zinc-900 text-white hover:bg-zinc-800">{t('modals.transfer.transfer_btn')}</Button>
            </div>
        </Modal>
    );
}
