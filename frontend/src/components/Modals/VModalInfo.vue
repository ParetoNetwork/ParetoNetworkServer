<template>
    <b-modal
            centered
            hide-header
            hide-footer
            ref="modalInfo"
            title="Modal Info"
            @hide="onClosedModal">
        <div class="d-block pt-5 text-left m-3">
            <div class="row">
                <span class="title-user-content">
                    <b>{{tutorial.header}}</b>
                </span>
            </div>
            <div class="row mt-4">
                <span class="subtitle-user-content">
                    <b>{{tutorial.body}}</b>
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
    import { mapState } from 'vuex';

    export default {
        name: 'VModalInfo',
        data : function(){
            return {}
        },
        props: [
            'tutorial'
        ],
        computed: {
            ...mapState(['showModalInfoIntel', 'showModalInfoGraphs', 'showModalInfoProfile', 'showModalInfoActivity', 'showModalInfoLeaderboard'])
        },
        mounted() {
            this.$refs.modalInfo.show();
        },
        methods: {
            onClosedModal() {
                this.$store.state.showModalInfoProfile = false;
                this.$store.state.showModalInfoActivity = false;
                this.$store.state.showModalInfoIntel = false;
                this.$store.state.showModalInfoGraphs = false;
                this.$store.state.showModalInfoLeaderboard = false;
            }
        }
    }
</script>
<style>

</style>