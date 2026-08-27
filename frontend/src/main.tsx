import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import App from "./App.tsx";

async function enableMocking() {
  if (import.meta.env.MODE !== "development") return;
  try {
    const { worker } = await import("./mocks/browser");
    await worker.start({ onUnhandledRequest: "bypass" });
  } catch (err) {
    console.warn("MSW worker start failed, proceeding without MSW:", err);
  }
}

enableMocking().finally(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
