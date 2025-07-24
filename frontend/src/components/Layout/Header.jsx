import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { logout } from '../../store/slices/authSlice'

const Header = ({ sidebarOpen, setSidebarOpen, user }) => {
  const dispatch = useDispatch()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = () => {
    dispatch(logout())
  }

  return (
    <div className="top-bar">
      <div className="search-bar">
        <div className="search-icon">🔍</div>
        <input 
          type="text" 
          className="search-input" 
          placeholder="Search..."
        />
      </div>
      <div className="header-actions">
        <button className="btn-secondary">Profile</button>
        <button className="btn-primary">Manage Services</button>
      </div>
    </div>
  )
}

export default Header