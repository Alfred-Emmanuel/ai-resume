import React from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "../contexts/AuthContext";
import { Popup } from "./popup";

const root = createRoot(document.getElementById("root")!);
root.render(
  <AuthProvider>
    <Popup />
  </AuthProvider>
);
