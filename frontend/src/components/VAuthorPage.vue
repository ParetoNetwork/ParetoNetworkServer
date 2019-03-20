<template>
    <div class="main wrapp pareto-blue-dark">
        <div class="container-fluid px-lg-5">
            <div class="row m-0 pt-4 pt-lg-2" style="width: 100%;">
                <div class="col-12 order-last order-lg-first col-lg-2 mr-2 mb-4">
                    <VProfile :addressProfile="address"></VProfile>
                </div>
                <div class="col-12 col-lg-8 mb-4 px-2 intel-container">
                    <VIntelFeed :user="user" :fetchAddress="address" :address="true" :title="title"></VIntelFeed>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import VIntelFeed from  './VIntelFeed';
    import VProfile from  './VProfile';
    import profileService from "../services/profileService";

    export default {
        name: "VAuthorPage",
        components: {VIntelFeed, VProfile},
        beforeMount: function(){
            this.loadProfile();
        },
        data: function () {
            return{
                title : 'AUTHOR FEED',
                address: this.$route.params.address,
                user: {
                    rank: 0,
                    score: 0,
                    tokens: 0
                },
            }
        },
        methods: {
            loadProfile: function () {
                return profileService.getProfile(
                    res => {
                        this.user = res;
                    },
                    () => {
                    }
                );
            },
        }
    }
</script>

<style scoped>

</style>