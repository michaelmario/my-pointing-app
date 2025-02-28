<template>
  <div class="dashboard-container">
    <GeoFencing />
    
    <!-- Sidebar with mobile responsive class -->
    <div class="sidebar" :class="{ 'sidebar-mobile-open': isSidebarOpen }">
      <div class="logo-section">
        <h2>Mon Espace</h2>
      </div>
      
      <div class="menu-section">
        <h3>MON ACTIVITÉ</h3>
        <RouterLink to="/my-timesheet" class="menu-item" @click="scrollToTop">
          <i class="fas fa-clock"></i>
          <span>Mes Horaires</span>
        </RouterLink>

        <RouterLink to="/my-messages" class="menu-item" @click="scrollToTop">
          <i class="fas fa-envelope"></i>
          <span>Messages</span>
          <span v-if="unreadMessages" class="badge">{{ unreadMessages }}</span>
        </RouterLink>

        <div class="user-status">
          <div class="status-indicator" :class="{ active: isInWorkZone }">
            <i class="fas fa-map-marker-alt"></i>
            <span>{{ isInWorkZone ? 'Dans la zone' : 'Hors zone' }}</span>
          </div>
          <div class="work-time">
            <i class="fas fa-hourglass-half"></i>
            <span>{{ currentWorkTime }}</span>
          </div>
        </div>

        <div class="sign-out-section">
          <div class="menu-item sign-out" @click="handleSignOut">
            <i class="fas fa-sign-out-alt"></i>
            <span>Se déconnecter</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <RouterView />
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { auth } from '../firebase'
import { signOut } from 'firebase/auth'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import GeoFencing from '../components/GeoFencing.vue'
import { getFirestore, collection, query, where, onSnapshot } from 'firebase/firestore'

export default {
  name: 'UserDashboard',
  components: {
    GeoFencing
  },
  setup() {
    const router = useRouter()
    const db = getFirestore()
    const isSidebarOpen = ref(false)
    const unreadMessages = ref(0)
    const isInWorkZone = ref(false)
    const workStartTime = ref(null)
    const currentWorkTime = ref('00:00')

    // Gérer la déconnexion
    const handleSignOut = async () => {
      try {
        await signOut(auth)
        localStorage.removeItem('userData')
        localStorage.removeItem('userLocation')
        router.push('/login')
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error)
      }
    }

    // Scroll to top
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
      if (window.innerWidth <= 768) {
        isSidebarOpen.value = false
      }
    }

    // Surveiller les messages non lus
    const watchUnreadMessages = () => {
      const messagesRef = collection(db, 'messages')
      const q = query(
        messagesRef,
        where('recipientId', '==', auth.currentUser.uid),
        where('read', '==', false)
      )

      return onSnapshot(q, (snapshot) => {
        unreadMessages.value = snapshot.size
      })
    }

    // Mettre à jour le temps de travail
    const updateWorkTime = () => {
      if (workStartTime.value && isInWorkZone.value) {
        const now = new Date()
        const diff = now - workStartTime.value
        const hours = Math.floor(diff / 3600000)
        const minutes = Math.floor((diff % 3600000) / 60000)
        currentWorkTime.value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      }
    }

    // Initialiser le compteur de temps
    const startWorkTimer = () => {
      workStartTime.value = new Date()
      setInterval(updateWorkTime, 60000) // Mise à jour toutes les minutes
    }

    onMounted(() => {
      const unsubscribe = watchUnreadMessages()
      startWorkTimer()
      return () => unsubscribe()
    })

    return {
      isSidebarOpen,
      unreadMessages,
      isInWorkZone,
      currentWorkTime,
      handleSignOut,
      scrollToTop
    }
  }
}
</script>

<style scoped>
.dashboard-container {
  display: flex;
  min-height: 100vh;
  margin-top: 50px;
}

.sidebar {
  width: 250px;
  background-color: #003952;
  color: white;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

/* ... styles existants ... */

.user-status {
  margin-top: auto;
  padding: 20px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  margin-bottom: 10px;
}

.status-indicator.active {
  background: #48bb78;
}

.work-time {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9em;
  color: #cbd5e0;
}

.badge {
  background: #e53e3e;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.75em;
  margin-left: auto;
}

/* Responsive styles */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: -250px;
    top: 0;
    height: 100vh;
    transition: left 0.3s ease;
    z-index: 999;
  }

  .sidebar-mobile-open {
    left: 0;
  }

  .main-content {
    margin-left: 0;
    width: 100%;
  }
}
</style> 