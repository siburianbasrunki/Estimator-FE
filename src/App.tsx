import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard/Dashboard";
import { EstimationView } from "./pages/Estimations/Estimation";
import { CreateStepOne } from "./pages/Estimations/CreateStepOne";
import { CreateStepTwo } from "./pages/Estimations/CreateStepTwo";
import { HspView } from "./pages/HSP/HspView";
import { CategoryView } from "./pages/category/CategoryView";
import { ItemJobsView } from "./pages/ItemJobs/ItemJobsView";
import { UserView } from "./pages/User/UserView";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="estimation" element={<EstimationView />} />
          <Route path="estimation/create/stepOne" element={<CreateStepOne />} />
          <Route path="estimation/create/stepTwo" element={<CreateStepTwo />} />
          <Route path="hsp" element={<HspView/>} />
          <Route path="users" element={<UserView/>} />
          <Route path="category-job" element={<CategoryView/>} />
          <Route path="item-job" element={<ItemJobsView/>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
