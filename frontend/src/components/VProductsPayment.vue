<template>
    <div class="main-wrapper">
        <div id="payment">

            <div class="container">
                <h4 class="align-left">3. Payment</h4>
                <hr>
                <div class="row justify-content-center">
                    <div class="col-md-4">
                        <div class="card" style="width: 90%;">
                            <div class="card-body">
                                <h5 class="card-title">Resume</h5>
                                <table class="table table-responsive-lg position-relative">
                                    <thead>
                                    <tr><td><b>Customer:</b></td><td> {{user_name}}</td></tr>
                                    <tr><td style="border-top: none"><b>Email:</b></td><td style="border-top: none"> {{user_email}}</td></tr>
                                    <tr>
                                        <th>Name</th>
                                        <th>Amount</th>

                                    </tr>
                                    </thead>
                                    <tbody>
                                    <tr v-for="(product, key) in cart">
                                        <td>{{ product.attributes.name }}</td>

                                        <td>
                                            {{product.quantity}}
                                        </td>

                                    </tr>

                                    <tr class="total-cart">

                                        <td>Total</td>
                                        <td>${{getCartTotal/100}}</td>
                                    </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 col-xs-12">
                        <form action="/charge" method="post" id="payment-form">


                            <div class="form-group">
                                <label for="card-element">
                                    Credit or debit card
                                </label>
                                <div id="card-element">
                                    <!-- A Stripe Element will be inserted here. -->
                                </div>
                            </div>

                            <!-- Used to display form errors. -->
                            <div id="card-errors" role="alert"></div>

                            <button id="card-button" v-show="!waiting_payment" :data-secret="client_secret">
                                Submit Payment
                            </button>

                            <div v-show="waiting_payment">

                                <p>Waiting for payment approval. This may take a while</p>
                                <div class="loader"></div>
                            </div>

                        </form>
                    </div>
                </div>

            </div>

            </div>

    </div>
</template>

<script>
    /* eslint-disable */



    import ProductService from '.././services/productService'
    import PurchaseService from '.././services/purchaseService'


    export default {
        name: "VProductCheckout",
        created: function(){
            this.cart = JSON.parse(window.localStorage.getItem('ShoppingCart'));
            if (window.localStorage.getItem('order_id')){
                this.order_id = window.localStorage.getItem('order_id');
                this.client_secret = window.localStorage.getItem('client_secret');
                this.payment_intent = window.localStorage.getItem('payment_id');
                this.customer_id = window.localStorage.getItem('customer');
                let customer_details = JSON.parse(window.localStorage.getItem('customer_details'));
                this.user_email = customer_details.email;
                this.user_name = customer_details.name;

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

            var cardholderName = this.user_name;
            var cardholderEmail = this.user_email;
            var cardButton = document.getElementById('card-button');
            var clientSecret = cardButton.dataset.secret;

            cardButton.addEventListener('click', function(ev) {
                self.waiting_payment = true;
                stripe.handleCardPayment(
                    clientSecret, cardElement, {
                        source_data: {
                            owner: {name: cardholderName.value, email: cardholderEmail.value}
                        }
                    }
                ).then(function(result) {
                    if (result.error) {
                       self.waiting_payment = false;
                       alert("error on payment")
                    } else {
                        window.localStorage.setItem('ShoppingCart', '');
                        self.$store.dispatch('resetShoppingCart');
                        window.localStorage.removeItem('order_id');
                        window.localStorage.removeItem('client_secret');
                        window.localStorage.removeItem('payment_id');
                        window.localStorage.removeItem('customer');
                        window.localStorage.removeItem('customer_details');


                        self.$router.push({path: '/thankyou-payment'});


                        /*  setTimeout(function () {

                              PurchaseService.initTransactionFlow(self.payment_intent,
                                  response => {

                                      self.$router.push({path: '/thankyou-payment'});
                                  },
                                  err => {
                                      console.log("error on purchase")
                                  }
                              );
                          }, 10000);*/




                        // The payment has succeeded. Display a success message.
                    }
                });
            });

// Submit the form with the token ID.


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
        data: function() {
            return {
                showModal: false,
                cartTotal: 0,
                cartSubTotal: 0,
                cart: [],
                currency: 'USD',
                order_id: '',
                user_email: '',
                user_name: 'Dani',
                client_secret: '',
                waiting_payment: false,
                payment_intent: '',
                cus_customer_id: ''


            }
        },
        methods: {

            stripeTokenHandler: function (token) {
                // Insert the token ID into the form so it gets submitted to the server
                let order_id = window.localStorage.getItem('order_id');

                ProductService.payOrder(token.id, order_id, this.user_email, this.customer_id)
            },


        },



    }
</script>

<style scoped>

    body{
        color: black !important;
    }
#payment{
    padding-top: 120px;
    padding-bottom: 50px;
    background-color: #fff;
    color: #000
}

#payment h4{
    color: black;
}

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

    label{
        display: inline-block;
        color: black;
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

    p {
        color: black;
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

.loader {
    height: 4px;
    width: 100%;
    position: relative;
    overflow: hidden;
    background-color: #ddd;
}
.loader:before{
    display: block;
    position: absolute;
    content: "";
    left: -200px;
    width: 200px;
    height: 4px;
    background-color: #2980b9;
    animation: loading 2s linear infinite;
}

@keyframes loading {
    from {left: -200px; width: 30%;}
    50% {width: 30%;}
    70% {width: 70%;}
    80% { left: 50%;}
    95% {left: 120%;}
    to {left: 100%;}
}
</style>


