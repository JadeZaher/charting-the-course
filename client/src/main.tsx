import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

document.getElementById("crawlable")?.remove();
createRoot(document.getElementById("root")!).render(<App />);
