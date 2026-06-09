import React, { Component } from 'react';
import { Link } from 'react-router-dom';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center p-6 text-center">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/80 rounded-3xl p-8 shadow-xl backdrop-blur-xl space-y-6">
            <div className="inline-flex p-4 rounded-3xl bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400">
              <span className="text-4xl">⚠️</span>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Something went wrong</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                An unexpected crash occurred. Our technical staff has been notified. You can reset the application state or return to safety.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-gray-100 dark:bg-gray-950 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-left overflow-auto max-h-32 text-xs font-mono text-rose-600 dark:text-rose-400">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition-all"
              >
                Reset & Go to Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750 transition"
              >
                Reload Current Page
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
