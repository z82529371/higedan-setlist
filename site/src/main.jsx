import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { registerServiceWorker, unregisterServiceWorkers } from "./lib/pwa.js";

ReactDOM.createRoot(document.getElementById("app")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if (import.meta.env.PROD) {
  registerServiceWorker();
} else if (import.meta.env.DEV) {
  unregisterServiceWorkers();
}
