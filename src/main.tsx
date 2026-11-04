import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/fredoka/wght.css";
import "@fontsource-variable/plus-jakarta-sans/wght.css";
import App from "./App";
import "./styles/base.css";
import "./styles/shell.css";
import "./styles/components.css";
import "./styles/home.css";
import "./styles/setup.css";
import "./styles/play.css";
import "./styles/adaptive.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
