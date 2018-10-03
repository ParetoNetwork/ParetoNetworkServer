<template>
    <div class="navbar hiden-navbar-bottom d-flex justify-content-around font-body py-0">
        <div class="d-flex flex-row mt-1 p-1">
            <a class="mr-3" href="https://ethereum.org"><img style="height: 23px;" src="../assets/images/powered-by-ethereum-small.png" alt=""></a>
            <div class="mr-3"> PARETO PRICE: {{paretoUSD}} </div>
            <div class="mr-3"> RECOMMENDED ETHEREUM GAS PRICE: {{recommendedGasPrice}} gwei </div>
            <!-- <i class="fa fa-circle mr-1" style="color: #32CD32; padding: 2px;"></i>
            <div class="mr-3"> STATUS: CONNECTED </div>
            <div class="mr-3"> RECOMMENDED GAS PRICE: 23 GWEI</div> -->
        </div>
        <div class="d-flex flex-row py-1">
            <!--
            <div class="mr-3"> CONTACT </div>
            <div class="mr-3"> TERMS OF USE </div>
            <div class="mr-3"> PRIVACY POLICY </div>
            <div class="mr-3"> CONTENT CONTRIBUTOR GUIDELINES </div> -->
            <a class="mr-3 nav-link" href="/api-docs/"> API </a>
            <a class="mr-3 nav-link" href="https://exchange.pareto.network/" target="_blank"> BUY PARETO </a>
            <a class="mr-3 nav-link border" style="font-weight: bold;" href="https://t.me/paretonetworkdiscussion"><i class="fa fa-telegram mr-1" style="color: #226acd; padding: 1px;"></i>TELEGRAM</a>
        </div>
    </div>
</template>

<script>
    import ContentService from '../services/ContentService';

    export default {
        name: 'VBottomNav',
        data: function () {
            return{
                paretoUSD: '',
                recommendedGasPrice: ''
            }
        },
        mounted(){
            this.getCoinMarketPrice();
            this.getRecommendedGas();
        },
        methods: {
            getCoinMarketPrice: function () {
                ContentService.getParetoInfo(res => {
                        this.paretoUSD = this.numberToCurrency(res.quote.USD.price);
                        console.log(this.paretoUSD);
                    },
                    err => {
                        this.$notify({
                            group: 'notification',
                            type: 'error',
                            duration: 10000,
                            title: 'Content',
                            text: err
                        });
                    });
            },
            getRecommendedGas: function(){
                ContentService.getStimatedGasPrice(res => {
                    this.recommendedGasPrice = res;
                }, error => {
                    this.$notify({
                        group: 'notification',
                        type: 'error',
                        duration: 10000,
                        title: 'Content',
                        text: error
                    });
                });
            },
            numberToCurrency: function (number) {
                return number.toLocaleString('en-IN', {style: 'currency', currency: 'USD', minimumFractionDigits: 5});
            }
        }
    }
</script>

<style>

    .nav-link:hover {
        color: rgba(255, 255, 255, 0.75);
    }

    .hiden-navbar-bottom {
        font-size: 10px;
        background: #000211;
        height: 40px;
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
            height: 45px;
            font-size: 10px;
        }
    }

    @media (max-width: 900px){
        .show-navbar-bottom {
            height: 90px;
            font-size: 10px;
        }

    }

    .border {
        border-radius: 3px;
    }


</style>