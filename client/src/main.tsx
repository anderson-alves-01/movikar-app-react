import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerSW } from "./utils/pwa";

// Temporarily disable service worker to debug auth loops
// registerSW({
//   onSuccess: (registration) => {
//     console.log('SW registered: ', registration);
//   },
//   onUpdate: (registration) => {
//     console.log('SW updated: ', registration);
//   },
// });

createRoot(document.getElementById("root")!).render(<App />);
