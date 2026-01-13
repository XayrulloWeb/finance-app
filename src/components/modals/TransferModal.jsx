import React, { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { ArrowRightLeft } from 'lucide-react';
import { toast } from '../ui/Toast';

export default function TransferModal({ isOpen, onClose }) {
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
        if (!transferForm.fromAccountId || !transferForm.toAccountId) return toast.error('Выберите счета');
        if (transferForm.fromAccountId === transferForm.toAccountId) return toast.error('Счета должны различаться');
        if (!transferForm.amount || parseFloat(transferForm.amount) <= 0) return toast.error('Введите корректную сумму');

        const result = await addTransfer(
            transferForm.fromAccountId,
            transferForm.toAccountId,
            transferForm.amount,
            transferForm.comment
        );

        if (result?.success) {
            setTransferForm({ fromAccountId: '', toAccountId: '', amount: '', comment: '' });
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Перевод между счетами">
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
                    <div className="text-center text-xs font-bold text-zinc-400 mt-2 uppercase">Сумма перевода</div>
                </div>
                <div className="grid gap-4">
                    <div>
                        <label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">Откуда списать</label>
                        <select className="w-full p-3 bg-white border border-zinc-200 rounded-xl font-bold text-zinc-900 outline-none focus:border-indigo-500" value={transferForm.fromAccountId} onChange={e => setTransferForm({ ...transferForm, fromAccountId: e.target.value })}>
                            <option value="">Выберите счет...</option>
                            {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({new Intl.NumberFormat('ru-RU').format(getAccountBalance(a.id))} {a.currency})</option>)}
                        </select>
                    </div>
                    <div className="flex justify-center -my-2 z-10">
                        <div className="bg-zinc-100 p-2 rounded-full">
                            <ArrowRightLeft className="text-zinc-400" size={20} />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">Куда зачислить</label>
                        <select className="w-full p-3 bg-white border border-zinc-200 rounded-xl font-bold text-zinc-900 outline-none focus:border-indigo-500" value={transferForm.toAccountId} onChange={e => setTransferForm({ ...transferForm, toAccountId: e.target.value })}>
                            <option value="">Выберите счет...</option>
                            {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({new Intl.NumberFormat('ru-RU').format(getAccountBalance(a.id))} {a.currency})</option>)}
                        </select>
                    </div>
                </div>
                <Button onClick={handleAddTransfer} className="w-full py-4 text-lg bg-zinc-900 text-white hover:bg-zinc-800">Перевести</Button>
            </div>
        </Modal>
    );
}
