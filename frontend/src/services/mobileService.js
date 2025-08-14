import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Geolocation } from '@capacitor/geolocation'
import { PushNotifications } from '@capacitor/push-notifications'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Preferences } from '@capacitor/preferences'
import { Capacitor } from '@capacitor/core'

class MobileService {
  constructor() {
    this.isNative = Capacitor.isNativePlatform()
    this.platform = Capacitor.getPlatform()
  }

  // Check if running on mobile device
  isMobile() {
    return this.isNative
  }

  // Camera functionality
  async takePhoto() {
    if (!this.isNative) {
      throw new Error('Camera not available on web platform')
    }

    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt, // Ask user: camera or gallery
      })

      return image.dataUrl
    } catch (error) {
      console.error('Camera error:', error)
      throw error
    }
  }

  // Geolocation functionality
  async getCurrentPosition() {
    if (!this.isNative) {
      // Fallback to web geolocation
      return new Promise((resolve, reject) => {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(resolve, reject)
        } else {
          reject(new Error('Geolocation not supported'))
        }
      })
    }

    try {
      const position = await Geolocation.getCurrentPosition()
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      }
    } catch (error) {
      console.error('Geolocation error:', error)
      throw error
    }
  }

  // Push notifications
  async setupPushNotifications() {
    if (!this.isNative) {
      console.log('Push notifications not available on web')
      return
    }

    try {
      // Request permission
      let permStatus = await PushNotifications.checkPermissions()
      
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions()
      }
      
      if (permStatus.receive !== 'granted') {
        throw new Error('Push notification permission denied')
      }
      
      // Register for push notifications
      await PushNotifications.register()
      
      // Listen for token registration
      PushNotifications.addListener('registration', (token) => {
        console.log(`Push registration success, token: ${token.value}`)
        // Send token to your server
        this.sendTokenToServer(token.value)
      })
      
      // Handle push notification received
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received: ', notification)
      })
      
      // Handle push notification tapped
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push notification action performed', notification)
        // Navigate to relevant screen based on notification data
        this.handleNotificationTap(notification)
      })
      
    } catch (error) {
      console.error('Push notification setup error:', error)
    }
  }

  // Send push token to server
  async sendTokenToServer(token) {
    try {
      const response = await fetch('/api/users/push-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ pushToken: token, platform: this.platform }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to register push token')
      }
    } catch (error) {
      console.error('Error sending push token:', error)
    }
  }

  // Local notifications
  async scheduleLocalNotification(title, body, id = 1, delay = 0) {
    if (!this.isNative) {
      console.log('Local notifications not available on web')
      return
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id,
            schedule: delay > 0 ? { at: new Date(Date.now() + delay) } : undefined,
          },
        ],
      })
    } catch (error) {
      console.error('Local notification error:', error)
    }
  }

  // Preferences (secure storage)
  async setPreference(key, value) {
    try {
      await Preferences.set({
        key,
        value: JSON.stringify(value),
      })
    } catch (error) {
      console.error('Error setting preference:', error)
    }
  }

  async getPreference(key) {
    try {
      const result = await Preferences.get({ key })
      return result.value ? JSON.parse(result.value) : null
    } catch (error) {
      console.error('Error getting preference:', error)
      return null
    }
  }

  // Handle notification tap
  handleNotificationTap(notification) {
    const data = notification.notification.data
    
    if (data.type === 'booking') {
      // Navigate to booking details
      window.location.href = `/booking-details/${data.bookingId}`
    } else if (data.type === 'message') {
      // Navigate to chat
      window.location.href = `/chat/${data.chatId}`
    } else if (data.type === 'verification') {
      // Navigate to verification
      window.location.href = '/verify'
    }
  }

  // Check network status
  isOnline() {
    return navigator.onLine
  }

  // Haptic feedback (if supported)
  vibrate(duration = 100) {
    if (this.isNative && 'vibrate' in navigator) {
      navigator.vibrate(duration)
    }
  }
}

export default new MobileService()