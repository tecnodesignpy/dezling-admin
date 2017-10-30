angular.module('noodlio.controllers-items', [])


.controller('BeneficiosShopping', function($location, $anchorScroll, $stateParams, $state, $scope, CentrosComerciales, Auth) {

    $scope.$on('$viewContentLoaded', function() {
        // global variables
        $scope.AuthData = Auth.AuthData;
        //Chequeamos que le haya pasado el parametro shopping como minimo
        var shopping = $stateParams.shopping;
        if(shopping ==''){
            alert("No hay ningun Shopping seleccionado")
            $state.go('admin.categories-centros_comerciales')
        }else{

            $scope.shopping = $stateParams.shopping;
        }
        checkAuth();


    });

    //Iniciamos la funcion desde el template para cargar los Sponsors
    $scope.initView = function() {

        $location.hash('page-top');
        $anchorScroll();
        //Cargamos listado de Sponsor
        CargarBeneficios();
    };
    
    function checkAuth() { // can be put in a resolve in app.js
        if(!$scope.AuthData.hasOwnProperty('uid')) {
            Auth.checkAuthState().then(
                function(loggedIn){
                    $scope.AuthData = Auth.AuthData;
                },
                function(notLoggedIn) {
                    $state.go('admin.login')
                }
            )
        };
        
    };

    // Funcion para Cargar el listado de Sponsors
    function CargarBeneficios(){
        $scope.cargando = true;
        CentrosComerciales.getBeneficios().then(
            function(success){
                if(CentrosComerciales.beneficios != null) {
                    $scope.beneficios = CentrosComerciales.beneficios;
                    $scope.cargando = false;
                }
            },
            function(error){
                console.log(error);
                $scope.cargando = true;
                $scope.mensaje =  "Hubo un error..."
            }
        );
    };
        
})
.controller('BeneficiosShoppingLocales', function($location, $anchorScroll, $stateParams, $state) {
        
})




