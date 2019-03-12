<template>
    <div class="main wrapp pareto-blue-dark">
        <div class="container-fluid px-lg-5">
            <div class="row m-0 pt-5" style="min-height: 100vh; width: 100%;">
                <div class="col-md-4 mb-5 mt-2 m-sm-0">
                    <VProfile :addressProfile="address"></VProfile>
                </div>
                <div class="col-md-8 px-0 px-md-3 mb-3">
                    <VIntelFeed :user="user" :fetchAddress="address" :address="true" :title="title"></VIntelFeed>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import VIntelFeed from '../components/VIntelFeed';
    import VProfile from '../components/VProfile';
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