import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminPage } from "./pages/AdminPage.jsx";
import { ArrestRequestPage } from "./pages/ArrestRequestPage.jsx";
import { EventScreenPage } from "./pages/EventScreenPage.jsx";
import { PainelPage } from "./pages/PainelPage.jsx";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/pedir-prisao" element={<ArrestRequestPage />} />
        <Route path="/painel" element={<PainelPage />} />
        <Route path="/telao" element={<EventScreenPage />} />
        <Route path="*" element={<Navigate to="/painel" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
