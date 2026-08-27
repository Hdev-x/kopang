import { Component, type ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "./routes/AppRouter";
import { ScrollToTop } from "./routes/ScrollToTop";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: unknown) {
    console.error("Uncaught React Error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "80px 20px", textAlign: "center", fontFamily: "sans-serif" }}>
          <h2 style={{ fontSize: "20px", marginBottom: "12px", color: "#333" }}>화면을 불러오는 도중 오류가 발생했습니다.</h2>
          <p style={{ color: "#666", marginBottom: "24px", fontSize: "14px" }}>
            {this.state.error?.message || "네트워크나 데이터 처리 중 예외가 발생했습니다."}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            style={{
              padding: "10px 24px",
              backgroundColor: "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            페이지 새로고침
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <AppRouter />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
