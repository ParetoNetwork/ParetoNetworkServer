<template>
    <ul id='vdelay' class="mt-sm-2 mt-md-0">
        <li class="row text-left p-0 m-0 mr-1 mr-md-3" :key="row" v-for="row of priorities">
            <div v-if="intelDelay.blockDelay" class="col-0 pr-1 mr-1 d-flex" :id="('priority'+row)" @click="setSelection(row)">
                <div class="mr-1" :style="getBorderColor(row)"> </div>
                <p style="font-size: 0.90em;"> {{getTime(row)}} </p>
            </div>
            <div v-else class="col col-0 col-xs-0" :id="('priority'+row)" :style="getBorderColor(row)" @click="setSelection(row)">
                <div class="mr-1" :style="getColor(row)"> </div>
                <p v-responsive.sm.xs style="font-size: 1em; border: 1px;"> {{row}} </p>
                <!-- wish to show text here when larger screen -->
                <p v-responsive="['hidden-xs', 'hidden-sm']" style="font-size: 0.80em; border: 1px;"> {{getPriority(row)}} </p>
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
            'intelDelay',"select"
        ]
        , beforeMount: function () {

        }, mounted: function() {
            if(this.select!=1) $('ul#vdelay > li:nth-child(2) > div').addClass('selected-state');
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
                if(this.select==1){ //exclusive to the intel feed, to sort by priority and unselect the sorting
                    $(e).attr('background', 'none');
                    /*
                    $(e).removeClass('selected-state');

                    $(e).attr('user-select', 'none');
                    $(e).attr('cursor', 'default');
                    $('ul#vdelay li').setClass('nullified');
                    this.$emit('chosenPriority', 0); //resets the feed
                     */
                    $(e).removeClass('selected-state');
                    $('ul#vdelay').addClass('active').siblings().remove('active');
                    $('ul#vdelay').addClass('active').siblings().remove('focus');
                }
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

    #priority4:active, #priority4:hover, #priority4:focus, #priority4.selected-state {
        background: #294b83;
    }

    .nullified{
        background: none;
        -moz-user-select: -moz-none;
        -khtml-user-select: none;
        -webkit-user-select: none;
        -ms-user-select: none;
        user-select: none;
        cursor: default;
    }

</style>