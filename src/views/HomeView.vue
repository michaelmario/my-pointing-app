<template>
    <div>
        <Header />
        <div class="w3-container home-view">
            <div class="w3-row center-container">
                <div class="timer-wrapper">
                    <div class="w3-card-4 timer-card">
                        <div class="timer-container">
                            <div class="timer-circle">
                                <h2 class="timer-text">{{ formattedTime }}</h2>
                                <p class="timer-label">App de pointage quotidienne</p>
                            </div>
                            <h3 class="status-text">
                                <i>Vérifiez votre emplacement</i>
                            </h3>
                            <LocalisationGps/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Header from '../components/Header.vue'
import LocalisationGps from '../components/LocalisationGps.vue';


export default {
    name: 'HomeView',
    components: {
        Header,
        LocalisationGps
    },
    data() {
        return {
            currentTime: new Date()
        }
    },
    computed: {
        formattedTime() {
            const hours = this.currentTime.getHours().toString().padStart(2, '0')
            const minutes = this.currentTime.getMinutes().toString().padStart(2, '0')
            const seconds = this.currentTime.getSeconds().toString().padStart(2, '0')
            return `${hours}:${minutes}:${seconds}`
        }
    },
    mounted() {
        // Update time every second
        this.timer = setInterval(() => {
            this.currentTime = new Date()
        }, 1000)
    },
    beforeUnmount() {
        // Clean up interval when component is destroyed
        clearInterval(this.timer)
    }
}
</script>

<style scoped>
.home-view {
    min-height: 100vh;
    padding-top: 4rem;
    background-image:url('../assets/img/backgroundApp.png');
    background-size:cover;
    background-position:center;
    background-repeat:no-repeat;
    background-attachment:fixed;
}

.center-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: calc(100vh - 4rem); /* Subtract header height */
}

.timer-wrapper {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
    padding: 1rem;
}

.d-flex {
    display: flex;
}

.justify-center {
    justify-content: center;
}

.timer-card {
    padding: 2rem;
    text-align: center;
    background-color: transparent;
    border-color: #0d18e6;
}

.timer-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
}

.timer-circle {
    width: 200px;
    height: 200px;
    border-radius: 50%;
    border: 8px solid #0d18e6;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: white;
}

.timer-text {
    font-size: 2rem;
    margin: 0;
    color: #333;
}

.timer-label {
    margin: 0;
    color: #666;
}

.status-text {
    color: #fff;
    font-weight: bold;
}

.start-button {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    border: none;
    background-color: #2196F3;
    color: white;
    font-size: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.button-icon {
    margin-left: 3px;
}
</style>