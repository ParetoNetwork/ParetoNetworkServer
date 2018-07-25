<template>
    <div class="main wrapp">
        <div class="container">
            <div class="row  pt-5">
                <div class="col-md-3">
                    <div class="row">
                        <div class="media p-3 border mb-3 w-100">
                            <div class="d-flex flex-column">
                                <span style="font-size: 320px; color: gray; background: #b2b2b2"
                                      class="fa fa-user p-2"></span>
                            </div>
                        </div>
                    </div>
                    <div class="row border p-5">
                        <div class="text-group">
                            <h6 class="subtitle-dashboard"><b> ABOUT BRYCE W. </b></h6>
                            <p> Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                                incididunt ut labore et dolore magna aliqua.
                                Ut enim ad minim veniam, quis nostrud exercitation ullamco
                                laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
                                reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.  </p>
                        </div>
                        <div class="mt-2">
                            <img src="../assets/images/LogoMarkColor.svg" width="20px" alt="" class="mr-2">
                            <span class="mb-3 text-dashboard text-pareto-gray"><b>NETWORK RANKING:</b> 20000 </span>
                        </div>
                        <button class="btn btn-success mt-5">
                            <span class="px-4 subtitle-dashboard">REWARD AUTHOR</span>
                        </button>
                        <div class="border-bottom mt-3 p-2">
                            <i class="fa fa-search"></i> <span class="text-pareto-gray ml-3"> You don't have posted </span>
                        </div>
                        <div class="border-bottom mt-3 p-2">
                            <i class="fa fa-book"></i> <span class="text-pareto-gray ml-3"> View Author's Articles </span>
                        </div>

                    </div>
                </div>
                <div class="col-md-9">
                    <div class="row text-group ml-4">
                        <div class="border p-4">
                            <div class="row py-4 border-bottom m-0">
                                <div class="col-md-10 p-0">
                                    <span class="name-title"> Research Initiated on iExec RLC token and decentralized computing sector </span>
                                </div>
                                <div class="col-md-2 p-0">
                                    <div class="text-group-right">
                                        <h6 class="subtitle-dashboard"><b> BRYCE W. </b></h6>
                                        <p> 1408 Blocks Ago... </p>
                                        <span class="text-dashboard text-pareto-gray"> REWARDED 34 TIMES </span>
                                    </div>
                                </div>
                            </div>

                            <div class="text-group mt-4">
                                <p> The standard Lorem Ipsum passage, used since the 1500s
                                    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                                    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
                                    voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."

                                    Section 1.10.32 of "de Finibus Bonorum et Malorum", written by Cicero in 45 BC
                                    "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi
                                    architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione
                                    voluptatem sequi nesciunt. Neque porro quisquam est,
                                    qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut
                                    labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut
                                    aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum
                                    fugiat quo voluptas nulla pariatur?"  </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>
<script>
    import DashboardService from '../services/dashboardService';
    import ProfileService from '../services/profileService';

    export default {
        name: 'VIntelDetail',
        data: function () {
            return {
                id: this.$route.params.id,
                addre: ''
            };
        },
        mounted: function () {
            console.log(this.id);
            this.address();
            this.intel();
        },
        methods: {
            address: function () {
                DashboardService.getAddress(res => {
                    console.log(res);
                    this.profile()
                }, () => {

                });
            },

            intel: function () {
                DashboardService.getIntel(res => {
                   console.log(res);
                }, error => {
                    console.log(error);
                }, this.id);
            },

            profile: function () {
                ProfileService.getSpecificProfile( res=> {
                    console.log(res);
                }, error => {
                    console.log(error);
                }, this.addre)
            }
        }
    };
</script>

<style scoped lang="scss">
    .wrapp {
        color: black;
        font-size: 12px;
    }

    li > .split {
        cursor: pointer;
        border-bottom: 1px solid rgba(0, 0, 0, 0.125);
        padding-bottom: 0.5rem;

    }

    li, .list-group-item:last-child > .split {
        border-bottom: 0;

    }

    .text-group{
        text-align: left;
    }

    .text-group-right{
        text-align: right;
    }

    .name-title {
        font-size: 25px;
        font-weight: bold;
        font-style: normal;
        font-stretch: normal;
        line-height: normal;
        letter-spacing: normal;
        text-align: center;
        color: #020f1f;
    }

    .icon-mini {
        object-fit: contain;
        height: auto;
        margin-right: 5px;
    }

    .title {
        font-size: 18px;
        font-weight: bold;
        font-style: normal;
        font-stretch: normal;
        line-height: normal;
        letter-spacing: normal;
    }

    .text-dashboard {
        font-size: 10px;
        font-weight: normal;
        font-style: normal;
        font-stretch: normal;
        line-height: normal;
        letter-spacing: normal;
    }

    .subtitle-dashboard {
        font-size: 10px;
        font-weight: bold;
        font-style: normal;
        font-stretch: normal;
        line-height: normal;
        letter-spacing: normal;
    }

    #wrapper {
        position: relative;
    }

    #wrapper .text {
        position: absolute;
        bottom: 0;
        display: none;
    }

    #wrapper:hover .text {
        display: flex;
        background: rgba(0,0,0,0.5);
    }
</style>