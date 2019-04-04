

  <template>
      <div>
          <div class='products'>
              <div v-for='(product, index) in productsDataList'  :class="'product'">

                  <div class='name'>{{ product.name }}</div>
                  <div class='desc'>{{product.description }}</div>
                  <div class='price'>$ {{product.price / 100}}</div>
                  <button @click='addToCart(product, index)'>Add to Cart</button><br><br></div>

          </div>

      </div>
</template>

<script>

    import { mapActions, mapState } from 'vuex';

    export default {
        name: 'VProductsList',
        computed: {
            ...mapState(['CartTotal', 'cartSubtotal', 'taxShop', 'shoppingCart']),

        },
        props: [ 'products-data-list'],

        data: function () {
            return {
                showModal: false,
                modalData: {},
                modalAmount: 1,
                timeout: "",
                mousestop: ""
            }
        },

        methods: {
            ...mapActions(["addsubtotaltocart", "addQuantityToCart", "addsubtotaltocart"]),
            active_product(product){
                return product.active === true
            },
            addToCart: function (product, index) {

                let cart = [];
                var found = false
                if(window.localStorage.getItem('ShoppingCart')){
                    cart = JSON.parse(window.localStorage.getItem('ShoppingCart'));
                    
                     for (var i = 0; i < this.shoppingCart.length; i++){
                        
                        if(cart[i].id === product.id){
                            product.quantity = cart[i].quantity + 1;
                            cart[i] = product;
                            found = true;
                            break;
                        }
                    }

                }if(!found){
                    product.quantity = 1;
                    cart.push(product)
                }

                this.$store.dispatch('updateShoppingCart', cart);

                window.localStorage.setItem('ShoppingCart', JSON.stringify(cart));
                
            },

        }
    }
</script>
