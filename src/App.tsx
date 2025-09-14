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
import { DetailEstimation } from "./pages/Estimations/DetailEstimation";
import { AhspView } from "./pages/HSP/AhspView";
import UpahView from "./pages/MasterData/UpahView";
import BahanView from "./pages/MasterData/BahanView";
import { NotifyProvider } from "./components/Notify/notify";
import { ConfirmProvider } from "./components/ConfirmDialog";
import UpdateEstimation from "./pages/Estimations/Update";
import PeralatanView from "./pages/MasterData/PeralatanVies";

function App() {
  return (
    <NotifyProvider>
      <ConfirmProvider>
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
              <Route path="estimation/:id" element={<DetailEstimation />} />
              <Route path="estimation/create" element={<CreateEstimation />} />
              <Route
                path="estimation/update/:id"
                element={<UpdateEstimation />}
              />
              <Route path="hsp" element={<HspView />} />
              <Route path="hsp/ahsp/:code" element={<AhspView />} />
              <Route path="/master/upah" element={<UpahView />} />
              <Route path="/master/bahan" element={<BahanView />} />
              <Route path="/master/peralatan" element={<PeralatanView />} />
              <Route path="users" element={<UserView />} />
              <Route path="category-job" element={<CategoryView />} />
              <Route path="item-job" element={<ItemJobsView />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ConfirmProvider>
    </NotifyProvider>
  );
}

export default App;
