import { Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import Dashboard from "./pages/Dashboard";
import Endpoints from "./pages/Endpoints";
import Incidents from "./pages/Incidents";
import Alerts from "./pages/Alerts";

function App() {
  return (
    <div className="app">
      <Navigation />
      <div className="container-fluid mt-3">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/endpoints" element={<Endpoints />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/alerts" element={<Alerts />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
