var Web3 = require('web3');
var Sig = require('eth-sig-util');

module.exports = {
    auth: function (onSuccess, onError) {
        $.ajax({
            method: 'GET',
            url: '/v1/auth',
            dataType: 'json',
            success: function (data, textStatus, jqXHR) {

                return onSuccess(data);

            },
            error: function (jqXHR, textStatus, errorThrown) {

                console.log(errorThrown);
                return onError(errorThrown);


            }
        });
    },
    signSplash: function (onSuccess, onError) {

        var msgParams = [
            {
                type: 'string',
                name: 'Message',
                value: 'Pareto Network' //replace with TOS
            }
        ];

        if (typeof web3 !== 'undefined') {
            // Use Mist/MetaMask's provider
            web3 = new Web3(web3.currentProvider);
        } else {
            console.log('No web3? You should consider trying MetaMask!');
            onError('Please install MetaMask in order to access the Pareto Network');


            searchLookup();
            // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
            web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/QWMgExFuGzhpu2jUr6Pq'));
        }

        if (typeof web3 !== 'undefined') {

            var contractAddr = ('0xea5f88E54d982Cbb0c441cde4E79bC305e5b43Bc');
            var rankCalculation = 0;
            var tokenTotal = 0;
            if (!web3.currentProvider.isMetaMask) {

                return onError('Please install MetaMask in order to access the Pareto Network');
            }
            web3.eth.getAccounts(function (error, accounts) {
                if (!error) {

                    var addr = accounts[0];

                    var contractData = '';

                    if (web3.utils.isAddress(addr)) {
                        var from = addr.toLowerCase();

                        //console.log('CLICKED, SENDING PERSONAL SIGN REQ');
                        var params = [msgParams, from];
                        //console.dir(params);
                        var method = 'eth_signTypedData';

                        //Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send;
                        web3.currentProvider.sendAsync({method, params, from}, function (err, result) {
                            if (err) return console.dir(err);
                            if (result.error) {
                                return onError('Please login into MetaMask in order to access the Pareto Network');
                                console.log(result.error.message);
                            }
                            if (result.error) {
                                return console.error(result);
                            }
                            //console.log('PERSONAL SIGNED:' + JSON.stringify(result.result))

                            const recovered = Sig.recoverTypedSignature({data: msgParams, sig: result.result});

                            if (recovered === from) {

                                var jsonData = {
                                    data: msgParams,
                                    owner: from,
                                    result: result.result
                                };
                                $.ajax({
                                    method: 'POST',
                                    url: '/v1/sign',
                                    data: jsonData,
                                    dataType: 'json',
                                    success: function (data, textStatus, jqXHR) {

                                        //wait for 200 OK result from server and then run calculate method

                                        //server response has cookie parameter set and is stored in browser.
                                        return onSuccess(data);
                                    },
                                    error: function (jqXHR, textStatus, errorThrown) {
                                        console.log(errorThrown);
                                    }
                                });

                            } else {
                                console.log('Failed to verify signer when comparing ' + result + ' to ' + from);
                                stopLoading();
                            }

                        });

                    }//end if valid address
                    else {
                        console.log('address invalid!');
                        return onError('Please login into MetaMask in order to access the Pareto Network');

                        //set error state on input field
                    }
                }//end if !error
            });
        }//end if
    },
    logout: function (onSuccess, onError) {
        //var accessValue = $("#access-toggle").value;
        //if(accessValue === "Disconnect"){

        //clear cookie and clear dashboard view and go back to access view

        $.ajax({
            method: 'POST',
            url: '/v1/unsign',
            body: {},
            dataType: 'json',
            success: function (data, textStatus, jqXHR) {

                //if here then user authenticated, could also return address/user information.
                console.log('done');
                return onSuccess();


            },
            error: function (jqXHR, textStatus, errorThrown) {

                onError(errorThrown);
            }
        });
        /*} else {
            $("#access-toggle").value = "Disconnect";
            //sign
            //let event = new Event("sign");
            //window.dispatchEvent(event);

        }*/

    },
    intel: function (data, onSuccess, onError) {


        $.ajax({
            method: 'POST',
            url: '/v1/intel?compact=true',
            data: data,
            dataType: 'json',
            success: function (data, textStatus, jqXHR) {

                //show success
                console.log('success');
                return onSuccess();


            },
            error: function (jqXHR, textStatus, errorThrown) {

                console.log('error');
                return onError(errorThrown);
            }
        });

    },
    scores: function (onSuccess, onError) {
        $.ajax({
            method: 'GET',
            url: '/v1/address',
            dataType: 'json',
            success: function (data, textStatus, jqXHR) {
                return onSuccess(data);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log(errorThrown);
                return onError(errorThrown);
            }
        }); //end ajax
    }, leaderboard: function (e) {
        var rank = e.detail.rank;
        var limit = e.detail.limit;
        var page = e.detail.page;

        if ($.fn.dataTable.isDataTable('#pareto-leaderboard')) {
            table.destroy();
        }

        var table = $('#pareto-leaderboard').DataTable({
            searching: false,
            paging: false,
            ordering: false,
            info: false,
            scrollY: '70vh',
            scrollCollapse: false,
            ajax: {
                url: '/v1/rank?rank=' + rank + '&limit=' + limit + '&page=' + page,
                dataSrc: ''
            },
            columns: [
                {data: 'rank'},
                {
                    data: 'score',
                    render: $.fn.dataTable.render.number(',', '.', 2)
                },
                {data: 'address'}
            ]
        });
    }, myPosts: function () {
        if ($.fn.dataTable.isDataTable('#my-posts')) {
            table.destroy();
        }

        var table = $('#my-posts').DataTable({
            responsive: true,
            searching: false,
            paging: false,
            ordering: false,
            info: false,
            ajax: {
                url: '/v1/intel/me?compact=true',
                dataSrc: ''
            },
            columnDefs: [
                {
                    targets: 0,
                    data: 'body',
                    render: function (data, type, row) {
                        var alias = '';
                        if (row.alias !== undefined) {
                            alias = '(' + row.alias + ')';
                        }

                        return '<b>' + row.title + '</b><br/>' + '<div style="font-size: 12px;">Disclosed by: ' + row.address + alias + ' at block ' + row.block + '</div><br/>' + row.body;
                    } //end function
                }
            ],
            language: {
                emptyTable: 'No data to display'
            }
        });
    }, content: function () {
        if ($.fn.dataTable.isDataTable('#pareto-content')) {
            table.destroy();
        }

        var table = $('#pareto-content').DataTable({
            responsive: true,
            searching: false,
            paging: false,
            ordering: false,
            info: false,
            ajax: {
                url: '/v1/intel?compact=true'/*+'?rank='+rank+'&limit='+limit+'&page='+page*/,
                dataSrc: ''
            },
            columnDefs: [
                {
                    targets: 0,
                    data: 'body',
                    render: function (data, type, row) {
                        var alias = '';
                        if (row.alias !== undefined) {
                            alias = '(' + row.alias + ')';
                        }

                        return '<b>' + row.title + '</b><br/>' + '<div style="font-size: 12px;">Disclosed by: ' + row.address + alias + ' at block ' + row.block + '</div><br/>' + row.body;
                    } //end function
                }
            ],
            language: {
                emptyTable: 'A higher score is needed to view currently disclosed intel, check back momentarily'
            }/*,
                columns: [
                    {
                        data : 'body'
                    }
                ]*/
        });
    }
};
