import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('StaySetu Error Caught by Boundary:', error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-[#FAFAFB] px-4 py-12 text-zinc-900">
                    <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-zinc-200/80 shadow-xl text-center space-y-5">
                        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
                            <AlertCircle size={32} />
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold text-zinc-900">Something went wrong</h2>
                            <p className="text-zinc-500 text-xs sm:text-sm mt-1.5 leading-relaxed">
                                We encountered an unexpected display issue. Please reload the page to continue.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                            <button
                                onClick={this.handleReload}
                                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-extrabold py-3 px-5 rounded-full text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-rose-500/25"
                            >
                                <RefreshCw size={14} /> Reload Page
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-extrabold py-3 px-5 rounded-full text-xs flex items-center justify-center gap-2 transition-all"
                            >
                                <Home size={14} /> Go Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
