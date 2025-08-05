// Simple test to verify Clerk integration
import React from 'react'
import { useClerk } from '@clerk/clerk-react'

const TestClerk = () => {
  const { loaded, user } = useClerk()

  if (!loaded) {
    return <div>Loading Clerk...</div>
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Clerk Test Page</h1>
      <p>Clerk is loaded: {loaded ? 'Yes' : 'No'}</p>
      <p>User signed in: {user ? 'Yes' : 'No'}</p>
      <p>Environment key present: {import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ? 'Yes' : 'No'}</p>
      <p>Key value: {import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}</p>
    </div>
  )
}

export default TestClerk