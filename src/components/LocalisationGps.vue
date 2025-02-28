<template>
    <div>
        <button @click="checkLocationPermission" type="button" class="w3-btn w3-black">
            <i class="fas fa-location-arrow"></i>
            Check now
        </button>
        <div v-if="!isLocationSupported" class="w3-panel w3-red">
            <p>Votre navigateur ne supporte pas la géolocalisation</p>
        </div>
        <!-- Debug info during development -->
        <div v-if="debugInfo" class="debug-info">
            <p>Your position: {{ debugInfo.userPosition }}</p>
            <p>Distance from target: {{ debugInfo.distance }} meters</p>
        </div>
        <div v-if="permissionStatus" class="w3-panel w3-green">
            <p>Autorisation:{{ permissionStatus }}</p>
        </div>
    </div>
</template>

<script>
import { useRouter } from 'vue-router';

export default {
    name: "LocalisationGps",
    data() {
        return {
            debugInfo: null,
            config: {
                target: {
                   
                    lat: -20.9584128,  // We'll update this
                    lon:  55.3156608  // We'll update this
                },
                toleranceInMeters: 200  // Adjustable tolerance in meters
            },
            isLocationSupported:false,
            permissionStatus: null
        }
    },
    setup() {
        const router = useRouter();
        return { router };
    },
    async mounted() {
        // Vérifier si la géolocalisation est supportée
        this.isLocationSupported = 'geolocation' in navigator;
        if (this.isLocationSupported) {
            await this.checkLocationPermission();
        }
    },
    methods: {
        async checkLocationPermission() {
            try {
                // Vérifier si les permissions sont déjà accordées
                const permission = await navigator.permissions.query({ name: 'geolocation' });
                this.permissionStatus = permission.state;

                switch (permission.state) {
                    case 'granted':
                        this.checkLocation();
                        break;
                    case 'prompt':
                        // Demander l'autorisation en appelant getCurrentPosition
                        navigator.geolocation.getCurrentPosition(
                            () => {
                                this.permissionStatus = 'granted';
                                this.checkLocation();
                            },
                            (error) => {
                                console.error("Permission refusée:", error);
                                alert("Pour utiliser cette fonctionnalité, veuillez autoriser la géolocalisation dans les paramètres de votre navigateur.");
                            }
                        );
                        break;
                    case 'denied':
                        alert("L'accès à votre position a été bloqué. Veuillez modifier les paramètres de votre navigateur pour continuer.");
                        break;
                }

                // Écouter les changements de permission
                permission.addEventListener('change', (e) => {
                    this.permissionStatus = e.target.state;
                    if (e.target.state === 'granted') {
                        this.checkLocation();
                    }
                });
            } catch (error) {
                console.error("Erreur lors de la vérification des permissions:", error);
            }
        },
        async checkLocation() {
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(position => {
                    const userLatitude = position.coords.latitude;
                    const userLongitude = position.coords.longitude;

                    // Calculate actual distance in meters
                    const distance = this.calculateDistance(
                        userLatitude,
                        userLongitude,
                        this.config.target.lat,
                        this.config.target.lon
                    );

                    // Set debug info
                    this.debugInfo = {
                        userPosition: `${userLatitude}, ${userLongitude}`,
                        distance: Math.round(distance)
                    };

                    if (distance > this.config.toleranceInMeters) {
                        alert(`Vous n'êtes pas à l'emplacement correct. Vous êtes à ${Math.round(distance)}m de la cible.`);
                        this.router.push('/');
                    } else {
                        setTimeout(
                            () => {
                                alert("Vous êtes à l'emplacement correct !"); 
                                this.router.push('/login');
                            },
                            3000
                        );
                    }
                }, 
                (error) => {
                    console.error("Erreur de géolocalisation:", error);
                    alert("Impossible d'obtenir votre position. Veuillez activer la géolocalisation.");
                });
            } else {
                alert("La géolocalisation n'est pas supportée par votre navigateur.");
            }
        },

        calculateDistance(lat1, lon1, lat2, lon2) {
            const R = 6371e3; // Earth's radius in meters
            const φ1 = lat1 * Math.PI/180;
            const φ2 = lat2 * Math.PI/180;
            const Δφ = (lat2-lat1) * Math.PI/180;
            const Δλ = (lon2-lon1) * Math.PI/180;

            const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                    Math.cos(φ1) * Math.cos(φ2) *
                    Math.sin(Δλ/2) * Math.sin(Δλ/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

            return R * c; // Distance in meters
        }
    }
}
</script>

<style scoped>
.debug-info {
    margin-top: 1rem;
    padding: 1rem;
    background-color: #f5f5f5;
    border-radius: 4px;
}
</style>
