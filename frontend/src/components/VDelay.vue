<template>
    <ul id='vdelay' class="mt-sm-2 mt-md-0">
        <li class="row text-left p-0 m-0 mr-1 mr-md-3" :key="row" v-for="row of priorities">
            <div class="col col-0 col-xs-0" :id="('priority'+row)" :style="getBorderColor(row)" @click="setSelection(row)">
                <div class="cl-4 mr-1" :style="getColor(row)"> </div>
                <p v-if="intelDelay.blockDelay" class="cl-8" style="font-size: 0.75em;"> {{getTime(row)}} </p>
                <p v-else class="cl-8" style="font-size: 1em; border: 1px;"> {{row}} </p> <!-- wish to show text here when larger screen -->
            </div>
        </li>
    </ul>
</template>

<script>
    export default {
        name: "VDelay"
        ,
        data: function () {
            return {
                priorities:[1,2,3,4],
                chosenPriority: 2
            }
        },
        props: [
            'intelDelay'
        ]
        , beforeMount: function () {

        }, mounted: function() {
            $('ul#vdelay > li:nth-child(2) > div').addClass('selected-state');
        },
        methods: {
            getColor(priority) {
                switch (priority) {
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

            getTime(priority) {
                const seconds = this.intelDelay.blockDelay[priority]*12; //the object before being passed in is called contentDelay.blockDelay
                const days =  Math.floor( seconds/86400);
                const hours =  Math.floor((seconds%86400)/3600);
                const min =  Math.floor(((seconds%86400)%3600)/60);
                return (days<=9?"0"+days:days) + ":"+(hours<=9?"0"+hours:hours)+":"+(min<=9?"0"+min:min);//+":"+ ":"+seconds;
            },

            getPriority(priority) {
                let priorities = ["Premier", "High", "Medium", "Low"];
                return priorities[priority-1];
            },

            getBorderColor(priority) {
                switch (priority) {
                    case 1: {
                        return {"border": "1px solid #c24e4e", "list-style-position": "inside"}
                    }
                    case 2: {
                        return {"border": "1px solid #ca9036", "list-style-position": "inside"}
                    }
                    case 3: {
                        return {"border": "1px solid #6ac27e", "list-style-position": "inside"}
                    }
                    case 4: {
                        return {"border": "1px solid #294b83", "list-style-position": "inside"}
                    }
                }


                return {};
            },
            setBackgroundColor(priority){
                switch(priority){
                    case 1:
                        return '#c24e4e';
                    case 2:
                        return '#ca9036';
                    case 3:
                        return '#6ac27e';
                    case 4:
                        return '#294b83';

                }
            },
            setSelection(priority){

                $('ul#vdelay > li > div').removeClass('selected-state');

                let e = '#priority'+priority;
                $(e).addClass('selected-state');

                this.chosenPriority = priority;
                this.$emit('chosenPriority', priority);
            }
        }
    }
</script>

<style lang="scss">

    #priority1:active, #priority1:hover, #priority1:focus, #priority1.selected-state {
        background: #c24e4e;
    }

    #priority2:active, #priority2:hover, #priority2:focus, #priority2.selected-state {
        background: #ca9036;
    }

    #priority3:active, #priority3:hover, #priority3:focus, #priority3.selected-state {
        background: #6ac27e;
    }

    #priority3.selected-state {
        background: #6ac27e;
    }

    #priority4:active, #priority4:hover, #priority4:focus, #priority4.selected-state {
        background: #294b83;
    }

</style>