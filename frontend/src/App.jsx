import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Timeline from "./pages/Timeline";
import FitnessTests from "./pages/FitnessTests";
import RaceDay from "./pages/RaceDay";
import Templates from "./pages/Templates";
import Settings from "./pages/Settings";
import PrintFullPlan from "./pages/PrintFullPlan";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="fitness" element={<FitnessTests />} />
          <Route path="race-day" element={<RaceDay />} />
          <Route path="templates" element={<Templates />} />
          <Route path="settings" element={<Settings />} />
          <Route path="print/full-plan" element={<PrintFullPlan />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
