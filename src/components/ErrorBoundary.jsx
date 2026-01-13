import React from 'react';
import GlassCard from './ui/GlassCard';
import Button from './ui/Button';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Critical Error:", error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleReset = () => {
        // Жесткий сброс для лечения зависаний
        localStorage.clear();
        window.location.reload();
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
                    <GlassCard className="max-w-md w-full text-center p-8 border-rose-200 bg-rose-50/50">
                        <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={32} strokeWidth={2.5} />
                        </div>
                        <h1 className="text-2xl font-black text-zinc-900 mb-2">Упс! Что-то сломалось</h1>
                        <p className="text-zinc-500 mb-6">
                            Произошла критическая ошибка. Мы уже работаем над этим. Попробуйте обновить страницу.
                        </p>

                        <div className="space-y-3">
                            <Button onClick={this.handleReload} className="w-full bg-rose-500 hover:bg-rose-600 text-white" icon={RefreshCcw}>
                                Перезагрузить
                            </Button>

                            <button onClick={this.handleReset} className="text-xs text-zinc-400 hover:text-rose-500 underline">
                                Сбросить данные приложения (Logout)
                            </button>
                        </div>
                    </GlassCard>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;