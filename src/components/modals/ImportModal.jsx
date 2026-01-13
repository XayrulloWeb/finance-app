import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Check, AlertCircle, X, Loader } from 'lucide-react';
import * as XLSX from 'xlsx';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useFinanceStore } from '../../store/useFinanceStore';
import { toast } from '../ui/Toast';

export default function ImportModal({ isOpen, onClose }) {
    const store = useFinanceStore();
    const fileInputRef = useRef(null);

    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Select, 2: Preview, 3: Result

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setLoading(true);

        try {
            const data = await parseExcel(selectedFile);
            setPreview(data);
            setStep(2);
        } catch (err) {
            console.error(err);
            toast.error('Не удалось прочитать файл');
        } finally {
            setLoading(false);
        }
    };

    const parseExcel = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    // Ищем листы
                    const txSheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('transaction') || n.toLowerCase().includes('транзакции'));
                    const txSheet = workbook.Sheets[txSheetName || workbook.SheetNames[0]]; // Берем первый, если не нашли по имени

                    const jsonData = XLSX.utils.sheet_to_json(txSheet);
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    };

    const handleImport = async () => {
        if (!preview) return;
        setLoading(true);

        // Подготовка данных для store.importData
        // В реальном проекте тут нужен маппинг колонок, но пока предположим, что формат совпадает с экспортом
        const importPackage = {
            transactions: preview.map(row => ({
                // Пытаемся мапить поля, если они называются иначе, или берем как есть
                amount: row.amount || row['Сумма'] || 0,
                type: (row.type === 'income' || row.type === 'expense') ? row.type : (row.amount > 0 ? 'income' : 'expense'),
                date: row.date || new Date().toISOString(),
                comment: row.comment || row['Комментарий'] || 'Импорт из Excel',
                // Важно: account_id и category_id должны существовать.
                // Для простоты, если ID нет, мы можем их пропускать или создавать (сложная логика).
                // Сейчас мы просто передадим структуру, а store.importData должен быть готов принять это.
                ...row
            }))
        };

        const result = await store.importData(importPackage);
        setLoading(false);

        if (result.success) {
            toast.success('Данные успешно импортированы!');
            onClose();
            setFile(null);
            setPreview(null);
            setStep(1);
        } else {
            toast.error('Ошибка импорта: ' + result.error);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Импорт данных">
            <div className="space-y-6">

                {step === 1 && (
                    <div
                        className="border-2 border-dashed border-zinc-300 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                        onClick={() => fileInputRef.current.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".xlsx, .xls, .csv"
                            onChange={handleFileChange}
                        />
                        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
                            <FileSpreadsheet size={32} className="text-zinc-400 group-hover:text-indigo-600" />
                        </div>
                        <p className="font-bold text-zinc-700 text-lg">Нажмите для выбора файла</p>
                        <p className="text-zinc-400 text-sm mt-1">Поддерживаются .xlsx, .csv</p>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <div className="bg-zinc-50 p-4 rounded-xl flex items-center gap-3 border border-zinc-200">
                            <FileSpreadsheet className="text-green-600" />
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-zinc-900 truncate">{file?.name}</div>
                                <div className="text-xs text-zinc-500">Найдено записей: {preview?.length}</div>
                            </div>
                            <button onClick={() => { setStep(1); setFile(null); }} className="p-2 text-zinc-400 hover:text-red-500">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-amber-800 text-sm flex gap-2">
                            <AlertCircle size={20} className="shrink-0" />
                            <p>Убедитесь, что формат файла соответствует шаблону экспорта. Иначе данные могут быть повреждены.</p>
                        </div>

                        <Button onClick={handleImport} loading={loading} className="w-full py-4 text-lg">
                            Начать импорт
                        </Button>
                    </div>
                )}

            </div>
        </Modal>
    );
}