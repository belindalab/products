import React from 'react';
import { AlertCircle } from 'lucide-react';

interface State { hasError: boolean; }
interface Props { children: React.ReactNode; }

export default class TabErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-gray-400 gap-3">
          <AlertCircle size={40} className="text-red-300" />
          <p className="text-sm text-center">
            Ошибка отображения данных.<br />
            Попробуйте выбрать продукт заново.
          </p>
          <button
            onClick={this.reset}
            className="text-xs px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            Повторить
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
