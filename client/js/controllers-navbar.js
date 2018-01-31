angular.module('noodlio.controllers-navbar', [])

.controller('NavBarCtrl', function(
    $rootScope, $state, $location, $anchorScroll, 
    Auth, Utils, $scope) {
    
    var navbar = this;
    navbar.randomImageUrl   = "img/cool.png";
    navbar.randomButton     = "btn-random-e";
    navbar.AuthData         = Auth.AuthData;
    navbar.statusObj        = {};
    
    $rootScope.$on('rootScope:authChange', function (event, data) {
        navbar.AuthData = Auth.AuthData;
        if(navbar.AuthData.hasOwnProperty('uid')) {
            navbar.statusObj['loggedIn']    = true;
        }
    });

    // Chequeamos siempre si el usuario esta autenticado, caso contrario redireccionamos al login
    $scope.$on('$ionicView.enter', function(e) {
        // global variables
        $scope.AuthData = Auth.AuthData;
        console.log("Controlamos Sesion");
        checkAuth();
    });
    
    function checkAuth() { // can be put in a resolve in app.js
        if(!$scope.AuthData.hasOwnProperty('uid')) {
            Auth.checkAuthState().then(
                function(loggedIn){
                    console.log("Logeado");
                    navbar.statusObj['loading']     = false;
                    navbar.statusObj['loggedIn']    = true;
                    $scope.AuthData = Auth.AuthData;
                },
                function(notLoggedIn) {
                    console.log("No esta Logeado");
                    navbar.statusObj['loading']     = false;
                    navbar.statusObj['loggedIn']    = false;
                    $state.go('admin.login')
                }
            )
        };
    };
    
    
    navbar.statusObj['loading'] = true;
    if(!Auth.AuthData.hasOwnProperty('uid')) {
        Auth.checkAuthState().then(
            function(loggedIn){
                navbar.statusObj['loading']     = false;
                navbar.statusObj['loggedIn']    = true;
                navbar.AuthData = Auth.AuthData;
            },
            function(notLoggedIn) {
                navbar.statusObj['loading']     = false;
                navbar.statusObj['loggedIn']    = false;
                $state.go('admin.login')
            }
        )
    };
    
    
    navbar.unAuth = function() {
        Auth.unAuth();
        navbar.statusObj['loggedIn']    = false;
        $rootScope.$broadcast('rootScope:authChange', {});
        $state.go('admin.login');
    };
    
    navbar.goTo = function(nextState, dataObj) {
        $state.go(nextState, dataObj)
    };
    
})