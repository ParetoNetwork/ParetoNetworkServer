<template>
    <a href="/checkout" class="floatingab"></a>
</template>

<script>
    export default {
        name: 'VFab'
    };
</script>

<style scoped>
    .floatingab {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        box-shadow: 0 3px 3px 0 #d8d8d8;
        transition: all 0.1s ease-in-out;
        background-image: linear-gradient(to right, #6aba82, #85c568, #6aba82,  #85c568, #9ff677);
        background-repeat: no-repeat;
        background-size: cover;
        font-size: 40px;
        color: black;
        text-align: center;
        line-height: 60px;
        position: fixed;
        z-index: 9999;
        right: 50px;
        bottom: 50px;
    }

    .floatingab:before {
        position: absolute;
        font-family: 'FontAwesome';
        top: 0;
        left: 10px;
        content: "\f07a";
    }

    .floatingab:hover {
        box-shadow: 0 6px 14px 0 #666;
    }

    @media (max-width: 812px) {
        .floatingab {
            right: 10px;
        }
    }

</style>