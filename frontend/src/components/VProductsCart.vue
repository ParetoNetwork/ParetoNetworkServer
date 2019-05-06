
<template>
    <div>
        <div class="cart" @click="go_to_checkout">
            <span class="cart-size"> {{ cartSize }} </span><i class="fa fa-shopping-cart"></i>
        </div>
    </div>
</template>

<script>
    import { mapActions, mapState } from 'vuex';
    export default {
        name: 'VProductsCart',
         mounted: function(){

            let cart = JSON.parse(window.localStorage.getItem('ShoppingCart'));
           
            if (cart){
                this.$store.dispatch('resetShoppingCart')
                for (var i = 0; i < cart.length; i++) {
                     
                    this.$store.dispatch('addToCart', cart[i]);
                }
             }

        },
        methods: {
            ...mapActions(["addToCart"]),
            go_to_checkout: function(){
                this.$router.push({ path: '/checkout' })
            }
        },
        data: {
                cart: []
        },
        computed: {
             ...mapState(['shoppingCart']),
            cartSize: function () {
                let cartSize = 0;
                this.cart = this.shoppingCart;
                if(this.cart){
                    for (var i = 0; i < this.cart.length; i++) {
                        cartSize += this.shoppingCart[i].quantity;
                    }
                }else{
                    cartSize = 0;
                }
                return cartSize;
            }
        },
       

    }
</script>

