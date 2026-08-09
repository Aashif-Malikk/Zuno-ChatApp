import { View, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Redirect } from 'expo-router'
import * as SecureStore from 'expo-secure-store'

export default function Index() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await SecureStore.getItemAsync('token')
        setIsLoggedIn(!!token)
      } catch (error) {
        console.error('Error reading token:', error)
        setIsLoggedIn(false)
      } finally {
        setIsChecking(false)
      }
    }
    checkToken()
  }, [])

  // Don't redirect until we actually know the answer
  if (isChecking) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  return isLoggedIn ? (
    <Redirect href="/(tabs)/Index" />
  ) : (
    <Redirect href="/(auth)/Login" />
  )
}