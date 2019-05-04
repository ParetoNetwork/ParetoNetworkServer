<template>
    <ul class="mt-sm-2 mt-md-0">
        <li class="row text-left p-0 m-0 mr-1" :key="row"
            v-for="row of speeds">
            <div class="cl-4 mr-1" :style="getColor(row)"> </div>
            <p class="cl-8" style="font-size: 0.75em;"> {{getTime(row)}} </p>
        </li>
    </ul>
</template>

<script>
    export default {
        name: "VDelay"
        ,
        data: function () {
            return {
                speeds:[1,2,3,4]
            }
        },
        props: [
            'contentDelay'
        ]
        , beforeMount: function () {


        },
        methods: {
            getColor(speed) {
                switch (speed) {
                    case 1: {
                        return {"background": "#c24e4e !important", "width": "5px"}
                    }
                    case 2: {
                        return {"background": "#ca9036 !important", "width": "5px" }
                    }
                    case 3: {
                        return {"background": "#6ac27e !important", "width": "5px" }
                    }
                    case 4: {
                        return {"background": "#294b83 !important", "width": "5px" }
                    }
                }


                return {};
            },

            getTime(speed) {
                const seconds = this.contentDelay.blockDelay[speed]*12;
                const days =  Math.floor( seconds/86400);
                const hours =  Math.floor((seconds%86400)/3600);
                const min =  Math.floor(((seconds%86400)%3600)/60);
                const secods = (((seconds%86400)/3600)/60)-min;
                return (days<9?"0"+days:days) + ":"+(hours<9?"0"+hours:hours)+":"+(min<9?"0"+min:min);//+":"+ ":"+seconds;
            }
        }
    }
</script>

<style scoped>

</style>