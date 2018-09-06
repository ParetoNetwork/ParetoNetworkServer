<template>
    <div class="navbar hiden-navbar-bottom d-flex justify-content-around font-body">
        <div class="d-flex flex-row">
            <i class="fa fa-circle mr-1" style="color: #32CD32; padding: 2px;"></i>
            <div class="mr-3"> STATUS: CONNECTED </div>
            <div class="mr-3"> RECOMMENDED GAS PRICE: 23 GWEI</div>
        </div>
        <div class="d-flex flex-row">
            <div class="mr-3"> API </div>
            <div class="mr-3"> CONTACT </div>
            <div class="mr-3"> TERMS OF USE </div>
            <div class="mr-3"> PRIVACY POLICY </div>
            <div class="mr-3"> CONTENT CONTRIBUTOR GUIDELINES </div>
            <a class="mr-3" href="https://exchange.pareto.network/" target="_blank"> BUY PARETO </a>
        </div>
    </div>
</template>

<script>

    export default {
        name: 'VBottomNav',
        data: function () {
            return{
            }
        }
    }
</script>

<style>
    .hiden-navbar-bottom {
        font-size: 10px;
        background: #000211;
        height: 25px;
        width: 100%;
        position: fixed !important;
        transition: height 300ms;
        bottom: 0;
        z-index: 10;
    }

    .show-navbar-bottom {
        height: 50px;
        font-size: 12px;
    }

    @media (max-width: 900px){
        .hiden-navbar-bottom {
            height: 25px;
            font-size: 10px;
        }
    }

    @media (max-width: 900px){
        .show-navbar-bottom {
            height: 40px;
            font-size: 10px;
        }
    }
</style>