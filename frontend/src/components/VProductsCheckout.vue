<template>
<div class="main-wrapper">
    <div id="vue">
    

        <div class="container checkout-area">
            <h4 class="align-left">1. Cart</h4>
            <table class="table table-responsive-lg position-relative">
                <thead>
                <tr>
                    <th>Name</th>
                    <th class="align-left">Amount</th>
                    <th class="align-right">Price</th>
                    <th class="align-right">Total</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="(product, key) in cart">
                    <td>{{ product.attributes.name }}</td>
                    
                    <td class="align-right">
                        <div class="qty_number">
                            <input type="number" :value='product.quantity' min="1" @change="changeAquantity($event.target.value ,key)">
                            <div class="inc button" @click="addQuantity(product, key)"><span>+</span></div>
                            <div class="dec button" @click="deductQuantity(product, key)"><span>-</span></div>
                        </div>
                    </td>
                    <td class="align-right"> $ {{ product.price / 100}}</td>
                    <td class="align-right"> $ {{ (product.price / 100)  * product.quantity}}</td>
                    <td class="align-right"><button class="remove-btn" @click="removeProduct(product, key)"> X </button></td>
                </tr>
                
                <tr class="total-cart">
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>

                    <td class="align-right">Total</td>
                    <td class="align-right">${{getCartTotal/100}}</td>
                    <td></td>
                </tr>
                </tbody>
            </table>




                <div class="align-rigth">
                    <button v-if="getCartTotal > 0" @click="checkout">Next</button>
                </div>

        </div>
    </div>
</div>
</template>

<script>
    /* eslint-disable */

    export default {
        name: "VProductCheckout",
        created: function(){
            this.cart = JSON.parse(window.localStorage.getItem('ShoppingCart'));
        },

        data: function() {
            return {
                cart: [],
                currency: 'USD',
                order_id: ''
            }
        },
         computed: {
            
            getCartTotal: function () {
                
              var total = 0;
                if(this.cart.length > 0){
                    for (var i = 0; i < this.cart.length; i++) {
                       
                        total += this.cart[i].quantity * this.cart[i].price;
                    }
                }else{
                    total = 0;
                }
                return total;
            }
        },

        methods: {

            checkout () {

               this.$router.push({path: '/customer-details'})

            },

            removeProduct: function(product, key) {

                this.cart.splice(key, 1);
                this.updateCart(this.cart)

                this.$store.dispatch('resetShoppingCart')
                for (var i = 0; i < this.cart.length; i++) {

                   this.$store.dispatch('addToCart', this.cart[i]);
                }

            },
            addQuantity: function(product, key){

                this.cart[key].quantity = this.cart[key].quantity + 1;
                this.updateCart(this.cart)

                
            },
            changeAquantity: function(quantity, key){
                if(quantity < 1){
                    quantity = 1
                }
                this.cart[key].quantity = quantity;
                this.updateCart(this.cart)
            },
            updateCart: function(cart){
                window.localStorage.setItem('ShoppingCart', JSON.stringify(cart));
                this.$store.dispatch('updateShoppingCart', cart);
            },
            deductQuantity: function(product, key){
                if(this.cart[key].quantity > 1){
                    this.cart[key].quantity = this.cart[key].quantity - 1;
                    this.updateCart(this.cart)
                }
            },

        },
    }
</script>

<style scoped>

    .remove-btn{
        padding: 5px;
        font-size: 12px;
        margin: 0px;
    }

.align-rigth{
    text-align: right;
}

.checkout-area table tr{
    margin-bottom: 20px;
}
    .qty_number {
    position: relative;
    border: none;
    width: 131px;
    margin-top: 0px;
}
.total-cart{
    font-size: 17px;
    border-bottom: none;
    font-weight: bold;
}
.qty_number input {
    border: 0;
        border-right-color: currentcolor;
        border-right-style: none;
        border-right-width: 0px;
        border-left-color: currentcolor;
        border-left-style: none;
        border-left-width: 0px;
    width: 71px;
    height: 30px;
    text-align: center;
    border: 1px solid ;
    margin: auto;
    display: table;
    padding: 3px;
}


.qty_number .button.inc {
    right: 0;
    left: inherit;
}
.qty_number .button {
    cursor: pointer;
    width: 28px;
    position: absolute;
    top: 0;
    bottom: 0;
    margin: auto;
    border: 1px solid #000;
    left: 0;
    text-align: center;
    height: 29px;
    line-height: 28px;
    color: #000;
    border-radius: 0px;
    }

    .image{
        width: 120px;
        margin-right: 20px;
    }



    thead tr{
        border-bottom: 1px solid #b4b4b4;
        border-top: 1px solid #b4b4b4;
        font-size: 17px;
    }
    tbody tr{
        border-bottom: 1px solid #b4b4b4;
    }


</style>


