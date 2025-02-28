<template>
  <div class="settings-container">
    <h2 class="settings-title">
      <i class="fas fa-cog"></i> Paramètres Administrateur
    </h2>

    <!-- Navigation des paramètres -->
    <div class="settings-nav">
      <button 
        v-for="section in sections" 
        :key="section.id"
        :class="['nav-btn', { active: activeSection === section.id }]"
        @click="activeSection = section.id"
      >
        <i :class="section.icon"></i>
        {{ section.title }}
      </button>
    </div>

    <!-- Paramètres Généraux -->
    <div v-if="activeSection === 'general'" class="settings-section">
      <h3>Paramètres Généraux</h3>
      
      <div class="setting-group">
        <h4>Zone de Travail</h4>
        <div class="form-group">
          <label>Rayon de la zone (mètres)</label>
          <input 
            v-model.number="settings.workZoneRadius" 
            type="number" 
            min="100"
            @change="updateSettings"
          >
        </div>
        <div class="form-group">
          <label>Centre de la zone</label>
          <div class="location-picker">
            <input v-model="settings.workZoneCenter.lat" type="number" step="0.000001">
            <input v-model="settings.workZoneCenter.lon" type="number" step="0.000001">
            <button @click="getCurrentLocation" class="action-btn">
              <i class="fas fa-location-arrow"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="setting-group">
        <h4>Horaires de Travail</h4>
        <div class="work-hours">
          <div class="form-group">
            <label>Début</label>
            <input v-model="settings.workHours.start" type="time">
          </div>
          <div class="form-group">
            <label>Fin</label>
            <input v-model="settings.workHours.end" type="time">
          </div>
        </div>
      </div>
    </div>

    <!-- Notifications -->
    <div v-if="activeSection === 'notifications'" class="settings-section">
      <h3>Paramètres des Notifications</h3>
      
      <div class="setting-group">
        <h4>Notifications Email</h4>
        <div class="toggle-group">
          <label class="toggle-label">
            <input 
              type="checkbox" 
              v-model="settings.notifications.newUser"
              @change="updateSettings"
            >
            Nouveaux utilisateurs
          </label>
          <label class="toggle-label">
            <input 
              type="checkbox" 
              v-model="settings.notifications.userOutOfZone"
              @change="updateSettings"
            >
            Utilisateur hors zone
          </label>
          <label class="toggle-label">
            <input 
              type="checkbox" 
              v-model="settings.notifications.urgentMessages"
              @change="updateSettings"
            >
            Messages urgents
          </label>
        </div>
      </div>

      <div class="setting-group">
        <h4>Destinataires des Notifications</h4>
        <div class="form-group">
          <input 
            v-model="newEmail" 
            type="email" 
            placeholder="Ajouter un email"
          >
          <button @click="addNotificationEmail" class="action-btn">
            <i class="fas fa-plus"></i>
          </button>
        </div>
        <div class="email-list">
          <div v-for="email in settings.notifications.emails" :key="email" class="email-item">
            <span>{{ email }}</span>
            <button @click="removeEmail(email)" class="remove-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Sécurité -->
    <div v-if="activeSection === 'security'" class="settings-section">
      <h3>Paramètres de Sécurité</h3>
      
      <div class="setting-group">
        <h4>Politique de Mot de Passe</h4>
        <div class="form-group">
          <label>Longueur minimale</label>
          <input 
            v-model.number="settings.security.minPasswordLength" 
            type="number" 
            min="8"
            @change="updateSettings"
          >
        </div>
        <div class="toggle-group">
          <label class="toggle-label">
            <input 
              type="checkbox" 
              v-model="settings.security.requireSpecialChar"
              @change="updateSettings"
            >
            Caractères spéciaux requis
          </label>
          <label class="toggle-label">
            <input 
              type="checkbox" 
              v-model="settings.security.requireNumbers"
              @change="updateSettings"
            >
            Chiffres requis
          </label>
        </div>
      </div>

      <div class="setting-group">
        <h4>Sessions</h4>
        <div class="form-group">
          <label>Durée maximale de session (heures)</label>
          <input 
            v-model.number="settings.security.sessionDuration" 
            type="number"
            @change="updateSettings"
          >
        </div>
        <button @click="invalidateAllSessions" class="danger-btn">
          Déconnecter tous les utilisateurs
        </button>
      </div>
    </div>

    <!-- Sauvegarde -->
    <div v-if="activeSection === 'backup'" class="settings-section">
      <h3>Sauvegarde et Export</h3>
      
      <div class="setting-group">
        <h4>Sauvegarde Automatique</h4>
        <div class="form-group">
          <label>Fréquence</label>
          <select v-model="settings.backup.frequency" @change="updateSettings">
            <option value="daily">Quotidienne</option>
            <option value="weekly">Hebdomadaire</option>
            <option value="monthly">Mensuelle</option>
          </select>
        </div>
        <button @click="createBackup" class="action-btn">
          <i class="fas fa-download"></i> Créer une sauvegarde maintenant
        </button>
      </div>

      <div class="setting-group">
        <h4>Export des Données</h4>
        <div class="export-buttons">
          <button @click="exportUsers" class="action-btn">
            <i class="fas fa-users"></i> Exporter les utilisateurs
          </button>
          <button @click="exportMessages" class="action-btn">
            <i class="fas fa-envelope"></i> Exporter les messages
          </button>
          <button @click="exportAttendance" class="action-btn">
            <i class="fas fa-clock"></i> Exporter les présences
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

export default {
  name: 'Settings',
  setup() {
    const db = getFirestore()
    const activeSection = ref('general')
    const newEmail = ref('')
    
    const sections = [
      { id: 'general', title: 'Général', icon: 'fas fa-cog' },
      { id: 'notifications', title: 'Notifications', icon: 'fas fa-bell' },
      { id: 'security', title: 'Sécurité', icon: 'fas fa-shield-alt' },
      { id: 'backup', title: 'Sauvegarde', icon: 'fas fa-database' }
    ]

    const settings = ref({
      workZoneRadius: 500,
      workZoneCenter: {
        lat: -20.9584128,
        lon: 55.3156608
      },
      workHours: {
        start: '08:00',
        end: '17:00'
      },
      notifications: {
        newUser: true,
        userOutOfZone: true,
        urgentMessages: true,
        emails: []
      },
      security: {
        minPasswordLength: 8,
        requireSpecialChar: true,
        requireNumbers: true,
        sessionDuration: 24
      },
      backup: {
        frequency: 'daily'
      }
    })

    // Charger les paramètres
    const loadSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'admin'))
        if (settingsDoc.exists()) {
          settings.value = { ...settings.value, ...settingsDoc.data() }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error)
      }
    }

    // Mettre à jour les paramètres
    const updateSettings = async () => {
      try {
        await updateDoc(doc(db, 'settings', 'admin'), settings.value)
      } catch (error) {
        console.error('Erreur lors de la mise à jour des paramètres:', error)
      }
    }

    // Autres fonctions...

    onMounted(loadSettings)

    return {
      activeSection,
      sections,
      settings,
      newEmail,
      updateSettings,
      // ... autres retours
    }
  }
}
</script>

<style scoped>
.settings-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.settings-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 30px;
}

.settings-nav {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.nav-btn {
  padding: 10px 20px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-btn.active {
  background: #003952;
  color: white;
  border-color: #003952;
}

.settings-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.setting-group {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #4a5568;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
}

.toggle-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.action-btn {
  padding: 8px 16px;
  background: #003952;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.danger-btn {
  background: #e53e3e;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* Responsive Design */
@media (max-width: 768px) {
  .settings-nav {
    flex-direction: column;
  }

  .nav-btn {
    width: 100%;
  }

  .export-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
}

@media screen and (max-width: 768px) {
  .settings-container {
    padding: 10px;
  }

  .settings-nav {
    flex-direction: column;
  }

  .nav-btn {
    width: 100%;
  }

  .setting-group {
    padding: 10px;
  }

  .work-hours {
    flex-direction: column;
  }

  .location-picker {
    flex-direction: column;
    gap: 10px;
  }

  .email-list {
    flex-direction: column;
  }

  .email-item {
    width: 100%;
  }
}
</style> 