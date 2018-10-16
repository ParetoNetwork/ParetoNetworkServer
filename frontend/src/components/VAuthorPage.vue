<template>
    <div>
        <div class="container main wrapp">
            <div class="row pt-5">
                <div class="col-lg-4 mb-1 mt-2">
                    <VProfile :addressProfile="address"></VProfile>
                </div>
                <div class="col-lg-7 offset-lg-1 mb-3 px-0 mt-2">
                    <VIntelFeed :user="user" :fetchAddress="address" :title="title"></VIntelFeed>
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
                        console.log(this.user);
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