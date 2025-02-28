<template>
  <div class="not-found">
    <div class="not-found-content">
      <div class="error-code">404</div>
      <h1>Page Non Trouvée</h1>
      <p>Désolé, la page que vous recherchez n'existe pas ou a été déplacée.</p>
      <div class="actions">
        <RouterLink to="/" class="home-btn">
          <i class="fas fa-home"></i> Retour à l'accueil
        </RouterLink>
        <button @click="goBack" class="back-btn">
          <i class="fas fa-arrow-left"></i> Page précédente
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { useRouter } from 'vue-router'

export default {
  name: 'NotFound',
  setup() {
    const router = useRouter()

    const goBack = () => {
      router.go(-1)
    }

    return {
      goBack
    }
  }
}
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7fafc;
  padding: 20px;
}

.not-found-content {
  text-align: center;
  max-width: 600px;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.error-code {
  font-size: 8rem;
  font-weight: bold;
  color: #003952;
  line-height: 1;
  margin-bottom: 20px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

h1 {
  font-size: 2rem;
  color: #2d3748;
  margin-bottom: 16px;
}

p {
  color: #4a5568;
  margin-bottom: 32px;
  font-size: 1.1rem;
}

.actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.home-btn,
.back-btn {
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.home-btn {
  background: #003952;
  color: white;
  text-decoration: none;
  border: none;
}

.home-btn:hover {
  background: #00293d;
}

.back-btn {
  background: white;
  color: #003952;
  border: 2px solid #003952;
}

.back-btn:hover {
  background: #f8fafc;
}

/* Responsive Design */
@media screen and (max-width: 768px) {
  .not-found-content {
    padding: 20px;
  }

  .error-code {
    font-size: 6rem;
  }

  h1 {
    font-size: 1.5rem;
  }

  .actions {
    flex-direction: column;
  }

  .home-btn,
  .back-btn {
    width: 100%;
    justify-content: center;
  }
}

/* Animation d'entrée */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.not-found-content {
  animation: fadeIn 0.5s ease-out;
}
</style> 