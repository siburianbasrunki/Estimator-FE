import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard/Dashboard";
import { EstimationView } from "./pages/Estimations/Estimation";
import { HspView } from "./pages/HSP/HspView";
import { CategoryView } from "./pages/category/CategoryView";
import { ItemJobsView } from "./pages/ItemJobs/ItemJobsView";
import { UserView } from "./pages/User/UserView";
import CreateEstimation from "./pages/Estimations/Create";
import { OtpPage } from "./pages/otp";
import { RegisterPage } from "./pages/register";
import { LoginPage } from "./pages/login";
import { ProtectedRoute } from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/otp" element={<OtpPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="estimation" element={<EstimationView />} />
          <Route path="estimation/create" element={<CreateEstimation />} />
          <Route path="hsp" element={<HspView />} />
          <Route path="users" element={<UserView />} />
          <Route path="category-job" element={<CategoryView />} />
          <Route path="item-job" element={<ItemJobsView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
