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
                <tr v-for="(product, key) in cart">
                    <td><button @click="removeProduct(product)"> X </button></td>
                    <td><img class="image" :src="product.skus.data[0].image"></td>
                    <td class="align-center">{{ product.skus.data[0].id }}</td>
                    <td>{{ product.skus.data[0].attributes.name }}</td>
                    
                    <td class="align-right">
                        <div class="qty_number">
                            <input type="text" :value='product.quantity'>
                            <div class="inc button" @click="addQuantity(product, key)"><span>+</span></div>
                            <div class="dec button" @click="deductQuantity(product, key)"><span>-</span></div>
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
            <div>
                <VueStripeCheckout
                    ref="checkoutRef"
                    :image="image"
                    :name="name"
                    :description="description"
                    :currency="currency"
                    :amount="getCartTotal * 100"
                    :allow-remember-me="false"
                    @done="done"
                    @opened="opened"
                    @closed="closed"
                    @canceled="canceled"
                    ></VueStripeCheckout>
                <button @click="checkout">Pay ${{getCartTotal}} {{currency}}</button>
            </div>
            
        
     
       </div>
        </div>
        </div>
</template>

<script>
    /* eslint-disable */


import VueStripeCheckout from 'vue-stripe-checkout';
import ProductService from '.././services/productService'

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
                image: 'https://i.imgur.com/HhqxVCW.jpg',
                name: 'Pareto',
                description: 'Pareto Products',
                currency: 'USD',
                

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
            async checkout () {
            
            ProductService.createOrder(this.cart, 
                res => {
                    console.log(res)     
                },error => {

                }
            );

            const { token, args } = await this.$refs.checkoutRef.open();
            },
            done ({token, args}) {
                console.log(token)
                console.log(args)
            },
            opened () {
            // do stuff 
            },
            closed () {
            // do stuff 
            },
            canceled () {
            // do stuff 
            },
            removeProduct: function(product) {
                this.cart.$remove(product);
                this.cartSubTotal = this.cartSubTotal - (product.price * product.quantity);
                this.cartTotal = this.cartSubTotal + (this.tax * this.cartSubTotal);

                if(this.cart.length <= 0) {
                    this.checkoutBool = false;
                }
            },
            addQuantity: function(product, key){
                
            },
            deductQuantity: function(product, key){

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

    .StripeElement {
    box-sizing: border-box;

    height: 40px;

    padding: 10px 12px;

    border: 1px solid transparent;
    border-radius: 4px;
    background-color: white;

    box-shadow: 0 1px 3px 0 #e6ebf1;
    -webkit-transition: box-shadow 150ms ease;
    transition: box-shadow 150ms ease;
    }

    .StripeElement--focus {
    box-shadow: 0 1px 3px 0 #cfd7df;
    }

    .StripeElement--invalid {
    border-color: #fa755a;
    }

    .StripeElement--webkit-autofill {
    background-color: #fefde5 !important;
    }
</style>


