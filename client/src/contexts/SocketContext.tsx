import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { io, Socket } from 'socket.io-client'
import { RootState } from '../store/store'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false
})

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

interface SocketProviderProps {
  children: React.ReactNode
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    if (isAuthenticated && token) {
      const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        auth: {
          token
        }
      })

      newSocket.on('connect', () => {
        setIsConnected(true)
        console.log('Connected to server')
      })

      newSocket.on('disconnect', () => {
        setIsConnected(false)
        console.log('Disconnected from server')
      })

      newSocket.on('error', (error) => {
        console.error('Socket error:', error)
      })

      setSocket(newSocket)

      return () => {
        newSocket.close()
        setSocket(null)
        setIsConnected(false)
      }
    } else {
      if (socket) {
        socket.close()
        setSocket(null)
        setIsConnected(false)
      }
    }
  }, [isAuthenticated, token])

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}