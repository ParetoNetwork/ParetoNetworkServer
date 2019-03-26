<template>
<div class="main-wrapper">
    <div class="header"><h1>Products</h1></div>
    <div id="vue">
    
        <h1>Checkout Area</h1>
        <div class="checkout-area">
            <span> {{ cart | cartSize }} </span><i class="fa fa-shopping-cart"></i>
            <table>
                <thead>
                <tr>
                    <th></th>
                    <th></th>
                    <th class="align-center">SKU</th>
                    <th>Name</th>
                    
                    <th class="align-left">Amount</th>
                    <th class="align-right">Price</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="product in cart">
                    <td><button @click="removeProduct(product)"> X </button></td>
                    <td><img class="image" :src="product.skus.data[0].image"></td>
                    <td class="align-center">{{ product.skus.data[0].id }}</td>
                    <td>{{ product.skus.data[0].attributes.name }}</td>
                    
                    <td class="align-right">
                        <div class="qty_number">
                            <input type="text" :value='product.quantity'>
                            <div class="inc button"><span>+</span></div>
                            <div class="dec button"><span>-</span></div>
                        </div>
                    </td>
                    <td class="align-right"> $ {{ product.skus.data[0].price}}</td>
                </tr>
                
                <tr>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                </tr>
                
                <tr>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td class="align-right vert-bottom">Total:</td>
                    <td class="align-right vert-bottom"><h2>$ {{ getCartTotal }} </h2></td>
                </tr>
                </tbody>
            </table>
            <button  @click="checkoutModal()">Checkout</button></div>
        <div class='modalWrapper' v-show='showModal'>
            <div class='overlay' @click='hideModal()'></div>
            <div class='modal checkout'>
                <i class='close fa fa-times' @click='hideModal()'></i>
                <h1>Checkout</h1>
                <div>We accept: <i class='fa fa-stripe'></i> <i class='fa fa-cc-visa'></i> <i class='fa fa-cc-mastercard'></i> <i class='fa fa-cc-amex'></i> <i class='fa fa-cc-discover'></i></div><br>
                
                <h1> Total: {{ getCartTotal }} </h1>
                <br><div>This is where our payment processor goes</div>
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
                showModal: false,
                cartTotal: 0,
                cartSubTotal: 0,
                cart: [],
                currency: ''

            }
        },

        filters: {
            customPluralize: function(cart) {
                var newName;

                if(cart.quantity > 1) {
                    newName = cart.product + "s";
                    return newName;
                }

                return cart.product;
            },

            cartSize: function(cart) {
                var cartSize = 0;

                for (var i = 0; i < cart.length; i++) {
                    cartSize += cart[i].quantity;
                }

                return cartSize;
            }
        },
         computed: {
            
            getCartTotal: function () {
                
              var total = 0;
                if(this.cart.length > 0){
                    for (var i = 0; i < this.cart.length; i++) {
                       
                        total += this.cart[i].quantity * this.cart[i].skus.data[0].price;
                    }
                }else{
                    total = 0;
                }
                return total;
            }
        },

        methods: {
            removeProduct: function(product) {
                this.cart.$remove(product);
                this.cartSubTotal = this.cartSubTotal - (product.price * product.quantity);
                this.cartTotal = this.cartSubTotal + (this.tax * this.cartSubTotal);

                if(this.cart.length <= 0) {
                    this.checkoutBool = false;
                }
            },

            checkoutModal: function() {
                var self = this;
                self.showModal = true;

                console.log("CHECKOUT", self.cartTotal);

            },

            hideModal: function() {
                //hide modal and empty modal data
                var self = this;
                self.showModal = false;
            }
        },

        //intercept the checkout request broadcast
        //run our function
        events: {
            "checkoutRequest": function() {
                var self = this;
                self.checkoutModal();
            }
        }



    }
</script>

<style scoped>

.checkout-area table tr{
    margin-bottom: 20px;
}
    .qty_number {
    position: relative;
    border: none;
    width: 131px;
    margin-top: 0px;
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
    border-left: 1px solid #aaa;
    border-right: 1px solid #aaa;
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
    width: 30px;
    position: absolute;
    top: 0;
    bottom: 0;
    margin: auto;
    left: 0;
    text-align: center;
    height: 30px;
line-height: 25px;
}

.image{
    width: 80px;
}
</style>


