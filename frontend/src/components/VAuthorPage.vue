<template>
    <div>
        <div class="container main wrapp">
            <div class="row pt-5">
                <div class="col-md-5 mb-5 mt-2 m-sm-0">
                    <VProfile :addressProfile="address"></VProfile>
                </div>
                <div class="col-md-7 mb-3">
                    <VIntelFeed :user="user" :fetchAddress="address"></VIntelFeed>
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