<template>
    <header class="header">
        <div class="header-content">
            <div class="logo">⏱️</div>
            <h1 class="title">Pointage quotidienne</h1>
        </div>
    </header>
</template>

<script>
export default {
    name: 'Header'
}
</script>

<style scoped>
.header {
    background-color: rgb(16, 73, 196);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    padding: 1rem;
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 1000;
}

.header-content {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
}

.logo {
    font-size: 1.5rem;
}

.title {
    margin: 0;
    font-size: 1.25rem;
    color: #fff;
    font-weight: 600;
}
@media screen and (max-width: 768px) {
    .header {
        padding: 1.5rem;
    }
    .logo{
        width:20px;
        height:20px;
        font-size:1.2rem;
    }
    .title{
        font-size:1rem;
        overflow: hidden;
        text-overflow: ellipsis;
    }
}
</style>
