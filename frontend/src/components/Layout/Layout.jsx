import { useState } from 'react'
import { useSelector } from 'react-redux'
import Header from './Header'
import Sidebar from './Sidebar'

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useSelector((state) => state.auth)

  return (
    <div className="min-h-screen bg-premium">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="mobile-overlay lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Header 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        user={user}
      />
      
      <div className="flex min-h-screen pt-16">
        <Sidebar 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen}
          user={user}
        />
        
        {/* Premium main content area with better spacing */}
        <main className="flex-1 lg:ml-72 transition-all duration-300 ease-out">
          <div className="px-6 py-8 sm:px-8 lg:px-12 max-w-none">
            <div className="space-y-8 fade-in">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout