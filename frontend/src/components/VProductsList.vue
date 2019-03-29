

  <template>
      <div>
          <div class='products'>
              <div v-for='(product, index) in productsDataList'  :class="'product'">
                <div v-if="active_product(product)">
                  <div class='name'>{{ productsData[index].name }}</div>
                  <div class='desc'>{{ productsData[index].description }}</div>
                  <div class='price'>$ {{ product.price / 100}}</div>
                  <button @click='addToCart(productsData[index], index)'>Add to Cart</button><br><br></div>
              </div>
          </div>

      </div>
</template>

<script>

    import { mapActions, mapState } from 'vuex';

    export default {
        name: 'VProductsList',
        mounted: function () {


            var self = this;
            

            document.addEventListener("keydown", function (e) {
                if (self.showModal && e.keyCode == 37) {
                    self.changeProductInModal("prev");
                } else if (self.showModal && e.keyCode == 39) {
                    self.changeProductInModal("next");
                } else if (self.showModal && e.keyCode == 27) {
                    self.hideModal();
                }
            });
            console.log(this.productsData)

        },
        computed: {
            ...mapState(['CartTotal', 'cartSubtotal', 'taxShop', 'shoppingCart']),

        },
        props: ['products-data', 'products-data-list'],

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
                    product.skus = []
                    product.skus.data = []
                    product.skus.data = JSON.stringify(this.productsDataList[index]);
                    cart.push(product)
                    this.$store.dispatch('addToCart', product);
                }
                


                window.localStorage.setItem('ShoppingCart', JSON.stringify(cart));
                
            },

            modalAddToCart: function (modalData) {
                var self = this;

                for (var i = 0; i < self.modalAmount; i++) {
                    self.addToCart(modalData);
                }

                self.modalAmount = 1;
            },

            changeProductInModal: function (direction) {
                var self = this,
                    productsLength = this.productsData.length,
                    currentProduct = self.modalData.sku,
                    newProductId,
                    newProduct;

                if (direction === "next") {
                    newProductId = currentProduct + 1;

                    if (currentProduct >= productsLength) {
                        newProductId = 1;
                    }

                } else if (direction === "prev") {
                    newProductId = currentProduct - 1;

                    if (newProductId === 0) {
                        newProductId = productsLength;
                    }
                }

                //console.log(direction, newProductId);

                for (var i = 0; i < productsLength; i++) {
                    if (this.productsData[i].sku === newProductId) {
                        self.viewProduct(this.productsData[i]);
                    }
                }


            },

            hideModal: function () {
                //hide modal and empty modal data
                var self = this;
                self.modalData = {};
                self.showModal = false;
            },

            changeImage: function (image) {
                var self = this;
                self.modalData.image = image;
            },

            imageMouseOver: function (event) {
                event.target.style.transform = "scale(2)";
            },

            imageMouseMove: function (event) {
                var self = this;

                event.target.style.transform = "scale(2)";

                self.timeout = setTimeout(function () {
                    event.target.style.transformOrigin = ((event.pageX - event.target.getBoundingClientRect().left) / event.target.getBoundingClientRect().width) * 100 + '% ' + ((event.pageY - event.target.getBoundingClientRect().top - window.pageYOffset) / event.target.getBoundingClientRect().height) * 100 + "%";
                }, 50);

                self.mouseStop = setTimeout(function () {
                    event.target.style.transformOrigin = ((event.pageX - event.target.getBoundingClientRect().left) / event.target.getBoundingClientRect().width) * 100 + '% ' + ((event.pageY - event.target.getBoundingClientRect().top - window.pageYOffset) / event.target.getBoundingClientRect().height) * 100 + "%";
                }, 100);
            },

            imageMouseOut: function (event) {
                event.target.style.transform = "scale(1)";
            }
        }
    }
</script>
