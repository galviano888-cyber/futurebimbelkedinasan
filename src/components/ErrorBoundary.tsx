import { Component, type ReactNode } from "react";
import { RefreshCcw, AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
          <div className="w-14 h-14 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center mb-5">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-[16px] font-semibold text-slate-800 dark:text-white mb-2">
            Terjadi Kesalahan
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-[13px] mb-6 max-w-sm leading-relaxed">
            Halaman ini mengalami error yang tidak terduga. Coba muat ulang.
          </p>
          {this.state.error && (
            <p className="text-[11px] text-slate-400 dark:text-slate-600 font-mono mb-5 max-w-sm break-all">
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-[13px] rounded-xl transition-all"
          >
            <RefreshCcw className="w-4 h-4" />
            Coba Lagi
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
