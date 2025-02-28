<template>
  <div class="dashboard-container">
    <GeoFencing />
    <!-- Hamburger Button -->
    <button class="hamburger-btn" @click="toggleSidebar">
      <i class="fas fa-bars"></i>
    </button>

    <!-- Sidebar with mobile responsive class -->
    <div class="sidebar" :class="{ 'sidebar-mobile-open': isSidebarOpen }">
      <div class="logo-section">
        <h2>Dashboard</h2>
      </div>
      
      <div class="menu-section">
        <h3>ATTENDANCE</h3>
        <RouterLink to="/timeSheet" class="menu-item active" @click="scrollToTop">
          <i class="fas fa-clock"></i>
          <span>Timesheets</span>
        </RouterLink>
        <RouterLink to="/settings"  class="menu-item" @click="scrollToTop">
          <i class="fas fa-cog"></i>
          <span>Settings</span>
        </RouterLink> 
        <RouterLink to="/user-management" class="menu-item" @click="scrollToTop">
          <i class="fas fa-user-lock"></i>
          <span>Roles & Permissions</span>
        </RouterLink>
        <h3>PAYROLL</h3>
         <RouterLink to="/history" class="menu-item" @click="scrollToTop">
          <i class="fas fa-history"></i>
          <span>Histories</span>
        </RouterLink>
        

        <h3>ADMINISTRATION</h3>
        <div class="menu-item" @click="scrollToTop">
          <i class="fas fa-building"></i>
          <span>Organization</span>
        </div>
       <RouterLink 
          v-if="userRole === 'user-admin'"
          to="/user-management" 
          class="menu-item"
          @click="scrollToTop"
        >
          <i class="fas fa-users-cog"></i>
          <span>Gestion Utilisateurs</span>
        </RouterLink>
         <RouterLink to="/messages" class="menu-item" @click="scrollToTop">
          <i class="fas fa-envelope"></i>
          <span>Messages</span>
        </RouterLink>

        <div class="sign-out-section">
          <div class="menu-item sign-out" @click="handleSignOut">
            <i class="fas fa-sign-out-alt"></i>
            <span>Se déconnecter</span>
          </div>
        </div>
      </div>
    </div>
    <div class="main-content">
      <RouterView v-slot="{ Component }">
        <Suspense>
          <component :is="Component" />
          <template #fallback>
            <div>Chargement...</div>
          </template>
        </Suspense>
      </RouterView>
    </div>
    
    <!-- Main Content -->
    
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { auth } from '../firebase'
import { signOut } from 'firebase/auth'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import GeoFencing from '../components/GeoFencing.vue'

export default {
  name: 'AdminDashboard',
  components: {
    GeoFencing
  },
  setup() {
    const router = useRouter()
    const isSidebarOpen = ref(false)

    const handleSignOut = async () => {
      try {
        await signOut(auth)
        localStorage.removeItem('userData')
        localStorage.removeItem('userLocation')
        console.log('Déconnexion réussie')
        router.push('/')
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error)
      }
    }

    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
      // Fermer le sidebar sur mobile après le clic
      if (window.innerWidth <= 768) {
        isSidebarOpen.value = false
      }
    }

    const toggleSidebar = () => {
      isSidebarOpen.value = !isSidebarOpen.value
    }

    return {
      handleSignOut,
      scrollToTop,
      isSidebarOpen,
      toggleSidebar
    }
  },
  data() {
    return {
      selectedMonth: '2023-05',
      daysInMonth: 31,
      employees: [
        {
          id: 1,
          name: 'Mario Achille',
          role: 'Développeur Full Stack',
          avatarClass: 'has-image',
          initials: 'MA',
          timesheet: {
            1: { type: 'holiday', value: 'H' },
            2: { type: 'present', value: '8' },
            3: { type: 'sick', value: 'S' },
            4: { type: 'holiday', value: 'H' },
            5: { type: 'present', value: '8' }
          }
        },
        // Add more employees here
      ]
    }
  },
  methods: {
    getCellClass(employee, day) {
      const entry = employee.timesheet[day]
      if (!entry) return ''
      return entry.type
    },
    getCellContent(employee, day) {
      const entry = employee.timesheet[day]
      if (!entry) return ''
      return entry.value
    }
  }
}
</script>

<style scoped>
.dashboard-container {
  display: flex;
  min-height: 100vh;
  margin-top:50px;
}

.sidebar {
  width: 250px;
  background-color: #003952;
  color: white;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.logo-section {
  margin-bottom: 30px;
}

.logo-section h2 {
  font-size: 18px;
  font-weight: bold;
}

.menu-section {
  display: flex;
  flex-direction: column;
  flex: 1;
  margin-top: 30px;
}

.menu-section h3 {
  font-size: 12px;
  color: #718096;
  margin: 20px 0 10px;
}

.menu-item {
  padding: 12px 15px;
  margin: 5px 0;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
}

.menu-item.active {
  background-color: #0056b3;
}

.sign-out-section {
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.menu-item.sign-out {
  color: #ff4757;
  margin-top: auto;
}

.menu-item.sign-out:hover {
  background-color: rgba(255, 71, 87, 0.1);
}

.main-content {
  flex: 1;
  padding: 20px;
  background-color: #f7fafc;
}

.header {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}

.search-bar {
  flex: 1;
  position: relative;
}

.search-bar input {
  width: 100%;
  padding: 10px 35px;
  border: 1px solid #e2e8f0;
  border-radius: 5px;
}

.timesheet-grid {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.employee-row {
  display: flex;
  border-bottom: 1px solid #e2e8f0;
  padding: 10px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #4299e1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
}

.employee-info {
  display: flex;
  align-items: center;
  gap: 15px;
  width: 200px;
}

.timesheet-cells {
  display: flex;
  flex: 1;
  gap: 5px;
}

.time-cell {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.time-cell.holiday {
  background-color: #fed7d7;
  color: #e53e3e;
}

.time-cell.present {
  background-color: #c6f6d5;
  color: #38a169;
}

.time-cell.sick {
  background-color: #bee3f8;
  color: #3182ce;
}

.grid-header {
  display: flex;
  border-bottom: 1px solid #e2e8f0;
  padding: 10px;
}

.employee-col {
  width: 200px;
  font-weight: 500;
}

.days-header {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.header-row {
  display: flex;
  gap: 5px;
}

.day-cell {
  width: 30px;
  text-align: center;
  font-size: 0.9em;
  color: #4a5568;
}

.numbers .day-cell {
  color: #1a202c;
  font-weight: 500;
}

.hamburger-btn {
  display: none;
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: 1000;
  background: #1a365d;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
  font-size:1.2rem;
  width: 50px !important;
  height: 50px;
}

/* Mobile Responsive Styles */
@media screen and (max-width: 768px) {
  .hamburger-btn {
    display: block;
  }

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

/* Optional: Add overlay when sidebar is open on mobile */
.dashboard-container::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;
  display: none;
}

@media screen and (max-width: 768px) {
  .sidebar-mobile-open + .main-content + .dashboard-container::before {
    display: block;
  }
}

/* Adjust header for mobile */
@media screen and (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 10px;
    padding: 10px;
  }

  .search-bar,
  .timesheet-selector,
  .date-picker {
    width: 100%;
  }
}

/* Make timesheet grid scrollable on mobile */
@media screen and (max-width: 768px) {
  .timesheet-grid {
    overflow-x: auto;
    padding-bottom: 15px;
  }

  .grid-header,
  .employee-row {
    min-width: 800px;
  }
}

/* Ajout d'une transition fluide pour le défilement */
html {
  scroll-behavior: smooth;
}

/* Support pour les navigateurs qui préfèrent moins de mouvement */
@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}

/* Amélioration des styles responsifs */
@media screen and (max-width: 768px) {
  .dashboard-container {
    position: relative;
  }

  .hamburger-btn {
    position: fixed;
    top: 10px;
    left: 10px;
    z-index: 1001;
    background: #003952;
    color: white;
    border: none;
    padding: 12px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .sidebar {
    position: fixed;
    left: -250px;
    top: 0;
    height: 100vh;
    transition: left 0.3s ease;
    z-index: 1000;
    width: 250px;
  }

  .sidebar-mobile-open {
    left: 0;
    box-shadow: 2px 0 8px rgba(0,0,0,0.1);
  }

  .main-content {
    margin-left: 0;
    padding-top: 60px;
  }

  /* Overlay quand le sidebar est ouvert */
  .sidebar-mobile-open + .main-content::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 999;
  }
}
</style> 