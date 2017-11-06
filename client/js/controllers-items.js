angular.module('noodlio.controllers-items', [])


.controller('BeneficiosShopping', function($location, $anchorScroll, $stateParams, $state, $scope, CentrosComerciales, Auth, $window) {

    $scope.$on('$viewContentLoaded', function() {
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
        $scope.shopping = $stateParams.shopping;
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

    // Funcion para Cargar el listado de Beneficios
    function CargarBeneficios(){
        $scope.cargando = true;
        CentrosComerciales.getBeneficios($scope.shopping).then(
            function(success){
                if(CentrosComerciales.beneficios != null) {
                    $scope.beneficios = CentrosComerciales.beneficios;
                    console.log($scope.beneficios);
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

    // SUBMIT BENEFICIOS

    //Primero Redireccionamos si es nuevo o debemos editar
    $scope.Redireccionar = function(){
        console.log("Vamos a Redireccionar");
        $scope.comercio = $stateParams.shopping;
        $scope.beneficio = $stateParams.beneficio;

        // init variables 
        $scope.status = {
            editMode: false,
            submitLoading: false,
            generalView: 'loading',
        };

        if(Auth.AuthData.hasOwnProperty('uid')){
            if($scope.beneficio != undefined && $scope.beneficio != null && $scope.beneficio != "") {
                CentrosComerciales.getBeneficio($scope.comercio, $scope.beneficio).then(
                    function(ProductMeta){
                        if(ProductMeta != null) {
                            $scope.BeneficioMeta = ProductMeta;
                            EditarBeneficio();  
                        } else {
                            currentProductId = null;
                            NuevoBeneficio();    // Error tecnico, entonces le damos la opcion de crear un nuevo Objeto
                        };
                    },
                    function(error){
                        console.log('e1', error);
                        initError();
                    }
                )
            }else{
                NuevoBeneficio();
            };
        }else{
            console.log('e2');
            initError();
        };
    }

    function NuevoBeneficio() {
        $scope.status["generalView"]    = "new";
        $scope.status["editMode"]       = false;
        $scope.beneficio                = null;
        $scope.status["submitLoading"]  = false;

    };

    function EditarBeneficio() {
        $scope.status["generalView"]    = "edit";
        $scope.status["editMode"]       = true;
        $scope.status["submitLoading"]  = false;

    };

    $scope.EliminarBeneficio = function(key) {
        console.log($scope.shopping);
        swal({
          title: "Desea eliminar el Beneficio?",
          text: "Ya no se va a poder recuperar.",
          icon: "warning", 
          buttons: ["Cancelar", "Eliminar"],
          dangerMode: true,
        })
        .then((willDelete) => {
          if (willDelete) {
            console.log(key);
            CentrosComerciales.eliminarBeneficio($scope.shopping, key).then(function(success){
                console.log(success);
                $window.location.reload();
                swal("Eliminado con exito", {
                  icon: "success", 
                });
            }, function(error){
                console.log(error);
                $window.location.reload();
                swal("No se ha eliminado", {
                  icon: "danger", 
                });
            });
          }
        });
    };


    function initError() {
        $scope.status["generalView"] = "error";     //console.log("error")
        $state.go('admin.home');
    };

    /**
     * Validamos el formulario y enviamos la promocion, ya sea uno nuevo o editamos uno ya existente
     */
    $scope.guardar = function() {
        console.log("Guardar");
        scrollToSubmitEnd(); 
            switch ($scope.status['editMode']) {
                case true:
                    $scope.status['submitLoading']  = true;
                    CentrosComerciales.editBeneficio($scope.BeneficioMeta, Auth.AuthData, $scope.comercio, $scope.beneficio).then(
                        function(success){
                            handleSuccess();
                        },
                        function(error){
                            handleError(error);
                        }
                    );
                    break
                case false:
                    $scope.status['submitLoading']  = true;
                    CentrosComerciales.submitBeneficio($scope.BeneficioMeta, Auth.AuthData, $scope.comercio).then(
                        function(success){
                            handleSuccess();
                        },
                        function(error){
                            handleError(error);
                        }
                    );
                    break
            } // ./ switch
            
        
        // fn error
        function handleError(error) {
            $scope.status['submitLoading']      = false;
            $scope.status['containsNoError']    = false;
            $scope.ErrorMessages['general']     = "Ooops hubo un problema ... " + error;
        };
        
        // fn success
        function handleSuccess() {
            $scope.status['submitLoading']      = false;
            $scope.status['containsNoError']    = false;
            $state.go('admin.categories-centros_comerciales');
        };
        
    }; 

    function scrollToSubmitEnd() {
        $location.hash('submit0');
        $anchorScroll.yOffset = 100;
        $anchorScroll();
    };
        
})
.controller('BeneficiosShoppingLocales', function($location, $anchorScroll, $stateParams, $state, $scope, Auth, Locales, $window) {
        
    $scope.$on('$viewContentLoaded', function() {
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
        $scope.shopping = $stateParams.shopping;
        $scope.local = $stateParams.local;
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

    // Funcion para Cargar el listado de Beneficios
    function CargarBeneficios(){
        $scope.cargando = true;
        Locales.getBeneficios($scope.shopping, $scope.local).then(
            function(success){
                if(Locales.beneficios != null) {
                    $scope.beneficios = Locales.beneficios;
                    console.log($scope.beneficios);
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

    // SUBMIT BENEFICIOS

    //Primero Redireccionamos si es nuevo o debemos editar
    $scope.Redireccionar = function(){
        console.log("Vamos a Redireccionar");
        $scope.comercio = $stateParams.shopping;
        $scope.local = $stateParams.local;
        $scope.beneficio = $stateParams.beneficio;

        // init variables 
        $scope.status = {
            editMode: false,
            submitLoading: false,
            generalView: 'loading',
        };

        if(Auth.AuthData.hasOwnProperty('uid')){
            if($scope.beneficio != undefined && $scope.beneficio != null && $scope.beneficio != "") {
                Locales.getBeneficio($scope.comercio, $scope.local, $scope.beneficio).then(
                    function(ProductMeta){
                        if(ProductMeta != null) {
                            $scope.BeneficioMeta = ProductMeta;
                            EditarBeneficio();  
                        } else {
                            currentProductId = null;
                            NuevoBeneficio();    // Error tecnico, entonces le damos la opcion de crear un nuevo Objeto
                        };
                    },
                    function(error){
                        console.log('e1', error);
                        initError();
                    }
                )
            }else{
                NuevoBeneficio();
            };
        }else{
            console.log('e2');
            initError();
        };
    }

    function NuevoBeneficio() {
        $scope.status["generalView"]    = "new";
        $scope.status["editMode"]       = false;
        $scope.beneficio                = null;
        $scope.status["submitLoading"]  = false;

    };

    function EditarBeneficio() {
        $scope.status["generalView"]    = "edit";
        $scope.status["editMode"]       = true;
        $scope.status["submitLoading"]  = false;

    };

    $scope.EliminarBeneficio = function(key) {
        swal({
          title: "Desea eliminar el Beneficio?",
          text: "Ya no se va a poder recuperar.",
          icon: "warning", 
          buttons: ["Cancelar", "Eliminar"],
          dangerMode: true,
        })
        .then((willDelete) => {
          if (willDelete) {
            console.log(key);
            Locales.eliminarBeneficio($scope.shopping, $scope.local, key).then(function(success){
                console.log(success);
                $window.location.reload();
                swal("Eliminado con exito", {
                  icon: "success", 
                });
            }, function(error){
                console.log(error);
                $window.location.reload();
                swal("No se ha eliminado", {
                  icon: "danger", 
                });
            });
          }
        });
    };

    function initError() {
        $scope.status["generalView"] = "error";     //console.log("error")
        $state.go('admin.home');
    };

    /**
     * Validamos el formulario y enviamos la promocion, ya sea uno nuevo o editamos uno ya existente
     */
    $scope.guardar = function() {
        console.log("Guardar");
        scrollToSubmitEnd(); 
            switch ($scope.status['editMode']) {
                case true:
                    $scope.status['submitLoading']  = true;
                    Locales.editBeneficio($scope.BeneficioMeta, Auth.AuthData, $scope.comercio, $scope.local, $scope.beneficio).then(
                        function(success){
                            handleSuccess();
                        },
                        function(error){
                            handleError(error);
                        }
                    );
                    break
                case false:
                    $scope.status['submitLoading']  = true;
                    Locales.submitBeneficio($scope.BeneficioMeta, Auth.AuthData, $scope.comercio, $scope.local).then(
                        function(success){
                            handleSuccess();
                        },
                        function(error){
                            handleError(error);
                        }
                    );
                    break
            } // ./ switch
            
        
        // fn error
        function handleError(error) {
            $scope.status['submitLoading']      = false;
            $scope.status['containsNoError']    = false;
            $scope.ErrorMessages['general']     = "Ooops hubo un problema ... " + error;
        };
        
        // fn success
        function handleSuccess() {
            $scope.status['submitLoading']      = false;
            $scope.status['containsNoError']    = false;
            $state.go('admin.categories-centros_comerciales');
        };
        
    }; 

    function scrollToSubmitEnd() {
        $location.hash('submit0');
        $anchorScroll.yOffset = 100;
        $anchorScroll();
    };
})




