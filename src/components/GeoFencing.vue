<template>
  <div v-if="showWarning" class="geofence-warning">
    <div class="warning-content">
      <i class="fas fa-exclamation-triangle"></i>
      <p>Vous vous éloignez de la zone autorisée!</p>
      <div class="countdown">Déconnexion dans {{ countdown }} secondes</div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { auth } from '../firebase'
import { signOut } from 'firebase/auth'
import { useRouter } from 'vue-router'

export default {
  name: 'GeoFencing',
  setup() {
    const router = useRouter()
    const showWarning = ref(false)
    const countdown = ref(30)
    let watchId = null
    let countdownInterval = null
    let outOfBoundsCount = 0 // Compteur pour les positions hors zone
    const MAX_OUT_OF_BOUNDS = 3 // Nombre de vérifications hors zone avant alerte

    const config = {
      target: {
        lat: -20.9584128,
        lon: 55.3156608
      },
      toleranceInMeters: 500, // Augmenté à 500 mètres
      checkInterval: 60000, // Vérifie toutes les 60 secondes
      warningDuration: 60, // 60 secondes avant déconnexion
      accuracyThreshold: 100 // Ignore les positions avec une précision > 100m
    }

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371e3
      const φ1 = lat1 * Math.PI/180
      const φ2 = lat2 * Math.PI/180
      const Δφ = (lat2-lat1) * Math.PI/180
      const Δλ = (lon2-lon1) * Math.PI/180

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

      return R * c
    }

    const startWarningCountdown = () => {
      showWarning.value = true
      countdown.value = config.warningDuration

      if (countdownInterval) {
        clearInterval(countdownInterval)
      }

      countdownInterval = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) {
          handleSignOut()
        }
      }, 1000)
    }

    const stopWarningCountdown = () => {
      showWarning.value = false
      countdown.value = config.warningDuration
      outOfBoundsCount = 0 // Réinitialiser le compteur
      if (countdownInterval) {
        clearInterval(countdownInterval)
        countdownInterval = null
      }
    }

    const checkLocation = (position) => {
      // Vérifier la précision de la position
      if (position.coords.accuracy > config.accuracyThreshold) {
        console.log('Position ignorée - précision insuffisante:', position.coords.accuracy)
        return
      }

      const distance = calculateDistance(
        position.coords.latitude,
        position.coords.longitude,
        config.target.lat,
        config.target.lon
      )

      console.log('Distance actuelle:', Math.round(distance), 'm')

      if (distance > config.toleranceInMeters) {
        outOfBoundsCount++
        console.log('Hors zone:', outOfBoundsCount, '/', MAX_OUT_OF_BOUNDS)
        
        if (outOfBoundsCount >= MAX_OUT_OF_BOUNDS) {
          if (!showWarning.value) {
            startWarningCountdown()
          }
        }
      } else {
        if (showWarning.value) {
          stopWarningCountdown()
        }
        outOfBoundsCount = 0
      }
    }

    const handleSignOut = async () => {
      try {
        await signOut(auth)
        localStorage.removeItem('userData')
        localStorage.removeItem('userLocation')
        router.push('/')
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error)
      }
    }

    const startGeofencing = () => {
      if ('geolocation' in navigator) {
        watchId = navigator.geolocation.watchPosition(
          checkLocation,
          (error) => {
            console.error('Erreur de géolocalisation:', error)
            // Ne pas déconnecter immédiatement en cas d'erreur
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000
          }
        )
      } else {
        console.error('Géolocalisation non supportée')
      }
    }

    onMounted(() => {
      startGeofencing()
    })

    onUnmounted(() => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId)
      }
      if (countdownInterval) {
        clearInterval(countdownInterval)
      }
    })

    return {
      showWarning,
      countdown
    }
  }
}
</script>

<style scoped>
.geofence-warning {
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: #fed7d7;
  border: 1px solid #fc8181;
  border-radius: 8px;
  padding: 16px;
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}

.warning-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #c53030;
}

.warning-content i {
  font-size: 24px;
}

.countdown {
  font-weight: bold;
  font-size: 14px;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style> 