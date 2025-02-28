<template>
  <div class="my-timesheet">
    <h2>Mes Horaires</h2>
    
    <div class="time-stats">
      <div class="stat-card">
        <i class="fas fa-clock"></i>
        <div class="stat-info">
          <span class="stat-label">Heures ce mois</span>
          <span class="stat-value">{{ monthlyHours }}h</span>
        </div>
      </div>
      
      <div class="stat-card">
        <i class="fas fa-calendar-check"></i>
        <div class="stat-info">
          <span class="stat-label">Jours présent</span>
          <span class="stat-value">{{ daysPresent }}/{{ workingDays }}</span>
        </div>
      </div>
    </div>

    <div class="timesheet-table">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Arrivée</th>
            <th>Départ</th>
            <th>Total</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in timeEntries" :key="entry.date">
            <td>{{ formatDate(entry.date) }}</td>
            <td>{{ entry.timeIn }}</td>
            <td>{{ entry.timeOut }}</td>
            <td>{{ calculateHours(entry.timeIn, entry.timeOut) }}h</td>
            <td>
              <span :class="['status-badge', entry.status]">
                {{ getStatusLabel(entry.status) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
// ... logique du composant ...
</script>

<style scoped>
.my-timesheet {
  padding: 20px;
}

.time-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 15px;
}

/* ... autres styles ... */
</style> 