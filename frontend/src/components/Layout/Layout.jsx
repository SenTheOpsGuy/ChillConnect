import { useState } from 'react'
import { useSelector } from 'react-redux'
import Header from './Header'
import Sidebar from './Sidebar'

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useSelector((state) => state.auth)

  return (
    <div className="min-h-screen bg-white">
      <Header 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        user={user}
      />
      
      <div className="flex">
        <Sidebar 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen}
          user={user}
        />
        
        {/* Responsive main content area */}
        <main className="flex-1 md:ml-72 transition-all duration-300 ease-out min-h-screen">
          <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="space-y-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout