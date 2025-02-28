<template>
  <div class="history-container">
    <div class="history-header">
      <h2><i class="fas fa-history"></i> Historique des Activités</h2>
      
      <!-- Filtres -->
      <div class="filters-section">
        <div class="filter-group">
          <label>Type</label>
          <select v-model="filters.type">
            <option value="all">Tous les types</option>
            <option value="auth">Authentification</option>
            <option value="geofence">Géolocalisation</option>
            <option value="timesheet">Pointages</option>
            <option value="message">Messages</option>
            <option value="admin">Administration</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Niveau</label>
          <select v-model="filters.level">
            <option value="all">Tous les niveaux</option>
            <option value="info">Information</option>
            <option value="warning">Avertissement</option>
            <option value="error">Erreur</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Période</label>
          <select v-model="filters.period">
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="custom">Personnalisé</option>
          </select>
        </div>

        <div v-if="filters.period === 'custom'" class="date-range">
          <input type="date" v-model="filters.startDate">
          <input type="date" v-model="filters.endDate">
        </div>
      </div>

      <!-- Actions -->
      <div class="actions-section">
        <button @click="refreshLogs" class="refresh-btn">
          <i class="fas fa-sync"></i> Actualiser
        </button>
        <button @click="exportLogs" class="export-btn">
          <i class="fas fa-file-export"></i> Exporter
        </button>
      </div>
    </div>

    <!-- Tableau des logs -->
    <div class="logs-table">
      <table>
        <thead>
          <tr>
            <th>Date/Heure</th>
            <th>Type</th>
            <th>Utilisateur</th>
            <th>Action</th>
            <th>Détails</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="log in filteredLogs" 
            :key="log.id"
            :class="['log-row', log.level]"
          >
            <td>{{ formatDateTime(log.timestamp) }}</td>
            <td>
              <span class="log-type" :class="log.type">
                {{ getTypeLabel(log.type) }}
              </span>
            </td>
            <td>
              <div class="user-info">
                <img 
                  v-if="log.userPhoto" 
                  :src="log.userPhoto" 
                  :alt="log.userName"
                  class="user-avatar"
                >
                <span v-else class="user-initials">
                  {{ getInitials(log.userName) }}
                </span>
                <span>{{ log.userName }}</span>
              </div>
            </td>
            <td>{{ log.action }}</td>
            <td>
              <button 
                v-if="log.details"
                @click="showDetails(log)" 
                class="details-btn"
              >
                <i class="fas fa-info-circle"></i>
              </button>
            </td>
            <td>
              <span :class="['status-badge', log.status]">
                {{ getStatusLabel(log.status) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination">
      <button 
        :disabled="currentPage === 1"
        @click="changePage(currentPage - 1)"
      >
        <i class="fas fa-chevron-left"></i>
      </button>
      <span>Page {{ currentPage }} sur {{ totalPages }}</span>
      <button 
        :disabled="currentPage === totalPages"
        @click="changePage(currentPage + 1)"
      >
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>

    <!-- Modal de détails -->
    <div v-if="selectedLog" class="details-modal">
      <div class="modal-content">
        <h3>Détails de l'événement</h3>
        <pre>{{ JSON.stringify(selectedLog.details, null, 2) }}</pre>
        <button @click="selectedLog = null" class="close-btn">
          Fermer
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { getFirestore, collection, query, orderBy, limit, where, getDocs } from 'firebase/firestore'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export default {
  name: 'History',
  setup() {
    const db = getFirestore()
    const logs = ref([])
    const filters = ref({
      type: 'all',
      level: 'all',
      period: 'today',
      startDate: null,
      endDate: null
    })
    const currentPage = ref(1)
    const itemsPerPage = 20
    const selectedLog = ref(null)

    // Filtrer les logs
    const filteredLogs = computed(() => {
      let filtered = [...logs.value]

      if (filters.value.type !== 'all') {
        filtered = filtered.filter(log => log.type === filters.value.type)
      }

      if (filters.value.level !== 'all') {
        filtered = filtered.filter(log => log.level === filters.value.level)
      }

      // Filtrage par période
      const now = new Date()
      switch (filters.value.period) {
        case 'today':
          filtered = filtered.filter(log => {
            const logDate = new Date(log.timestamp)
            return logDate.toDateString() === now.toDateString()
          })
          break
        case 'week':
          const weekAgo = new Date(now.setDate(now.getDate() - 7))
          filtered = filtered.filter(log => new Date(log.timestamp) >= weekAgo)
          break
        case 'month':
          const monthAgo = new Date(now.setMonth(now.getMonth() - 1))
          filtered = filtered.filter(log => new Date(log.timestamp) >= monthAgo)
          break
        case 'custom':
          if (filters.value.startDate && filters.value.endDate) {
            filtered = filtered.filter(log => {
              const logDate = new Date(log.timestamp)
              return logDate >= new Date(filters.value.startDate) &&
                     logDate <= new Date(filters.value.endDate)
            })
          }
          break
      }

      return filtered
    })

    // Pagination
    const totalPages = computed(() => 
      Math.ceil(filteredLogs.value.length / itemsPerPage)
    )

    const paginatedLogs = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage
      const end = start + itemsPerPage
      return filteredLogs.value.slice(start, end)
    })

    // Charger les logs
    const loadLogs = async () => {
      try {
        const logsRef = collection(db, 'logs')
        const q = query(
          logsRef,
          orderBy('timestamp', 'desc'),
          limit(100)
        )
        const snapshot = await getDocs(q)
        logs.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      } catch (error) {
        console.error('Erreur lors du chargement des logs:', error)
      }
    }

    // Formater la date et l'heure
    const formatDateTime = (timestamp) => {
      return format(new Date(timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: fr })
    }

    // Exporter les logs
    const exportLogs = () => {
      const data = filteredLogs.value.map(log => ({
        Date: formatDateTime(log.timestamp),
        Type: getTypeLabel(log.type),
        Utilisateur: log.userName,
        Action: log.action,
        Niveau: log.level,
        Statut: getStatusLabel(log.status)
      }))

      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Logs')
      
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const dataBlob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      
      saveAs(dataBlob, `logs_${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
    }

    onMounted(loadLogs)

    return {
      logs,
      filters,
      currentPage,
      totalPages,
      selectedLog,
      filteredLogs,
      paginatedLogs,
      loadLogs,
      formatDateTime,
      exportLogs,
      // ... autres méthodes
    }
  }
}
</script>

<style scoped>
.history-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.history-header {
  margin-bottom: 30px;
}

.filters-section {
  display: flex;
  gap: 20px;
  margin: 20px 0;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-group select {
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  min-width: 150px;
}

.date-range {
  display: flex;
  gap: 10px;
}

.actions-section {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.logs-table {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
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

.log-row {
  transition: background-color 0.2s;
}

.log-row:hover {
  background-color: #f7fafc;
}

.log-row.warning {
  background-color: #fffbeb;
}

.log-row.error {
  background-color: #fef2f2;
}

.log-type {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.875rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.details-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

/* Responsive Design */
@media (max-width: 768px) {
  .filters-section {
    flex-direction: column;
  }

  .filter-group {
    width: 100%;
  }

  .logs-table {
    overflow-x: auto;
  }

  table {
    min-width: 800px;
  }
}

@media screen and (max-width: 768px) {
  .history-container {
    padding: 10px;
  }

  .filters-section {
    flex-direction: column;
  }

  .filter-group {
    width: 100%;
  }

  .actions-section {
    flex-direction: column;
    gap: 10px;
  }

  .logs-table td:before {
    content: attr(data-label);
  }

  .log-row {
    margin-bottom: 15px;
  }

  .user-info {
    padding-left: 0 !important;
  }

  .pagination {
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
}
</style> 