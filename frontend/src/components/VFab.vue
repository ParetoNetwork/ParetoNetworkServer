<template>
    <a href="https://t.me/paretonetworkdiscussion" target="_blank" class="fab"> </a>
</template>

<script>
    export default {
        name: 'VFab'
    };
</script>

<style scoped>
    .fab {
        width: 70px;
        height: 70px;
        background-image:  url("../assets/images/telegram.png");
        background-position: center;
        background-repeat: no-repeat;
        background-size: cover; 
        border-radius: 50%;
        box-shadow: 0 6px 5px 0 #d8d8d8;
        transition: all 0.1s ease-in-out;

        font-size: 50px;
        color: white;
        text-align: center;
        line-height: 70px;

        position: fixed;
        z-index: 999;
        right: 50px;
        bottom: 50px;
    }

    .fab:hover {
        box-shadow: 0 6px 14px 0 #666;
    }

    @media (max-width: 812px) {
        .fab {
            right: 10px;
        }
    }

</style>