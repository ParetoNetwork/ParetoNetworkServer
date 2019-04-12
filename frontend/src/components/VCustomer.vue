<template>
    <div class="main-wrapper">
        <div id="vue">

            <div class="container checkout-area">



                <div class="row justify-content-left">

                    <div class="col-md-6 col-xs-12 text-left">
                        <h4>2. Customer details</h4>
                        <hr>
                        <div class="form-group">
                            <label for="cardholder-name">Fullname</label>
                            <input v-model="cus_fullname" id="cardholder-name" type="text" placeholder="your name" class="form-control">
                        </div>
                        <div class="form-group">
                            <label for="cardholder-email">Email address</label>
                            <input v-model="cus_email" type="email" id="cardholder-email" placeholder="name@example.com" required class="form-control">
                        </div>


                    </div>
                </div>

                <div class="align-rigth">
                    <button @click="checkout">PROCEED TO CHECKOUT</button>
                </div>

            </div>
        </div>
    </div>
</template>

<script>
    /* eslint-disable */



    import ProductService from '.././services/productService'

    export default {
        name: "VCustomer",
        created: function(){
            this.cart = JSON.parse(window.localStorage.getItem('ShoppingCart'));
        },

        data: function() {
            return {
                cus_email: '',
                cus_fullname: '',
                cart: [],
                order_id: ''
            }
        },
        methods: {
            checkout () {
                let customerDetails = {name: this.cus_fullname,  email: this.cus_email}
                ProductService.createOrder(this.cart, customerDetails ,
                    res => {

                        this.order_id = res.message.id;
                        window.localStorage.setItem('order_id', res.message.order.id);
                        window.localStorage.setItem('client_secret', res.message.intent.client_secret);
                        window.localStorage.setItem('payment_id', res.message.intent.id);
                        window.localStorage.setItem('customer', res.message.order.customer);
                        window.localStorage.setItem('customer_details', JSON.stringify(customerDetails));


                        this.$router.push({path: '/payment'})

                    },error => {
                        alert("Error on create order")
                    }
                );


            },


        },




    }
</script>

<style scoped>

    .align-rigth{
        text-align: right;
    }

    .checkout-area table tr{
        margin-bottom: 20px;
    }

</style>


