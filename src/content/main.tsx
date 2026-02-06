import { StrictMode } from "react";
import App from "./App.tsx";
import * as ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";

const createHostContainer = (): HTMLDivElement => {
  const rootElement = document.createElement("div");
  rootElement.id = "xray-root";
  document.body.appendChild(rootElement);
  return rootElement;
};

const createShadowRoot = (hostElement: HTMLDivElement): ShadowRoot => {
  return hostElement.attachShadow({ mode: "open" });
};

// Toaster 생성
const createToasterContainer = (): HTMLDivElement => {
  const toasterElement = document.createElement("div");
  toasterElement.id = "xray-toaster";
  document.body.appendChild(toasterElement);
  return toasterElement;
};

try {
  const hostElement = createHostContainer();
  const shadowRoot = createShadowRoot(hostElement);

  const toasterContainer = createToasterContainer();
  ReactDOM.createRoot(toasterContainer).render(<Toaster />);

  ReactDOM.createRoot(shadowRoot).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (error) {
  console.error("Failed to initialize Xray:", error);
}
