<template>
    <b-modal
            centered
            hide-header
            hide-footer
            ref="myModalRef"
            title="Edit Profile"
            @hide="onClosedModal">
        <div class="d-block text-center pt-5">
                <div class="input-group mb-3 create-input-space">
                    <span class="floating-label create-content-text title-user-content">
                        <b> Alias </b>
                    </span>
                </div>
            <b-row class="m-2 mt-4 d-flex justify-content-end">
                <button
                        class="btn btn-dark-primary-pareto mt-2 ml-2 order-md-2" @click="onClosedModal"> Thank You
                </button>

            </b-row>
        </div>
    </b-modal>
</template>
<script>
    import { mapMutations} from 'vuex';

    export default {
        name: 'VModalInfo',
        props : [
          'tutorial'
        ],
        data : function(){
            return {

            }
        },

        mounted() {

        },
        methods: {
            onClosedModal() {
                this.$store.state.showModalInfo = false;
            }
        }
    }
</script>
<style>

</style>