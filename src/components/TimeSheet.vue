<template>
  <div class="timesheet-container">
    <!-- Header avec recherche et filtres -->
    <div class="header">
      <div class="search-bar">
        <i class="fas fa-search"></i>
        <input type="text" v-model="searchQuery" placeholder="Rechercher un utilisateur...">
      </div>
      
      <div class="period-selector">
        <button 
          v-for="period in periods" 
          :key="period.value"
          :class="['period-btn', { active: selectedPeriod === period.value }]"
          @click="changePeriod(period.value)">
          {{ period.label }}
        </button>
      </div>

      <div class="date-picker" v-if="selectedPeriod === 'custom'">
        <input type="date" v-model="startDate">
        <span>à</span>
        <input type="date" v-model="endDate">
      </div>
    </div>

    <!-- Vue mobile en cards -->
    <div class="mobile-cards">
      <div v-for="user in filteredUsers" :key="user.uid" class="user-card">
        <div class="card-header">
          <div class="user-info">
            <img v-if="user.photoURL" :src="user.photoURL" :alt="user.displayName" class="user-avatar">
            <span v-else class="user-initials">{{ getInitials(user.displayName) }}</span>
            <div class="user-details">
              <span class="user-name">{{ user.displayName }}</span>
              <span class="user-email">{{ user.email }}</span>
            </div>
          </div>
          <span :class="['status-badge', user.isActive ? 'active' : 'inactive']">
            {{ user.isActive ? 'Actif' : 'Inactif' }}
          </span>
        </div>
        <div class="card-body">
          <div class="info-row">
            <span class="label">Dernière connexion:</span>
            <span class="value">{{ formatDate(user.lastLogin) }}</span>
          </div>
          <div class="info-row">
            <span class="label">Localisation:</span>
            <span class="value">
              {{ user.lastLocation ? formatLocation(user.lastLocation) : 'Non disponible' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Vue desktop en tableau -->
    <div class="desktop-table">
      <table>
        <thead>
          <tr>
            <th>Utilisateur</th>
            <th>Email</th>
            <th>Dernière connexion</th>
            <th>Localisation</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.uid">
            <td class="user-info">
              <img v-if="user.photoURL" :src="user.photoURL" :alt="user.displayName" class="user-avatar">
              <span v-else class="user-initials">{{ getInitials(user.displayName) }}</span>
              <span class="user-name">{{ user.displayName }}</span>
            </td>
            <td>{{ user.email }}</td>
            <td>{{ formatDate(user.lastLogin) }}</td>
            <td>
              <span v-if="user.lastLocation">
                {{ formatLocation(user.lastLocation) }}
              </span>
              <span v-else>Non disponible</span>
            </td>
            <td>
              <span :class="['status-badge', user.isActive ? 'active' : 'inactive']">
                {{ user.isActive ? 'Actif' : 'Inactif' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { getFirestore, collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default {
  name: 'TimeSheet',
  setup() {
    const db = getFirestore()
    const users = ref([])
    const searchQuery = ref('')
    const selectedPeriod = ref('today')
    const startDate = ref('')
    const endDate = ref('')

    const periods = [
      { label: "Aujourd'hui", value: 'today' },
      { label: 'Cette semaine', value: 'week' },
      { label: 'Ce mois', value: 'month' },
      { label: 'Personnalisé', value: 'custom' }
    ]

    const fetchUsers = async (period) => {
      try {
        const usersRef = collection(db, 'users')
        let q = query(usersRef, orderBy('lastLogin', 'desc'))

        // Ajouter des filtres selon la période
        const now = new Date()
        const startOfDay = new Date(now.setHours(0, 0, 0, 0))

        switch (period) {
          case 'today':
            q = query(usersRef, 
              where('lastLogin', '>=', startOfDay.toISOString()),
              orderBy('lastLogin', 'desc'))
            break
          case 'week':
            const lastWeek = new Date(now.setDate(now.getDate() - 7))
            q = query(usersRef,
              where('lastLogin', '>=', lastWeek.toISOString()),
              orderBy('lastLogin', 'desc'))
            break
          case 'month':
            const lastMonth = new Date(now.setMonth(now.getMonth() - 1))
            q = query(usersRef,
              where('lastLogin', '>=', lastMonth.toISOString()),
              orderBy('lastLogin', 'desc'))
            break
          case 'custom':
            if (startDate.value && endDate.value) {
              q = query(usersRef,
                where('lastLogin', '>=', startDate.value),
                where('lastLogin', '<=', endDate.value),
                orderBy('lastLogin', 'desc'))
            }
            break
        }

        const querySnapshot = await getDocs(q)
        users.value = querySnapshot.docs.map(doc => doc.data())
      } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error)
      }
    }

    const filteredUsers = computed(() => {
      if (!searchQuery.value) return users.value
      
      const query = searchQuery.value.toLowerCase()
      return users.value.filter(user => 
        user.displayName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      )
    })

    const changePeriod = (period) => {
      selectedPeriod.value = period
      fetchUsers(period)
    }

    const formatDate = (date) => {
      return format(new Date(date), 'dd MMMM yyyy HH:mm', { locale: fr })
    }

    const formatLocation = (location) => {
      return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
    }

    const getInitials = (name) => {
      return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
    }

    onMounted(() => {
      fetchUsers('today')
    })

    return {
      users,
      searchQuery,
      selectedPeriod,
      startDate,
      endDate,
      periods,
      filteredUsers,
      changePeriod,
      formatDate,
      formatLocation,
      getInitials
    }
  }
}
</script>

<style scoped>
.timesheet-container {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  align-items: center;
  flex-wrap: wrap;
}

.search-bar {
  flex: 1;
  position: relative;
  min-width: 200px;
}

.search-bar input {
  width: 100%;
  padding: 10px 35px;
  border: 1px solid #e2e8f0;
  border-radius: 5px;
}

.search-bar i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #718096;
}

.period-selector {
  display: flex;
  gap: 10px;
}

.period-btn {
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 5px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.period-btn.active {
  background: #003952;
  color: white;
  border-color: #003952;
}

.date-picker {
  display: flex;
  gap: 10px;
  align-items: center;
}

.timesheet-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

th {
  background-color: #f7fafc;
  font-weight: 600;
  color: #4a5568;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.user-initials {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #003952;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.875rem;
}

.status-badge.active {
  background-color: #c6f6d5;
  color: #2f855a;
}

.status-badge.inactive {
  background-color: #fed7d7;
  color: #c53030;
}

/* Styles pour la vue mobile */
.mobile-cards {
  display: none;
  gap: 16px;
  flex-direction: column;
}

.user-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
}

.card-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
}

.card-body {
  padding: 16px;
}

.info-row {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}

.info-row .label {
  font-size: 0.875rem;
  color: #718096;
  margin-bottom: 4px;
}

.info-row .value {
  font-weight: 500;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-email {
  font-size: 0.875rem;
  color: #718096;
}

/* Media queries pour le responsive */
@media screen and (max-width: 768px) {
  .desktop-table {
    display: none;
  }

  .mobile-cards {
    display: flex;
  }

  .header {
    flex-direction: column;
    gap: 16px;
  }

  .period-selector {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .period-btn {
    width: 100%;
    padding: 8px;
    font-size: 0.875rem;
  }

  .date-picker {
    flex-direction: column;
    gap: 8px;
  }

  .date-picker input {
    width: 100%;
  }

  .timesheet-container {
    padding: 10px;
  }

  .timesheet-header {
    flex-direction: column;
    gap: 10px;
  }

  .timesheet-filters {
    flex-direction: column;
    width: 100%;
  }

  .timesheet-grid td:before {
    content: attr(data-label);
  }

  .employee-row {
    margin-bottom: 20px;
    padding: 10px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .time-cell {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .time-input {
    width: 50%;
  }
}

/* Ajustements pour très petits écrans */
@media screen and (max-width: 480px) {
  .timesheet-container {
    padding: 12px;
  }

  .period-selector {
    grid-template-columns: 1fr;
  }

  .user-card {
    font-size: 0.875rem;
  }
}

/* Styles pour la transition entre les vues */
.mobile-cards, .desktop-table {
  transition: all 0.3s ease;
}

/* Amélioration de l'accessibilité */
@media (prefers-reduced-motion: reduce) {
  .mobile-cards, .desktop-table {
    transition: none;
  }
}
</style> 