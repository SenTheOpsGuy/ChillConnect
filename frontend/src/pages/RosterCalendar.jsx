import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  fetchOrganizationRoster,
  fetchMyShifts,
  fetchLeaveCalendar,
  clearError,
} from '../store/slices/rosterSlice'
import { fetchLeaveCalendar as fetchLeaves } from '../store/slices/leaveSlice'

const RosterCalendar = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const { organizationRoster, myShifts, loading, error } = useSelector((state) => state.roster)
  const { leaveCalendar } = useSelector((state) => state.leave)

  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('month') // 'month', 'week', 'my-shifts'
  const [selectedFilters, setSelectedFilters] = useState({
    department: '',
    location: '',
    role: '',
  })

  const isManagerOrAdmin = ['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(user?.role)

  useEffect(() => {
    loadCalendarData()
  }, [currentDate, viewMode, selectedFilters])

  const loadCalendarData = () => {
    const { startDate, endDate } = getDateRange()

    if (viewMode === 'my-shifts') {
      dispatch(fetchMyShifts({ startDate, endDate }))
    } else if (isManagerOrAdmin) {
      dispatch(fetchOrganizationRoster({
        startDate,
        endDate,
        ...selectedFilters,
      }))
    } else {
      dispatch(fetchMyShifts({ startDate, endDate }))
    }

    // Also load leave calendar
    dispatch(fetchLeaves({ startDate, endDate }))
  }

  const getDateRange = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)

      return {
        startDate: startOfWeek.toISOString(),
        endDate: endOfWeek.toISOString(),
      }
    }

    // Month view
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0, 23, 59, 59)

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }
  }

  const navigatePrevious = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
  }

  const navigateNext = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const navigateToday = () => {
    setCurrentDate(new Date())
  }

  const formatMonthYear = () => {
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const getCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startingDayOfWeek = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const getShiftsForDate = (date) => {
    if (!date) {return []}

    const dateStr = date.toISOString().split('T')[0]
    const roster = viewMode === 'my-shifts' ? myShifts : organizationRoster

    return roster.filter((shift) => {
      const shiftStart = new Date(shift.startTime).toISOString().split('T')[0]
      return shiftStart === dateStr
    })
  }

  const getLeavesForDate = (date) => {
    if (!date) {return []}

    const dateTime = date.getTime()

    return leaveCalendar.filter((leave) => {
      const leaveStart = new Date(leave.startDate).getTime()
      const leaveEnd = new Date(leave.endDate).getTime()
      return dateTime >= leaveStart && dateTime <= leaveEnd
    })
  }

  const handleFilterChange = (key, value) => {
    setSelectedFilters((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Employee Roster</h1>
          <p className="mt-2 text-gray-600">View employee schedules and leaves</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* View Mode Selector */}
            <div className="flex gap-2">
              {isManagerOrAdmin && (
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    viewMode === 'month'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Organization
                </button>
              )}
              <button
                onClick={() => setViewMode('my-shifts')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'my-shifts'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                My Shifts
              </button>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center gap-4">
              <button
                onClick={navigatePrevious}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ← Prev
              </button>
              <button
                onClick={navigateToday}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Today
              </button>
              <button
                onClick={navigateNext}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Next →
              </button>
              <span className="font-semibold text-lg">{formatMonthYear()}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/leaves/request')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Request Leave
              </button>
              {isManagerOrAdmin && (
                <button
                  onClick={() => navigate('/leaves/manage')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Manage Leaves
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading calendar...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="bg-gray-50 px-2 py-3 text-center text-sm font-semibold text-gray-700">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {getCalendarDays().map((date, index) => {
                  const shifts = date ? getShiftsForDate(date) : []
                  const leaves = date ? getLeavesForDate(date) : []
                  const isToday = date && date.toDateString() === new Date().toDateString()

                  return (
                    <div
                      key={index}
                      className={`bg-white min-h-[120px] p-2 ${
                        !date ? 'bg-gray-50' : ''
                      } ${isToday ? 'bg-blue-50' : ''}`}
                    >
                      {date && (
                        <>
                          <div className={`text-sm font-semibold mb-2 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                            {date.getDate()}
                          </div>

                          {/* Shifts */}
                          {shifts.map((shift) => (
                            <div
                              key={shift.id}
                              className="mb-1 px-2 py-1 rounded text-xs truncate cursor-pointer hover:opacity-80"
                              style={{ backgroundColor: `${shift.color}20`, borderLeft: `3px solid ${shift.color}` }}
                              title={`${shift.title} - ${shift.user.profile?.firstName} ${shift.user.profile?.lastName}`}
                            >
                              <div className="font-medium truncate">{shift.title}</div>
                              {viewMode !== 'my-shifts' && (
                                <div className="text-gray-600 truncate">
                                  {shift.user.profile?.firstName} {shift.user.profile?.lastName}
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Leaves */}
                          {leaves.map((leave) => (
                            <div
                              key={leave.id}
                              className="mb-1 px-2 py-1 rounded text-xs truncate bg-yellow-100 border-l-3 border-yellow-500"
                              title={`Leave: ${leave.user.profile?.firstName} ${leave.user.profile?.lastName}`}
                            >
                              <div className="font-medium truncate">🏖️ Leave</div>
                              {viewMode !== 'my-shifts' && (
                                <div className="text-gray-600 truncate">
                                  {leave.user.profile?.firstName} {leave.user.profile?.lastName}
                                </div>
                              )}
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Legend</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-200 border-l-4 border-green-500"></div>
              <span className="text-sm text-gray-700">Shift</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border-l-4 border-yellow-500"></div>
              <span className="text-sm text-gray-700">Leave</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-50 border border-blue-200"></div>
              <span className="text-sm text-gray-700">Today</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RosterCalendar
