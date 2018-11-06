/*
 * Check if is a cordova app or browser
 */

var isCordovaApp = (typeof window.cordova !== "undefined");

if (isCordovaApp) {
    document.addEventListener("deviceready", init, false);
} else {
    init();
}

/*
 * Init app
 */

function init() {

    // Bind menu voices
    $('.pihole-navigation a').click(function (event) {
        event.preventDefault();
        mdl_toggleDrawer();

        if ($(this).attr('href') == 'dashboard') {
            if (getPiholeSuccess()) {
                pageDashboard();
                _updateToggleButton();
            } else {
                pageAppSettings();
            }
        } else if ($(this).attr('href') == 'app_settings') {
            pageAppSettings();
        } else if ($(this).attr('href') == 'query_log') {
            if (getPiholeSuccess()) {
                pageQueryLog();
                _updateToggleButton();
            } else {
                pageAppSettings();
            }
        } else if ($(this).attr('href') == 'about_help') {
            pageAboutHelp();
            _updateToggleButton();
        }
    });

    // Update current status of toggle button
    _updateToggleButton();

    // Bind logo click enable/disable
    $('#label-pihole-toggle input').change(function (evt) {
        if ($(this).is(':checked')) {
            if (confirm("Do you want to ENABLE Pi-hole's ad blocking?")) {
                $.getJSON(getPiholeHost() + "/admin/api.php?enable&auth=" + getPiholeToken(), function (response_data) {

                });
            } else {
                $('#label-pihole-toggle')[0].MaterialSwitch.off();
                evt.preventDefault();
            }
        } else {
            if (confirm("Do you want to DISABLE Pi-hole's ad blocking?")) {
                $.getJSON(getPiholeHost() + "/admin/api.php?disable&auth=" + getPiholeToken(), function (response_data) {

                });
            } else {
                $('#label-pihole-toggle')[0].MaterialSwitch.on();
                evt.preventDefault();
            }
        }
    });

    // Bind swipe drawer actions
    var hammertime_content = new Hammer(document.getElementById('main_content'));
    hammertime_content.on('swiperight', function () {
        mdl_toggleDrawer();
    });

    var hammertime_drawer = new Hammer(document.getElementById('drawer'));
    hammertime_drawer.on('swipeleft', function () {
        mdl_toggleDrawer();
    });

    // Start
    if (getPiholeHost() && getPiholeToken()) {
        _manageVisibilityToggle('show');
        userIsLoggedIn();
        pageDashboard();
    } else {
        pageAppSettings();
    }

}

/*************************************************************
 * Settings page
 *************************************************************/

function pageAppSettings() {
    $.get("partial/app-settings.html", function (data) {
        updateAppTitle('<strong>Pi</strong>-hole app settings');
        $("#main_content").html(data);
        mdl_upgradeDom();

        // bind go_to_help click
        $('#go_to_help').click(function () {
            pageAboutHelp();
        });

        if (getPiholeHost()) {
            $('#pihole_host').val(getPiholeHost());
        }

        if (getPiholeToken()) {
            $('#pihole_token').val(getPiholeToken());
        }

        updateFloatLabel();

        document.addEventListener("deviceready", function () {
            function scanQRCode() {
                cordova.plugins.barcodeScanner.scan(
                        function (result) {
                            if (result.text) {
                                $('#pihole_token').val(result.text);
                                updateFloatLabel();
                            }
                        },
                        function (error) {
                            alert("Scanning failed: " + error);
                        },
                        {
                            preferFrontCamera: false,
                            showFlipCameraButton: true,
                            showTorchButton: true,
                            torchOn: false,
                            prompt: "Place Pi-hole QR Code inside the scan area",
                            resultDisplayDuration: 0,
                            formats: "QR_CODE,PDF_417",
                            orientation: "portrait"
                        }
                );
            }

            $('#qrcode_scan').click(scanQRCode);
        });

        $('#form_settings').submit(function (event) {
            event.preventDefault();

            $("#form_settings > button[type='submit']").html('PLEASE WAIT <i class="material-icons loading">refresh</i>').prop("disabled", true);
            $("#form_settings > button[type='submit'] > .loading").show();

            var pihole_host = $('#pihole_host').val();
            var pihole_token = $('#pihole_token').val();

            // check if pihole_host contains http or https, otherwise add http as default
            // TODO: complete the check
            if (pihole_host.indexOf("http://") == 0 || pihole_host.indexOf("https://") == 0) {

            }

            _localStorage('save', 'pihole_host', pihole_host);
            _localStorage('save', 'pihole_token', pihole_token);
            _localStorage('remove', 'pihole_success');

            $.ajax({
                type: "GET",
                url: pihole_host + "/admin/api.php?getQuerySources&auth=" + pihole_token,
                success: function (data) {
                    $.getJSON(pihole_host + "/admin/api.php?getQuerySources&auth=" + pihole_token, function (response) {
                        if (jQuery.isEmptyObject(response)) {
                            showErrorSettings();
                        } else {
                            _localStorage('save', 'pihole_success', 1);
                            userIsLoggedIn();
                            _updateToggleButton();
                            pageDashboard();
                        }
                    });
                },
                error: function () {
                    showErrorSettings();
                }
            });

        });

    });
}

/*
 * Show error dialog when settings are wrong
 */

function showErrorSettings() {
    var dialog = document.querySelector('dialog');
    if (!dialog.showModal) {
        dialogPolyfill.registerDialog(dialog);
    }
    dialog.showModal();
    dialog.querySelector('.close').addEventListener('click', function () {
        dialog.close();
        $("#form_settings > button[type='submit']").html('SAVE').prop("disabled", false);
    });
}
/*************************************************************/


/*************************************************************
 * Dashboard page
 *************************************************************/

function pageDashboard() {
    $.get("partial/dashboard.html", function (dataHtml) {
        updateAppTitle('<strong>Pi</strong>-hole dashboard');
        $("#main_content").html(dataHtml);
        mdl_upgradeDom();

        /* summary */
        var pihole_host = getPiholeHost();
        var pihole_token = getPiholeToken();

        $.getJSON(pihole_host + "/admin/api.php?summary&auth=" + pihole_token, function (response_data) {
            $('#ads_blocked_today > .mdl-card__title > h2').html(response_data.ads_blocked_today);
            $('#dns_queries_today > .mdl-card__title > h2').html(response_data.dns_queries_today);
            $('#ads_percentage_today > .mdl-card__title > h2').html(response_data.ads_percentage_today + '%');
            $('#domains_being_blocked > .mdl-card__title > h2').html(response_data.domains_being_blocked);
        });

        /* query types */
        $.getJSON(pihole_host + "/admin/api.php?getQueryTypes&auth=" + pihole_token, function (response_data) {

            var data = {
                labels: ['A (IPv4)', 'AAAA (IPv6)'],
                series: [{
                        value: response_data.querytypes['A (IPv4)'],
                        className: "ct-fill-red"
                    }, {
                        value: response_data.querytypes['AAAA (IPv6)'],
                        className: "ct-fill-blue"
                    }]
            };

            var options = {
                height: 300,
                chartPadding: 50,
                labelOffset: 85
            };

            $('.ct-chart-query-types .loading').fadeOut('normal', function () {
                new Chartist.Pie('.ct-chart-query-types', data, options);
            });
        });


        /* forward destinations */
        $.getJSON(pihole_host + "/admin/api.php?getForwardDestinations&auth=" + pihole_token, function (response_data) {
            var labels_array = [];
            var series_array = [];
            var colors_array = ["ct-fill-red", "ct-fill-blue", "ct-fill-light-blue", "ct-fill-orange", "ct-fill-green"];

            $.each(response_data.forward_destinations, function (key, val) {

                // split key for labels
                var label_array = key.split('|');
                if (label_array[1]) {
                    labels_array.push(label_array[1]);
                } else {
                    labels_array.push(label_array[0]);
                }

                serie_value = {value: val, className: colors_array[Math.floor(Math.random() * colors_array.length)]};
                series_array.push(serie_value);
            });

            var data = {
                labels: labels_array,
                series: series_array
            };

            var options = {
                height: 300,
                chartPadding: 50,
                labelOffset: 80
            };

            $('.ct-chart-forward-destinations .loading').fadeOut('normal', function () {
                new Chartist.Pie('.ct-chart-forward-destinations', data, options);
            });
        });


        /* top domains + top advertisers */
        $.getJSON(pihole_host + "/admin/api.php?topItems&auth=" + pihole_token, function (response_data) {
            $.each(response_data, function (key, val) {
                if (key == 'top_queries') {
                    if (jQuery.isEmptyObject(val) == false) {

                        // remove loading row and replace it with results
                        $('#tbody-table-top-queries > tr:first-child').fadeOut(400, function () {
                            $.each(val, function (domain, domain_hits) {
                                $('#tbody-table-top-queries:last-child').append('<tr><td class="mdl-data-table__cell--non-numeric">' + domain + '</td><td>' + domain_hits + '</td></tr>');
                            });
                        });

                    } else {
                        // privacy mode enabled, hide the table
                        $('#tbody-table-top-queries').parents('div.pihole-card').hide();
                    }
                } else if (key == 'top_ads') {

                    // remove loading row and replace it with results
                    $('#tbody-table-top-ads > tr:first-child').fadeOut(400, function () {
                        $.each(val, function (domain, domain_hits) {
                            $('#tbody-table-top-ads:last-child').append('<tr><td class="mdl-data-table__cell--non-numeric">' + domain + '</td><td>' + domain_hits + '</td></tr>');
                        });
                    });

                }
            });
        });


        /* top clients */
        $.getJSON(pihole_host + "/admin/api.php?getQuerySources&auth=" + pihole_token, function (response_data) {
            $.each(response_data, function (key, val) {
                if (key == 'top_sources') {

                    // remove loading row and replace it with results
                    $('#tbody-table-top-clients > tr:first-child').fadeOut(400, function () {
                        $.each(val, function (client, client_hits) {
                            $('#tbody-table-top-clients:last-child').append('<tr><td class="mdl-data-table__cell--non-numeric">' + client + '</td><td class="mdl-data-table__cell--non-numeric">' + client_hits + '</td></tr>');
                        });
                    });
                }
            });
        });


        /* recent items */
        // TODO: forced PHP api version, can't find an alternative on FTL's API
        $.getJSON(pihole_host + "/admin/api.php?recentItems=10&PHP&auth=" + pihole_token, function (response_data) {
            $.each(response_data, function (key, val) {
                if (key == 'recent_queries') {

                    // remove loading row and replace it with results
                    $('#tbody-table-recent-items > tr:first-child').fadeOut(400, function () {
                        $.each(val, function (key_query, val_query) {
                            $('#tbody-table-recent-items:last-child').append('<tr><td class="mdl-data-table__cell--non-numeric">' + val_query.time + '</td><td>' + val_query.domain + '</td><td>' + val_query.ip + '</td></tr>');
                        });
                    });

                }
            });
        });
    });
}

/*************************************************************/


/*************************************************************
 * Query log page
 *************************************************************/

function pageQueryLog() {
    $.get("partial/query-log.html", function (dataHtml) {
        updateAppTitle('<strong>Pi</strong>-hole query log');
        $("#main_content").html(dataHtml);
        mdl_upgradeDom();

        var pihole_host = getPiholeHost();
        var pihole_token = getPiholeToken();

        // TODO: add loading to tbody
        var dataSet = [];
        $.getJSON(pihole_host + "/admin/api.php?getAllQueries&auth=" + pihole_token, function (data) {
            $.each(data, function (key, val) {
                $.each(val, function (query) {

                    // replace unnecessary long strings
                    var client = val[query][3];
                    var client_short = client.replace('(127.0.0.1)', '');

                    var datetime = val[query][0];
                    var datetime_short = datetime.replace('T', '<br />');

                    dataSet.push([datetime_short, val[query][1], val[query][2], client_short, val[query][4]]);
                });
            });

            $('.mdl-chip.mdl-please-wait').hide();

            $('#query-log-table').DataTable({
                data: dataSet,
                order: [[0, "desc"]],
                columns: [
                    {title: "Time", class: "mdl-data-table__cell--non-numeric fullwidth"},
                    {title: "Type"},
                    {title: "Domain"},
                    {title: "Client"},
                    {title: "Status"}
                ]
            });
        });
    });
}

/*************************************************************/


/*************************************************************
 * About&Help page
 *************************************************************/

function pageAboutHelp() {
    $.get("partial/about-help.html", function (data) {
        updateAppTitle('<strong>Pi</strong>-hole about & help');
        $("#main_content").html(data);
        mdl_upgradeDom();
    });
}

/*************************************************************/


/*************************************************************
 * Helpers
 *************************************************************/

// Get Pi-hole current status
function _updateToggleButton() {
    var pihole_host = getPiholeHost();
    var pihole_token = getPiholeToken();

    if (pihole_host && pihole_token) {
        $.getJSON(pihole_host + "/admin/api.php?status&auth=" + pihole_token, function (response_data) {
            var current_status = response_data.status;

            if (current_status) {
                _manageVisibilityToggle('show');

                if (current_status == 'disabled') {
                    $('#label-pihole-toggle')[0].MaterialSwitch.off();
                } else if (current_status == 'enabled') {
                    $('#label-pihole-toggle')[0].MaterialSwitch.on();
                }
            }
        });
    }
}

/*************************************************************/