
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Render the app directly to the DOM
const rootElement = document.getElementById("root") || document.getElementById("app");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
