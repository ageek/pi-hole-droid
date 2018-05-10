/*
 * Refresh the DOM for MDL dynamic content
 */

function mdl_upgradeDom() {
    componentHandler.upgradeDom();
}

/*
 * Toggle open/close of Drawer
 */

function mdl_toggleDrawer() {
    var layout = document.querySelector('.mdl-layout');
    layout.MaterialLayout.toggleDrawer();
}

/*
 * Handler localStorage
 */

function _localStorage(action, key, value) {
    var storage = window.localStorage;

    if (action == 'get') {
        return storage.getItem(key);
    } else if (action == 'save') {
        if (storage.setItem(key, value)) {
            return true;
        }
    } else if (action == 'remove') {
        if (storage.removeItem(key)) {
            return true;
        }
    }

    return false;
}

/*
 * Action to perform when the user is logged in
 */

function userIsLoggedIn() {
    _localStorage('save', 'pihole_success', 1);
    $('#header_guest').hide();
    $('#header_loggedin').show();

    $('#logout').click(function (event) {
        event.preventDefault();
        _localStorage('remove', 'pihole_success');
        _localStorage('remove', 'pihole_host');
        _localStorage('remove', 'pihole_token');
        userIsGuest();
        pageAppSettings();
    });
}

/*
 * Action to perform when the user is not logged in (guest)
 */

function userIsGuest() {
    $('#header_guest').show();
    $('#header_loggedin').hide();
    mdl_toggleDrawer();
}

/*
 * Get Pihole Hostname
 */

function getPiholeHost() {
    return _localStorage('get', 'pihole_host');
}

/*
 * Get Pihole Token
 */

function getPiholeToken() {
    return _localStorage('get', 'pihole_token');
}

/*
 * Get Pihole Success connect flag
 */

function getPiholeSuccess() {
    return _localStorage('get', 'pihole_success');
}

/*
 * Update MDL float label when there is a value on the input
 */

function updateFloatLabel() {
    var nodeList = document.querySelectorAll('.mdl-textfield');

    Array.prototype.forEach.call(nodeList, function (elem) {
        elem.MaterialTextfield.checkDirty();
    });
}

/*
 * Update the App title according to active page
 */

function updateAppTitle(title) {
    $('.mdl-layout-title').html(title);
}

/*
 * Manage visibility of toggle button
 */

function _manageVisibilityToggle(action) {
    if(action == 'show') {
        $('#container-pihole-toggle').show();
    } else if(action == 'hide') {
        $('#container-pihole-toggle').hide();
    }
}