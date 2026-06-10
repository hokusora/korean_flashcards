import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// 1. Chèn thêm dòng import này để gọi thư viện Google
import { GoogleOAuthProvider } from "@react-oauth/google";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* 2. Bọc GoogleOAuthProvider ra ngoài App và dán Client ID của bạn vào */}
    <GoogleOAuthProvider clientId="765886199608-fq2538bofbeu32c34felbcnkm661uh07.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
);
