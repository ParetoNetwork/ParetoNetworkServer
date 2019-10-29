<template>
    <a href="/create" class="floatingab"></a>
</template>

<script>

    import { mapActions, mapState } from 'vuex';

    export default {
        name: 'VFab',
        mounted: function(){


        },
        computed: {
            ...mapState(['status'])/*,
            products_in: function () {
                this.cart = this.shoppingCart;
                return this.shoppingCart.length > 0;
            }*/
        }
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
        font-size: 30px;
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
        top: 1px;
        left: 16px;
        content: "\f304";
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