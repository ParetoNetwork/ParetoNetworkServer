
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
                var cartSize = 0;
                this.cart = this.shoppingCart
                if(this.cart.length > 0){
                    for (var i = 0; i < this.cart.length; i++) {
                        console.log(this.shoppingCart[i].quantity)
                        cartSize += 1;
                    }
                }else{
                    cartSize = 0;
                }
                return cartSize;
            }
        },
       

    }
</script>

