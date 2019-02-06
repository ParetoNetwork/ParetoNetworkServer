export const countUpMixin = {
    data() {
        return {
            countUp: {
                startVal: 0,
                decimals: 0,
                duration: this.randomNumber(5, 10),
                options: {
                    useEasing: true,
                    useGrouping: true,
                    separator: ',',
                    decimal: '.',
                    prefix: '',
                    suffix: ''
                }
            }
        }
    },
    methods: {
        randomNumber: function (min = 1, max = 3){
            return Math.floor((Math.random() * (max-min + 1 )) + min)
        },
        decimalsLength: function (score) {
            if (!score) return 0;

            const decimals = score.length - 4;
            if (score<1)
                return decimals;
            else if (score > 1 && score < 100 && (score % 1 != 0))
                return 2;
            else
                return 0;
        },
        onReady: function(instance, CountUp) {
            const that = this;
            instance.update(that.endVal + 100);
        }
    }
};