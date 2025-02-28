<template>
<div class="w3-padding-32 w3-margin-32 pageLogin">
    <div class="w3-card-4  login">
        <h2>Connexion</h2>
        <button @click="signInWithGoogle" class="google-btn">
            Se connecter avec Google
        </button>
    </div>
    </div>
</template>

<script>
import { auth, googleProvider } from '../firebase'
import { signInWithPopup } from 'firebase/auth'
import { useRouter } from 'vue-router'
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'

export default {
    name: 'Login',
    setup() {
     
        const router = useRouter()
        const db = getFirestore()

        const saveUserLocation = () => {
            return new Promise((resolve, reject) => {
                if ('geolocation' in navigator) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const location = {
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude,
                                timestamp: new Date().toISOString()
                            }
                            localStorage.setItem('userLocation', JSON.stringify(location))
                            resolve(location)
                        },
                        (error) => {
                            console.error('Erreur de géolocalisation:', error)
                            reject(error)
                        }
                    )
                } else {
                    reject(new Error('Géolocalisation non supportée'))
                }
            })
        }

        const saveUserToLocalStorage = (user) => {
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                lastLogin: new Date().toISOString()
            }
            localStorage.setItem('userData', JSON.stringify(userData))
            return userData
        }

        const checkAndCreateUser = async (user, location) => {
            try {
                const userRef = doc(db, 'users', user.uid)
                const userDoc = await getDoc(userRef)

                if (!userDoc.exists()) {
                    // Créer un nouvel utilisateur dans Firestore
                    const userData = {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                        createdAt: new Date().toISOString(),
                        lastLogin: new Date().toISOString(),
                        lastLocation: location || null,
                        role: 'user', // rôle par défaut
                        isActive: true
                    }

                    await setDoc(userRef, userData)
                    console.log('Nouvel utilisateur créé dans Firestore')
                    return userData
                } else {
                    // Récupérer les données existantes et les mettre à jour
                    const existingData = userDoc.data()
                    const updateData = {
                        lastLogin: new Date().toISOString(),
                        lastLocation: location || null,
                        // Conserver le rôle existant
                        role: existingData.role || 'user'
                    }
                    await setDoc(userRef, updateData, { merge: true })
                    console.log('Informations utilisateur mises à jour')
                    return { ...existingData, ...updateData }
                }
            } catch (error) {
                console.error('Erreur lors de la gestion utilisateur:', error)
                throw error
            }
        }

        const signInWithGoogle = async () => {
            try {
                const result = await signInWithPopup(auth, googleProvider)
                console.log('Utilisateur connecté:', result.user)
                
                // Sauvegarder les informations de l'utilisateur dans localStorage
                saveUserToLocalStorage(result.user)
                
                // Récupérer la localisation
                let location = null
                try {
                    location = await saveUserLocation()
                    console.log('Localisation sauvegardée')
                } catch (locationError) {
                    console.warn('Impossible de sauvegarder la localisation:', locationError)
                }

                // Vérifier/Créer l'utilisateur dans Firestore
                const userInfo = await checkAndCreateUser(result.user, location)
                console.log('User Info:', userInfo) // Debug log

                // Sauvegarder le rôle dans localStorage
                const updatedUserData = {
                    ...JSON.parse(localStorage.getItem('userData')),
                    role: userInfo.role
                }
                localStorage.setItem('userData', JSON.stringify(updatedUserData))

                // Redirection basée sur le rôle
                if (userInfo.role === 'admin' || userInfo.role === 'user-admin') {
                    console.log('Redirection vers admin dashboard') // Debug log
                    await router.push('/admin/dashboard')
                } else {
                    console.log('Redirection vers user dashboard') // Debug log
                    await router.push('/user/dashboard')
                }
            } catch (error) {
                console.error('Erreur de connexion:', error)
                alert('Erreur lors de la connexion. Veuillez réessayer.')
                router.push('/')
            }
        }

        return {
            signInWithGoogle
        }
    }
}
</script>

<style scoped>
.pageLogin{
    background-image:url('../assets/img/backgroundApp.png');
    background-size:cover;
    background-position:center;
    background-repeat:no-repeat;
    background-attachment:fixed;
    min-height:100vh;
}
.login {
    padding: 20px;
    max-width: 400px;
    margin:0 auto;
    margin-top:100px;
    border-radius:10px;
    text-align:center;

}
.login h2{
    color:white;
    text-align:center;
    font-size:20px;
    font-weight:bold;
}
.google-btn {
    padding: 10px 20px;
    background-color: #c52416;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
  }

.google-btn:hover {
    background-color: #11ed32;
}
</style>
