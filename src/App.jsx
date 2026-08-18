import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Ships from './pages/Ships.jsx'
import Equipment from './pages/Equipment.jsx'
import Fleets from './pages/Fleets.jsx'
import Stages from './pages/Stages.jsx'
import ShipDetail from './components/ShipDetail.jsx'
import EquipmentDetail from './components/EquipmentDetail.jsx'
import FleetDetail from './components/FleetDetail.jsx'
import StageDetail from './components/StageDetail.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/ships" element={<Ships />} />
        <Route path="/ships/:id" element={<ShipDetail />} />
        <Route path="/equipment" element={<Equipment />} />
        <Route path="/equipment/:id" element={<EquipmentDetail />} />
        <Route path="/fleets" element={<Fleets />} />
        <Route path="/fleets/:id" element={<FleetDetail />} />
        <Route path="/stages" element={<Stages />} />
        <Route path="/stages/:id" element={<StageDetail />} />
      </Route>
    </Routes>
  )
}
