import { createApp } from 'vue'
import 'w3-css/w3.css';
// import './style.css'
import App from './App.vue'
import router from './router'
import firebase from './firebase'
import './assets/styles/responsive.css'

const app = createApp(App)
app.use(router)
app.use(firebase)
app.mount('#app')
