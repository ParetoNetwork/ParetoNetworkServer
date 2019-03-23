

  <template>
      <div>
          <h1>Products</h1>
          <div class='products'>
              <div v-for='(product, index) in productsData'  :class="'product'">
                  <div class='image' @click='viewProduct(product)' v-bind:style='{ backgroundImage: "url(" +  product.image + ")" }' style='background-size: cover; background-position: center;'></div>
                  <div class='name'>{{ product.product }}</div>
                  <div class='description'>{{ product.description }}</div>
                  <div class='price'>{{ product.price}}</div>
                  <button @click='addToCart(product)'>Add to Cart</button><br><br></div>
          </div>
          <div class='modalWrapper' v-show='showModal'>
              <div class='prevProduct' @click='changeProductInModal("prev")'><i class='fa fa-angle-left'></i></div>
              <div class='nextProduct' @click='changeProductInModal("next")'><i class='fa fa-angle-right'></i></div>
              <div class='overlay' @click='hideModal()'></div>
              <div class='modal'>
                  <i class='close fa fa-times' @click='hideModal()'></i>
                  <div class='imageWrapper'><div class='image' v-bind:style='{ backgroundImage: "url(" +  modalData.image + ")" }' style='background-size: cover; background-position: center;' v-on:mouseover='imageMouseOver($event)' v-on:mousemove='imageMouseMove($event)' v-on:mouseout='imageMouseOut($event)'></div></div>
                  <div class='additionalImages' v-if='modalData.images'>
                      <div v-for='image in modalData.images' class='additionalImage' v-bind:style='{ backgroundImage: "url(" + image.image + ")" }' style='background-size: cover; background-position: center;' @click='changeImage(image.image)'></div>
                  </div>
                  <div class='name'>{{ modalData.product }}</div>
                  <div class='description'>{{ modalData.description }}</div>
                  <div class='details'>{{ modalData.details }}</div>
                  <h3 class='price'>{{ modalData.price  }}</h3>
                  <label for='modalAmount'>QTY</label>
                  <input id='modalAmount' value='modalAmount' v-model='modalAmount' class='amount' @keyup.enter='modalAddToCart(modalData), hideModal()'/>
                  <button @click='modalAddToCart(modalData), hideModal()'>Add to Cart</button>
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
        },
        computed: {
            ...mapState(['CartTotal', 'cartSubtotal', 'taxShop', 'shoppingCart'])
        },
        props: ['productsData'],

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

            addToCart: function (product) {
                var found = false;

               /* for (var i = 0; i < this.shoppingCart.length; i++) {
                    console.log(this.shoppingCart.length)
                    if (this.shoppingCart[i].sku === product.sku) {
                        var newProduct = this.shoppingCart[i];
                        newProduct.quantity = newProduct.quantity + 1;
                        //this.cart.$set(i, newProduct);
                        this.$store.dispatch('addQuantityToCart', i, newProduct);
                        //console.log("DUPLICATE",  this.cart[i].product + "'s quantity is now: " + this.cart[i].quantity);
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    product.quantity = 1;
                    this.$store.dispatch('addToCart', product);

                }*/
                let cart = [];
                if(window.localStorage.getItem('ShoppingCart')){
                    cart = JSON.parse(window.localStorage.getItem('ShoppingCart'));
                    product.quantity = 1
                    cart.push(product)
                }else{
                     product.quantity = 1
                    cart.push(product)
                }
                this.$store.dispatch('addToCart', product);


                window.localStorage.setItem('ShoppingCart', JSON.stringify(cart));
                //this.checkoutBool = true;
            },

            modalAddToCart: function (modalData) {
                var self = this;

                for (var i = 0; i < self.modalAmount; i++) {
                    self.addToCart(modalData);
                }

                self.modalAmount = 1;
            },

            viewProduct: function (product) {
                var self = this;
                //self.modalData = product;
                self.modalData = (JSON.parse(JSON.stringify(product)));
                self.showModal = true;
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
