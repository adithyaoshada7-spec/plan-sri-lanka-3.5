import { Route, Routes } from 'react-router-dom'
import { StructuredData } from './components/StructuredData'
import { AdminPage } from './pages/AdminPage'
import { HomePage } from './pages/HomePage'
import { PropertyDetailPage } from './pages/PropertyDetailPage'

function App() {
  return (
    <>
      <StructuredData />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/property/:propertyId" element={<PropertyDetailPage />} />
      </Routes>
    </>
  )
}

export default App
