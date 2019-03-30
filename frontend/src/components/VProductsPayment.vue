<template>
    <div class="main-wrapper">
        <div class="header"><h1>Payment area</h1></div>
        <div id="vue">


            <div class="checkout-area">
                <span> {{ cart | cartSize }} </span><i class="fa fa-shopping-cart"></i>


            </div>
            <div class="align-left">
                <label for="card-element">
                    Email
                </label>
                <input type="email" placeholder="example@example.com" v-model="user_email" required>
            </div>


                <form action="/charge" method="post" id="payment-form">
                    <div class="form-row">
                        <input id="cardholder-name" type="text">

                        <label for="card-element">
                            Credit or debit card
                        </label>
                        <div id="card-element">
                            <!-- A Stripe Element will be inserted here. -->
                        </div>

                        <!-- Used to display form errors. -->
                        <div id="card-errors" role="alert"></div>
                    </div>
                    <button id="card-button" :data-secret="client_secret">
                        Submit Payment
                    </button>

                </form>


            </div>
        </div>
    </div>
</template>

<script>
    /* eslint-disable */



    import ProductService from '.././services/productService'

    export default {
        name: "VProductCheckout",
        created: function(){
            this.cart = JSON.parse(window.localStorage.getItem('ShoppingCart'));
            if (this.$route.query.order_id){
                this.order_id = this.$route.query.order_id;
                this.client_secret = this.$route.query.client_secret;
            }else {
                this.$router.push('/')
            }

        },
        mounted: function(){

            // Create a Stripe client.
            var pk_stripe = window.localStorage.getItem('public_key_stripe');
            var stripe = Stripe(pk_stripe, {
                betas: ['payment_intent_beta_3']
            });

            // Create an instance of Elements.
            var elements = stripe.elements();

            // Custom styling can be passed to options when creating an Element.
            // (Note that this demo uses a wider set of styles than the guide below.)
            var style = {
                base: {
                    color: '#32325d',
                    fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                    fontSmoothing: 'antialiased',
                    fontSize: '16px',
                    '::placeholder': {
                        color: '#aab7c4'
                    }
                },
                invalid: {
                    color: '#fa755a',
                    iconColor: '#fa755a'
                }
            };

            // Create an instance of the card Element.
            var cardElement = elements.create('card', {style: style});

            // Add an instance of the card Element into the `card-element` <div>.
            cardElement.mount('#card-element');

            // Handle real-time validation errors from the card Element.
            cardElement.addEventListener('change', function(event) {
                var displayError = document.getElementById('card-errors');
                if (event.error) {
                    displayError.textContent = event.error.message;
                } else {
                    displayError.textContent = '';
                }
            });



            var self = this;
            var form = document.getElementById('payment-form');
            form.addEventListener('submit', function(event) {
                event.preventDefault();
                if(self.user_email === ''){
                    alert("Email can't be blank")
                }else{
                    stripe.createToken(cardElement).then(function(result) {
                        if (result.error) {
                            // Inform the user if there was an error.
                            var errorElement = document.getElementById('card-errors');
                            errorElement.textContent = result.error.message;
                        } else {
                            // Send the token to your server.

                            self.stripeTokenHandler(result.token);
                        }
                    });
                }
            });

            var cardholderName = document.getElementById('cardholder-name');
            var cardButton = document.getElementById('card-button');
            var clientSecret = cardButton.dataset.secret;

            cardButton.addEventListener('click', function(ev) {
                stripe.handleCardPayment(
                    clientSecret, cardElement, {
                        source_data: {
                            owner: {name: cardholderName.value, email: self.user_email}
                        }
                    }
                ).then(function(result) {
                    if (result.error) {
                       alert("error on payment")
                    } else {

                        alert("good job")
                        // The payment has succeeded. Display a success message.
                    }
                });
            });

// Submit the form with the token ID.


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
                order_id: '',
                user_email: '',
                client_secret: ''


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

            stripeTokenHandler: function (token) {
                // Insert the token ID into the form so it gets submitted to the server
                let order_id = window.localStorage.getItem('order_id');

                ProductService.payOrder(token.id, order_id, this.user_email)
            },
            checkout () {

                ProductService.createOrder(this.cart,
                    res => {

                        this.order_id = res.message.id;

                    },error => {
                        alert("Error on create order")
                    }
                );


            },
            done ({token, args}) {

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


    .main-wrapper #vue {

        margin: 0 auto;
        padding: 10em 22.5em;
    }

    ::-webkit-input-placeholder { /* Chrome/Opera/Safari */
        color: #a7a7a7;
    }
    ::-moz-placeholder { /* Firefox 19+ */
        color: #a7a7a7;
    }
    :-ms-input-placeholder { /* IE 10+ */
        color: #a7a7a7;
    }
    :-moz-placeholder { /* Firefox 18- */
        color: #a7a7a7;
    }

    input {

        width: 68%;
        border-radius: 5px;
        -webkit-box-sizing: border-box;
        box-sizing: border-box;
        height: 40px;
        padding: 10px 12px;
        border: 1px solid transparent;
        border-radius: 4px;
        background-color: white;
        width: 46%;
        -webkit-box-shadow: 0 1px 3px 0 #e6ebf1;
        box-shadow: 0 1px 3px 0 #e6ebf1;
        -webkit-transition: box-shadow 150ms ease;
        -webkit-transition: -webkit-box-shadow 150ms ease;
        transition: -webkit-box-shadow 150ms ease;
        transition: box-shadow 150ms ease;
        transition: box-shadow 150ms ease, -webkit-box-shadow 150ms ease;
        text-align: left;
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

        width: 100%;

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


