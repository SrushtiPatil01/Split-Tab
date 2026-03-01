import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import GroupDashboard from "./pages/GroupDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/group/:code" element={<GroupDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}