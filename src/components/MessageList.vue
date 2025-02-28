<template>
  <div class="messages-container">
    <h2 class="messages-title">
      <i class="fas fa-envelope"></i> Messages
      <span class="message-count">({{ totalMessages }})</span>
    </h2>

    <!-- Bouton pour créer un nouveau message (visible uniquement pour les utilisateurs non-admin) -->
    <div v-if="!isAdmin" class="new-message-section">
      <button @click="showNewMessageForm = true" class="new-message-btn">
        <i class="fas fa-plus"></i> Nouveau Message à l'Administration
      </button>
    </div>

    <!-- Formulaire de nouveau message avec priorité et catégorie -->
    <div v-if="showNewMessageForm && !isAdmin" class="message-form">
      <h3>Nouveau Message</h3>
      <div class="form-group">
        <label>Sujet</label>
        <input v-model="newMessage.title" type="text" placeholder="Sujet de votre message">
      </div>
      
      <div class="form-row">
        <div class="form-group half">
          <label>Priorité</label>
          <select v-model="newMessage.priority">
            <option value="low">Basse</option>
            <option value="medium">Moyenne</option>
            <option value="high">Haute</option>
            <option value="urgent">Urgente</option>
          </select>
        </div>
        
        <div class="form-group half">
          <label>Catégorie</label>
          <select v-model="newMessage.category">
            <option value="technical">Technique</option>
            <option value="administrative">Administrative</option>
            <option value="hr">Ressources Humaines</option>
            <option value="other">Autre</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>Message</label>
        <textarea 
          v-model="newMessage.content" 
          rows="4" 
          placeholder="Écrivez votre message ici..."
        ></textarea>
      </div>
      <div class="form-actions">
        <button @click="cancelMessage" class="cancel-btn">Annuler</button>
        <button @click="sendMessage" class="send-btn">
          <i class="fas fa-paper-plane"></i> Envoyer
        </button>
      </div>
    </div>

    <!-- Filtres améliorés pour les admins -->
    <div v-if="isAdmin" class="message-filters">
      <div class="filters-row">
        <select v-model="filterStatus">
          <option value="all">Tous les statuts</option>
          <option value="pending">Non répondus</option>
          <option value="answered">Répondus</option>
        </select>

        <select v-model="filterPriority">
          <option value="all">Toutes priorités</option>
          <option value="urgent">Urgente</option>
          <option value="high">Haute</option>
          <option value="medium">Moyenne</option>
          <option value="low">Basse</option>
        </select>

        <select v-model="filterCategory">
          <option value="all">Toutes catégories</option>
          <option value="technical">Technique</option>
          <option value="administrative">Administrative</option>
          <option value="hr">RH</option>
          <option value="other">Autre</option>
        </select>

        <button @click="exportConversations" class="export-btn">
          <i class="fas fa-file-export"></i> Exporter
        </button>
      </div>
    </div>

    <!-- Liste des messages avec indicateurs de priorité -->
    <div class="messages-list">
      <div 
        v-for="message in filteredMessages" 
        :key="message.id" 
        class="message-card"
        :class="[`priority-${message.priority}`]"
      >
        <div class="message-header">
          <div class="sender-info">
            <img v-if="message.senderPhoto" :src="message.senderPhoto" :alt="message.senderName" class="sender-avatar">
            <span v-else class="sender-initials">{{ getInitials(message.senderName) }}</span>
            <div class="sender-details">
              <span class="sender-name">{{ message.senderName }}</span>
              <span class="message-date">{{ formatDate(message.createdAt) }}</span>
            </div>
          </div>
          <div class="message-status" :class="message.status">
            {{ message.status === 'pending' ? 'En attente' : 'Répondu' }}
          </div>
          <div class="message-meta">
            <span class="priority-badge" :class="message.priority">
              {{ getPriorityLabel(message.priority) }}
            </span>
            <span class="category-badge">
              {{ getCategoryLabel(message.category) }}
            </span>
          </div>
        </div>

        <div class="message-content">
          <h3 class="message-title">{{ message.title }}</h3>
          <p class="message-text">{{ message.content }}</p>
        </div>

        <!-- Section réponse (visible uniquement pour les admins) -->
        <div v-if="isAdmin" class="response-section">
          <div v-if="message.response" class="admin-response">
            <h4>Réponse de l'administration:</h4>
            <p>{{ message.response }}</p>
            <span class="response-date">{{ formatDate(message.responseDate) }}</span>
          </div>
          <div v-else class="response-form">
            <textarea 
              v-model="message.newResponse" 
              placeholder="Écrire une réponse..."
              rows="3"
            ></textarea>
            <button @click="sendResponse(message)" class="send-btn">
              Répondre
            </button>
          </div>
        </div>

        <!-- Affichage de la réponse pour les utilisateurs -->
        <div v-if="!isAdmin && message.response" class="admin-response">
          <h4>Réponse de l'administration:</h4>
          <p>{{ message.response }}</p>
          <span class="response-date">{{ formatDate(message.responseDate) }}</span>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div class="pagination" v-if="totalPages > 1">
      <button 
        @click="changePage(currentPage - 1)"
        :disabled="currentPage === 1"
        class="page-btn"
      >
        <i class="fas fa-chevron-left"></i>
      </button>

      <button 
        v-for="page in displayedPages" 
        :key="page"
        @click="changePage(page)"
        :class="['page-btn', { active: currentPage === page }]"
      >
        {{ page }}
      </button>

      <button 
        @click="changePage(currentPage + 1)"
        :disabled="currentPage === totalPages"
        class="page-btn"
      >
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { getFirestore, collection, query, orderBy, getDocs, addDoc, updateDoc, doc, where } from 'firebase/firestore'
import { auth } from '../firebase'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { sendEmailNotification } from '../services/emailService'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

export default {
  name: 'MessageList',
  props: {
    isAdmin: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const db = getFirestore()
    const messages = ref([])
    const currentPage = ref(1)
    const messagesPerPage = 10
    const showNewMessageForm = ref(false)
    const filterStatus = ref('all')
    const filterPriority = ref('all')
    const filterCategory = ref('all')
    const newMessage = ref({
      title: '',
      content: '',
      priority: 'medium',
      category: 'other'
    })

    // Pagination
    const totalMessages = computed(() => messages.value.length)
    const totalPages = computed(() => Math.ceil(totalMessages.value / messagesPerPage))
    
    const paginatedMessages = computed(() => {
      const start = (currentPage.value - 1) * messagesPerPage
      const end = start + messagesPerPage
      return messages.value.slice(start, end)
    })

    const displayedPages = computed(() => {
      const delta = 2
      const range = []
      const rangeWithDots = []
      let l

      for (let i = 1; i <= totalPages.value; i++) {
        if (i === 1 || i === totalPages.value || 
            (i >= currentPage.value - delta && i <= currentPage.value + delta)) {
          range.push(i)
        }
      }

      range.forEach(i => {
        if (l) {
          if (i - l === 2) {
            rangeWithDots.push(l + 1)
          } else if (i - l !== 1) {
            rangeWithDots.push('...')
          }
        }
        rangeWithDots.push(i)
        l = i
      })

      return rangeWithDots
    })

    const changePage = (page) => {
      if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page
      }
    }

    // Fonctions utilitaires
    const formatDate = (date) => {
      return format(new Date(date), 'dd MMMM yyyy HH:mm', { locale: fr })
    }

    const getInitials = (name) => {
      return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
    }

    const formatRecipients = (recipients) => {
      if (recipients === 'all') return 'Tous les utilisateurs'
      if (recipients === 'active') return 'Utilisateurs actifs'
      return `${recipients.length} utilisateurs`
    }

    const deleteMessage = async (message) => {
      if (confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
        try {
          await deleteDoc(doc(db, 'messages', message.id))
          messages.value = messages.value.filter(m => m.id !== message.id)
        } catch (error) {
          console.error('Erreur lors de la suppression:', error)
        }
      }
    }

    // Filtrage amélioré
    const filteredMessages = computed(() => {
      let filtered = messages.value

      if (!props.isAdmin) {
        filtered = filtered.filter(msg => msg.senderId === auth.currentUser?.uid)
      }

      if (filterStatus.value !== 'all') {
        filtered = filtered.filter(msg => {
          if (filterStatus.value === 'pending') return !msg.response
          return msg.response
        })
      }

      if (filterPriority.value !== 'all') {
        filtered = filtered.filter(msg => msg.priority === filterPriority.value)
      }

      if (filterCategory.value !== 'all') {
        filtered = filtered.filter(msg => msg.category === filterCategory.value)
      }

      return filtered
    })

    // Charger les messages
    const loadMessages = async () => {
      try {
        const messagesRef = collection(db, 'messages')
        let q
        
        if (props.isAdmin) {
          // Les admins voient tous les messages des utilisateurs
          q = query(messagesRef, orderBy('createdAt', 'desc'))
        } else {
          // Les utilisateurs ne voient que leurs messages
          q = query(
            messagesRef, 
            where('senderId', '==', auth.currentUser?.uid),
            orderBy('createdAt', 'desc')
          )
        }

        const snapshot = await getDocs(q)
        messages.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      } catch (error) {
        console.error('Erreur lors du chargement des messages:', error)
      }
    }

    // Envoi de message avec notification
    const sendMessage = async () => {
      try {
        const currentUser = auth.currentUser
        if (!currentUser) throw new Error('Utilisateur non connecté')

        const messageData = {
          ...newMessage.value,
          senderId: currentUser.uid,
          senderName: currentUser.displayName,
          senderPhoto: currentUser.photoURL,
          createdAt: new Date().toISOString(),
          status: 'pending'
        }

        const docRef = await addDoc(collection(db, 'messages'), messageData)

        // Envoyer notification email aux admins
        await sendEmailNotification({
          type: 'new_message',
          messageId: docRef.id,
          priority: messageData.priority,
          category: messageData.category,
          title: messageData.title,
          senderName: messageData.senderName
        })
        
        // Réinitialiser le formulaire
        newMessage.value = { title: '', content: '', priority: 'medium', category: 'other' }
        showNewMessageForm.value = false
        
        // Recharger les messages
        await loadMessages()
        
      } catch (error) {
        console.error('Erreur:', error)
        alert(error.message)
      }
    }

    // Envoyer une réponse (admin uniquement)
    const sendResponse = async (message) => {
      try {
        const messageRef = doc(db, 'messages', message.id)
        await updateDoc(messageRef, {
          response: message.newResponse,
          responseDate: new Date().toISOString(),
          status: 'answered'
        })
        
        // Recharger les messages
        await loadMessages()
        
      } catch (error) {
        console.error('Erreur lors de l\'envoi de la réponse:', error)
        alert(error.message)
      }
    }

    // Export des conversations
    const exportConversations = async () => {
      try {
        const data = filteredMessages.value.map(msg => ({
          Date: format(new Date(msg.createdAt), 'dd/MM/yyyy HH:mm'),
          Expéditeur: msg.senderName,
          Sujet: msg.title,
          Priorité: getPriorityLabel(msg.priority),
          Catégorie: getCategoryLabel(msg.category),
          Message: msg.content,
          Réponse: msg.response || '',
          Statut: msg.status === 'pending' ? 'En attente' : 'Répondu'
        }))

        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Messages')
        
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
        const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        
        saveAs(dataBlob, `messages_${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
      } catch (error) {
        console.error('Erreur lors de l\'export:', error)
        alert('Erreur lors de l\'export des messages')
      }
    }

    // Fonctions utilitaires
    const getPriorityLabel = (priority) => {
      const labels = {
        urgent: 'Urgente',
        high: 'Haute',
        medium: 'Moyenne',
        low: 'Basse'
      }
      return labels[priority] || priority
    }

    const getCategoryLabel = (category) => {
      const labels = {
        technical: 'Technique',
        administrative: 'Administrative',
        hr: 'RH',
        other: 'Autre'
      }
      return labels[category] || category
    }

    onMounted(loadMessages)

    return {
      messages,
      currentPage,
      totalMessages,
      totalPages,
      paginatedMessages,
      displayedPages,
      changePage,
      formatDate,
      getInitials,
      formatRecipients,
      deleteMessage,
      filteredMessages,
      showNewMessageForm,
      newMessage,
      filterStatus,
      filterPriority,
      filterCategory,
      sendMessage,
      sendResponse,
      exportConversations,
      getPriorityLabel,
      getCategoryLabel
    }
  }
}
</script>

<style scoped>
.messages-container {
  padding: 20px;
  background: #f8fafc;
}

.messages-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  color: #2d3748;
}

.message-count {
  font-size: 0.9em;
  color: #718096;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
}

.message-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;
}

.sender-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sender-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.sender-initials {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #003952;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.message-content {
  padding: 16px;
}

.message-title {
  font-size: 1.1em;
  margin-bottom: 8px;
  color: #2d3748;
}

.message-text {
  color: #4a5568;
  line-height: 1.5;
}

.message-footer {
  padding: 12px 16px;
  background: #f7fafc;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recipients-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #718096;
  font-size: 0.9em;
}

.pagination {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  gap: 8px;
}

.page-btn {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn.active {
  background: #003952;
  color: white;
  border-color: #003952;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive Design */
@media (max-width: 768px) {
  .messages-container {
    padding: 12px;
  }

  .message-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .message-footer {
    flex-direction: column;
    gap: 12px;
  }

  .pagination {
    flex-wrap: wrap;
  }
}

.new-message-section {
  margin-bottom: 20px;
}

.new-message-btn {
  background: #003952;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.message-form {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-btn {
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

.response-section {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e2e8f0;
}

.admin-response {
  background: #f7fafc;
  padding: 15px;
  border-radius: 4px;
  margin-top: 10px;
}

.response-date {
  display: block;
  font-size: 0.875rem;
  color: #718096;
  margin-top: 5px;
}

.message-status {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.875rem;
}

.message-status.pending {
  background: #fed7d7;
  color: #c53030;
}

.message-status.answered {
  background: #c6f6d5;
  color: #2f855a;
}

/* Responsive Design */
@media (max-width: 768px) {
  .form-actions {
    flex-direction: column;
  }

  .form-actions button {
    width: 100%;
  }
}

.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.form-group.half {
  flex: 1;
}

.filters-row {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.priority-badge,
.category-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.875rem;
  margin-left: 8px;
}

.priority-badge.urgent {
  background-color: #fed7d7;
  color: #c53030;
}

.priority-badge.high {
  background-color: #feebc8;
  color: #c05621;
}

.priority-badge.medium {
  background-color: #fefcbf;
  color: #b7791f;
}

.priority-badge.low {
  background-color: #c6f6d5;
  color: #2f855a;
}

.category-badge {
  background-color: #e2e8f0;
  color: #4a5568;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.export-btn {
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

/* Styles pour les cartes de message selon la priorité */
.message-card.priority-urgent {
  border-left: 4px solid #c53030;
}

.message-card.priority-high {
  border-left: 4px solid #c05621;
}

.message-card.priority-medium {
  border-left: 4px solid #b7791f;
}

.message-card.priority-low {
  border-left: 4px solid #2f855a;
}
</style> 