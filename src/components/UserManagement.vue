<template>
  <div class="user-management">
    <div class="tabs">
      <button 
        :class="['tab-btn', { active: activeTab === 'users' }]"
        @click="activeTab = 'users'"
      >
        <i class="fas fa-users"></i> Gestion Utilisateurs
      </button>
      <button 
        :class="['tab-btn', { active: activeTab === 'messages' }]"
        @click="activeTab = 'messages'"
      >
        <i class="fas fa-envelope"></i> Messages
      </button>
    </div>

    <!-- Gestion des utilisateurs -->
    <div v-if="activeTab === 'users'" class="users-section">
      <div class="actions-bar">
        <button @click="openAddUserModal" class="add-btn">
          <i class="fas fa-user-plus"></i> Ajouter Utilisateur
        </button>
        <div class="search-bar">
          <i class="fas fa-search"></i>
          <input type="text" v-model="userSearchQuery" placeholder="Rechercher un utilisateur...">
        </div>
      </div>

      <div class="users-table">
        <table>
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.uid">
              <td data-label="Utilisateur" class="user-info">
                <img v-if="user.photoURL" :src="user.photoURL" :alt="user.displayName" class="user-avatar">
                <span v-else class="user-initials">{{ getInitials(user.displayName) }}</span>
                <span>{{ user.displayName }}</span>
              </td>
              <td data-label="Email">{{ user.email }}</td>
              <td data-label="Rôle">
                <select v-model="user.role" @change="updateUserRole(user)">
                  <option value="user">Utilisateur</option>
                  <option value="user-admin">Admin</option>
                </select>
              </td>
              <td>
                <toggle-switch 
                  v-model="user.isActive"
                  @change="updateUserStatus(user)"
                />
              </td>
              <td class="actions">
                <button @click="editUser(user)" class="icon-btn">
                  <i class="fas fa-edit"></i>
                </button>
                <button @click="deleteUser(user)" class="icon-btn delete">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Gestion des messages -->
    <div v-if="activeTab === 'messages'" class="messages-section">
      <div class="message-compose">
        <h3>Nouveau Message</h3>
        <div class="recipients">
          <select v-model="newMessage.recipients">
            <option value="all">Tous les utilisateurs</option>
            <option value="active">Utilisateurs actifs</option>
            <option value="specific">Utilisateurs spécifiques</option>
          </select>
          <div v-if="newMessage.recipients === 'specific'" class="user-select">
            <multiselect
              v-model="selectedUsers"
              :options="users"
              :multiple="true"
              label="displayName"
              track-by="uid"
              placeholder="Sélectionner des utilisateurs"
            />
          </div>
        </div>
        <div class="message-input">
          <input v-model="newMessage.title" placeholder="Titre du message" class="message-title">
          <textarea 
            v-model="newMessage.content" 
            placeholder="Contenu du message"
            rows="4"
          ></textarea>
        </div>
        <div class="message-actions">
          <button @click="sendMessage" class="send-btn">
            <i class="fas fa-paper-plane"></i> Envoyer
          </button>
        </div>
      </div>

      <div class="message-history">
        <h3>Historique des Messages</h3>
        <div class="message-list">
          <div v-for="message in messages" :key="message.id" class="message-card">
            <div class="message-header">
              <h4>{{ message.title }}</h4>
              <span class="message-date">{{ formatDate(message.createdAt) }}</span>
            </div>
            <p class="message-content">{{ message.content }}</p>
            <div class="message-footer">
              <span class="recipients-info">
                Envoyé à: {{ formatRecipients(message.recipients) }}
              </span>
              <button @click="deleteMessage(message)" class="delete-btn">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal d'édition utilisateur -->
    <modal v-if="showEditModal" @close="showEditModal = false">
      <template #header>
        <h3>Modifier Utilisateur</h3>
      </template>
      <template #body>
        <form @submit.prevent="saveUserEdit">
          <!-- Formulaire d'édition -->
        </form>
      </template>
    </modal>

    <!-- Modal Ajouter Utilisateur -->
    <Teleport to="body">
      <div v-if="showAddUserModal" class="modal">
        <div class="modal-content">
          <h3>Ajouter un Utilisateur</h3>
          <form @submit.prevent="addUser">
            <div class="form-group">
              <label>Email</label>
              <input 
                v-model="newUser.email" 
                type="email" 
                required
                placeholder="email@exemple.com"
              >
            </div>
            <div class="form-group">
              <label>Nom complet</label>
              <input 
                v-model="newUser.displayName" 
                type="text" 
                required
                placeholder="Nom Prénom"
              >
            </div>
            <div class="form-group">
              <label>Rôle</label>
              <select v-model="newUser.role" required>
                <option value="user">Utilisateur</option>
                <option value="admin">Administrateur</option>
                <option value="user-admin">Super Admin</option>
              </select>
            </div>
            <div class="form-group">
              <label>Mot de passe temporaire</label>
              <input 
                v-model="newUser.password" 
                type="password" 
                required
                minlength="6"
                placeholder="Minimum 6 caractères"
              >
            </div>
            <div class="modal-actions">
              <button type="button" @click="closeAddUserModal" class="cancel-btn">
                Annuler
              </button>
              <button type="submit" class="submit-btn">
                <i class="fas fa-user-plus"></i> Ajouter
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { getFirestore, collection, query, getDocs, updateDoc, deleteDoc, doc, addDoc } from 'firebase/firestore'
import { auth } from '../firebase'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'

export default {
  name: 'UserManagement',
  components: {
    // Déclarez ici tous les composants utilisés
  },
  setup() {
    const db = getFirestore()
    const auth = getAuth()
    const activeTab = ref('users')
    const users = ref([])
    const messages = ref([])
    const userSearchQuery = ref('')
    const showEditModal = ref(false)
    const selectedUsers = ref([])
    const newMessage = ref({
      title: '',
      content: '',
      recipients: 'all'
    })
    const showAddUserModal = ref(false)
    const newUser = ref({
      email: '',
      displayName: '',
      role: 'user',
      password: ''
    })

    // Fonction pour charger les utilisateurs
    const loadUsers = async () => {
      try {
        console.log('Loading users...')
        const usersCollection = collection(db, 'users')
        const querySnapshot = await getDocs(usersCollection)
        users.value = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        console.log('Users loaded:', users.value)
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error)
        throw error
      }
    }

    // Fonctions de gestion des utilisateurs
    const updateUserRole = async (user) => {
      try {
        const userRef = doc(db, 'users', user.uid)
        await updateDoc(userRef, {
          role: user.role
        })
      } catch (error) {
        console.error('Erreur lors de la mise à jour du rôle:', error)
      }
    }

    const updateUserStatus = async (user) => {
      try {
        const userRef = doc(db, 'users', user.uid)
        await updateDoc(userRef, {
          isActive: user.isActive
        })
      } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error)
      }
    }

    const deleteUser = async (user) => {
      if (confirm(`Êtes-vous sûr de vouloir supprimer ${user.displayName} ?`)) {
        try {
          await deleteDoc(doc(db, 'users', user.uid))
          users.value = users.value.filter(u => u.uid !== user.uid)
        } catch (error) {
          console.error('Erreur lors de la suppression:', error)
        }
      }
    }

    // Fonctions de gestion des messages
    const sendMessage = async () => {
      try {
        const currentUser = auth.currentUser
        if (!currentUser) throw new Error('Utilisateur non connecté')

        const messageData = {
          title: newMessage.value.title,
          content: newMessage.value.content,
          recipients: newMessage.value.recipients === 'specific' ? selectedUsers.value.map(u => u.uid) : newMessage.value.recipients,
          senderId: currentUser.uid,
          senderName: currentUser.displayName,
          senderPhoto: currentUser.photoURL,
          createdAt: new Date().toISOString(),
          status: 'sent'
        }

        // Validation
        if (!messageData.title.trim() || !messageData.content.trim()) {
          throw new Error('Le titre et le contenu sont requis')
        }

        // Envoi du message
        const docRef = await addDoc(collection(db, 'messages'), messageData)
        
        // Réinitialisation du formulaire
        newMessage.value = {
          title: '',
          content: '',
          recipients: 'all'
        }
        selectedUsers.value = []

        // Ajout du message à la liste locale
        messages.value.unshift({
          id: docRef.id,
          ...messageData
        })

        alert('Message envoyé avec succès!')
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error)
        alert(error.message || 'Erreur lors de l\'envoi du message')
      }
    }

    const deleteMessage = async (message) => {
      if (confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
        try {
          await deleteDoc(doc(db, 'messages', message.id))
          messages.value = messages.value.filter(m => m.id !== message.id)
        } catch (error) {
          console.error('Erreur lors de la suppression du message:', error)
        }
      }
    }

    // Fonctions utilitaires
    const formatDate = (date) => {
      return format(new Date(date), 'dd MMMM yyyy HH:mm', { locale: fr })
    }

    const formatRecipients = (recipients) => {
      if (recipients === 'all') return 'Tous les utilisateurs'
      if (recipients === 'active') return 'Utilisateurs actifs'
      return `${recipients.length} utilisateurs sélectionnés`
    }

    const getInitials = (displayName) => {
      if (!displayName) return '??'
      return displayName
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }

    // Computed properties
    const filteredUsers = computed(() => {
      if (!userSearchQuery.value) return users.value
      
      const query = userSearchQuery.value.toLowerCase()
      return users.value.filter(user => 
        user.displayName?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      )
    })

    // Lifecycle hooks
    onMounted(async () => {
      console.log('UserManagement component mounted')
      try {
        await loadUsers()
        console.log('Users loaded:', users.value)
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error)
      }
    })

    // Fonctions pour gérer la modal
    const openAddUserModal = () => {
      showAddUserModal.value = true
    }

    const closeAddUserModal = () => {
      showAddUserModal.value = false
      // Réinitialiser le formulaire
      newUser.value = {
        email: '',
        displayName: '',
        role: 'user',
        password: ''
      }
    }

    // Fonction pour ajouter un utilisateur
    const addUser = async () => {
      try {
        // Créer l'utilisateur dans Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          newUser.value.email,
          newUser.value.password
        )

        // Mettre à jour le profil
        await updateProfile(userCredential.user, {
          displayName: newUser.value.displayName
        })

        // Ajouter les données dans Firestore
        await addDoc(collection(db, 'users'), {
          uid: userCredential.user.uid,
          email: newUser.value.email,
          displayName: newUser.value.displayName,
          role: newUser.value.role,
          createdAt: new Date().toISOString(),
          active: true
        })

        // Fermer la modal et réinitialiser
        closeAddUserModal()
        alert('Utilisateur créé avec succès!')
        
        // Recharger la liste des utilisateurs
        await loadUsers()
      } catch (error) {
        console.error('Erreur lors de la création de l\'utilisateur:', error)
        alert(error.message || 'Erreur lors de la création de l\'utilisateur')
      }
    }

    return {
      activeTab,
      users,
      messages,
      userSearchQuery,
      showEditModal,
      selectedUsers,
      newMessage,
      filteredUsers,
      updateUserRole,
      updateUserStatus,
      deleteUser,
      sendMessage,
      deleteMessage,
      formatDate,
      formatRecipients,
      getInitials,
      showAddUserModal,
      newUser,
      openAddUserModal,
      closeAddUserModal,
      addUser,
      loadUsers
    }
  }
}
</script>

<style scoped>
.user-management {
  padding: 20px;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tab-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  background: #f1f1f1;
}

.tab-btn.active {
  background: #003952;
  color: white;
}

.actions-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.action-btn {
  padding: 10px 20px;
  background: #003952;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.users-table table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th,
.users-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 10px;
}

.icon-btn {
  padding: 5px;
  border: none;
  background: none;
  cursor: pointer;
}

.icon-btn.delete {
  color: #e53e3e;
}

.message-compose {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.message-input {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 15px 0;
}

.message-title {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.message-actions {
  display: flex;
  justify-content: flex-end;
}

.send-btn {
  padding: 10px 20px;
  background: #003952;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.message-card {
  background: white;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .actions-bar {
    flex-direction: column;
    gap: 10px;
  }

  .users-table {
    overflow-x: auto;
  }

  .message-compose {
    padding: 15px;
  }
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
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

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.cancel-btn {
  padding: 8px 16px;
  background: #e2e8f0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.submit-btn {
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

/* Animation de la modal */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@media screen and (max-width: 768px) {
  .user-management {
    padding: 10px;
  }

  .tabs {
    flex-direction: column;
  }

  .tab-btn {
    width: 100%;
  }

  .users-table td:before {
    content: attr(data-label);
  }

  .user-info {
    display: flex;
    align-items: center;
    padding-left: 0 !important;
  }

  .actions {
    display: flex;
    justify-content: flex-start;
    gap: 10px;
  }

  .message-compose {
    padding: 10px;
  }

  .recipients {
    flex-direction: column;
  }

  .user-select {
    width: 100%;
  }

  .message-actions {
    flex-direction: column;
  }

  .message-card {
    margin: 10px 0;
  }

  .message-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .message-footer {
    flex-direction: column;
    gap: 10px;
  }
}
</style> 