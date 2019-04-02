<template>

  <div class="main-wrapper">
    <div class="header"><h1>Products</h1></div>
    <div id="vue">
      <VProductsList :cart="cart" :products-data-list="productsDatalist"></VProductsList>
    </div>
  </div>

</template>

<script>
  import VProductsList from './VProductsList'
  import productService from '.././services/productService'

  export default {
    name: 'VProducts',
    created: function(){


      productService.listProducts(
        res => {

          this.productsDatalist =  res.data
        },
        error => {

        }
      )


    },
    data: function () {
      return {
        productsData: [],
        productsDatalist: [],
        checkoutBool: false,
        cart: [],
        cartSubTotal: 0,
        tax: 0.065,
        cartTotal: 0
      }
    },
    components: {
       VProductsList
    },

    //intercept the checkout request dispatch
    //send it back down the chain
    events: {
      "checkoutRequest": function() {
        vue.$broadcast("checkoutRequest");
      }
    }
  }
</script>

<style lang="scss">
  @import url(https://fonts.googleapis.com/css?family=Bitter:400,400italic,700);

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;

  }

  $mobile: 600px;
  $max-width: 80em;

  @mixin aspect-ratio($width, $height) {
    position: relative;
    &:before {
      display: block;
      content: "";
      width: 100%;
      padding-top: ($height / $width) * 100%;
    }
    > .content {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }
  }

  @keyframes openUp {
    0% {
      transform: translate(-50%, -50%) scale(0.5);
    }

    100% {
      transform: translate(-50%, -50%) scale(1);
    }
  }

  button {
    appearance: none;
    padding: 0.5em;
    margin: 0.5em 0;
    background: white;
    border: 1px solid black;
    transition: all 0.1s;
    font-size: 14px;
    cursor: pointer;
    user-select: none;

    .fa {
      font-size: 1em !important;
      vertical-align: middle;
    }

    &:hover {
      color: white;
      background: black;
    }
  }

  input {
    display: inline-block;
    appearance: none;
    padding: 0.5em;
    margin: 0.5em 0.5em 0.5em 0;
    width: 50px;
    background: white;
    border: 1px solid black;
    transition: all 0.1s;
    font-size: 14px;
  }

  label {
    font-size: 0.75em;
    margin-right: 0.5em;
  }

  .checkout-area table {
    margin: 20px auto;
    padding: 0.5em;
    width: 100%;
    max-width: 90%;
    text-align: left;

    th, td {
      padding: 10px 1.25em;
    }

    @media(max-width: $mobile) {
      th:nth-child(3), td:nth-child(3) {
        display: none;
      }
    }
  }

  .align-left {
    text-align: left;
  }

  .align-center {
    text-align: center;
  }

  .align-right {
    text-align: right;
  }

  .vert-bottom {
    vertical-align: bottom;
  }

  .vert-middle {
    vertical-align: middle;
  }

  .main-wrapper {
    .header {

      background: linear-gradient(to left, #16222A , #3A6073);
      background-size: cover;
      height: 18em;
      width: 100vw;
      box-shadow: inset -1px -3px 5px rgba(0,0,0,0.5), inset 1px 3px 5px rgba(0,0,0,0.5);
      text-align: center;

      h1 {
        color: white;
        position: absolute;
        left: 15%;
        bottom: 50px;
        font-size: 3em;
        text-shadow: 1px 3px 5px rgba(0,0,0,0.5), -1px -3px 5px rgba(0,0,0,0.5);
      }
    }

    #vue {
      margin: 0 auto;
      padding: 9.5em;
      text-align: center;
      background: #fff;
      color: black;

      .cart {
        position: fixed;
        right: 0em;
        top: 100px;
        text-align: right;
        background: rgba(0,0,0,0.85);
        color: black;
        z-index: 10;
        display: flex;

        .fa-shopping-cart, .cart-size {
          cursor: pointer;
          font-size: 1.25em;
          user-select: none;
        }

        .fa-shopping-cart {
          padding: 1em 1em 1em 0;
          height: 57px;
          width: 57px;
        }

        .cart-size {
          padding: 1em 0 1em 1em;
        }


        .cart-items {
          padding: 0 1em 2em 1em;

          .cartTable {
            width: 20em;
          }

          .cartImage {
            width: 4em;
            height: 4em;
            margin: 0.5em auto;
            position: relative;
            cursor: pointer;

            &:after {
              content: "";
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: rgba(0,0,0,0.25);
              transition: all 0.1s;
            }

            i {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              font-size: 1.5em;
              z-index: 1;
              transition: all 0.25s;
            }

            &:hover {
              i {
                text-shadow: 1px 2px 5px black;
              }

              &:after {
                background: rgba(0,0,0,0.5);
              }
            }

            &:active {
              i {
                text-shadow: 0px 0px 1px black;
              }
            }
          }

          .cartSubTotal {
            border-top: 1px solid white;
            font-size: 1.25em;
          }

          .clearCart {
            float: left;
            margin-top: 2em;
            margin-bottom: 1.25em;
          }

          .checkoutCart {
            float: right;
            margin-top: 2em;
            margin-bottom: 1.25em;
          }
        }
      }

      .products {
        margin: 0 auto;
        margin-top: 5em;
        width: 100%;
        max-width: $max-width;

        .product {
          display: inline-block;
          margin: 0.75em;
          width: 100%;
          max-width: 18em;

          .image {
            width: 18em;
            height: 18em;
            margin-bottom: 0.5em;
            position: relative;
            overflow: hidden;

            transition: box-shadow 0.25s;

            @media(max-width: $mobile) {
              width: 100vw;
              height: 100vw;
            }




          }

          .name {
            font-weight: bold;
            font-size: 1.25em;
          }

          .desc {
            font-style: italic;
            min-height: 100px;
          }

          .price {
            font-weight: bold;
          }
        }
      }

      .modalWrapper {
        position: relative;

        .overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.7);
          //cursor: pointer;
          z-index: 2;
        }

        .prevProduct, .nextProduct {
          position: fixed;
          color: white;
          font-size: 2em;
          cursor: pointer;
          top: 50%;
          transform: translateY(-50%);
          padding: 1em;
          user-select: none;
          z-index: 5;
        }

        .prevProduct {
          left: calc(50% - 9.5em);
        }

        .nextProduct {
          right: calc(50% - 9.5em);
        }

        .modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          padding: 2em;
          text-align: center;
          max-height: calc(100% - 2em);
          overflow-y: scroll;
          overflow-x: hidden;
          animation: openUp 0.1s;
          z-index: 3;
          backface-visibility: hidden;

          .close {
            position: fixed;
            top: -0.5em;
            right: -0.5em;
            cursor: pointer;
            padding: 1em;
          }

          .imageWrapper {
            width: 25em;
            height: 25em;
            margin: 0.5em auto;
            overflow: hidden;

            .image {
              width: 100%;
              height: 100%;
              transition: transform 0.2s;
              z-index: 4;
              cursor: crosshair;
            }
          }

          .additionalImages {
            display: flex;
            width: 100%;
            margin: 0 auto;
            text-align: center;

            .additionalImage {
              flex-grow: 1;
              margin: 0.5em 1em;
              position: relative;
              overflow: hidden;
              cursor: pointer;
              width: 25%;
              height: auto;
              @include aspect-ratio(16, 12);

              &:nth-of-type(1n) {
                margin-left: 0;
              }

              &:nth-of-type(4n) {
                margin-right: 0;
              }
            }
          }

          .name {
            font-weight: bold;
            font-size: 1.25em;
          }

          .description {
            font-style: italic;
          }

          .details {
            max-width: 25em;
            margin: 0 auto;
            padding: 0.5em 0;
          }

          .price {
            font-weight: bold;
            padding-bottom: 0.5em;
          }
        }
      }

      @media(max-width: $mobile) {
        .cart {
          &, & .cartTable {
            width: 100% !important;
          }
        }

        .products {
          text-align: left;

          .product {
            display: block;

            .image {
              width: calc(100vw - 2.5em);
              height:  calc(100vw - 2.5em);
            }
          }
        }

        .modalWrapper {
          .prevProduct, .nextProduct {
            display: none;
          }

          .modal {
            &.checkout {
              width: 100%;
            }

            .imageWrapper {
              width: calc(100vw - 4em);
              height:  calc(100vw - 4em);
            }
          }
        }
      }
    }
  }

  .cart{
    font-size: 17px;
    padding-top: 6px;
    cursor: pointer;
  }


</style>