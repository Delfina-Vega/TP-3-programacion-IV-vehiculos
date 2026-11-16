import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import "./index.css";
import { Layout } from "./Layout";
import { Home } from "./Home";
import { Registro } from "./Registro";
import { AuthProvider } from "./Auth";
import { Login } from "./Login";
import { AuthLayout } from "./AuthLayout";
import { Vehiculos } from "./Vehiculos";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="registro" element={<Registro/>} />
            <Route path="vehiculos" element={<AuthLayout />}>
              <Route index element={<Vehiculos />} />
            </Route>
            </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);