angular.module('noodlio.controllers-categories', [])


.controller('CateCentrosComercialesCtrl', function($state, $anchorScroll, $location, Auth,
    CentrosComerciales, Utils, $stateParams, $scope, CentrosService) {
    
    var categories              = this;
    categories.AuthData         = Auth.AuthData;
    categories.CategoriesForm   = CentrosComerciales.all;
    
    categories.statusObj = {
        loading: true,
        newCategory: ""
    };

    $scope.promocion =  $stateParams.shopping;
    console.log($scope.promocion);
    
    categories.initView = function() {
        $location.hash('page-top');
        $anchorScroll();
        
        loadCategories();
    };
    
    
    $scope.initPromociones = function() {
        cargarPromociones($stateParams.shopping);
    };
    /*
        Funcion para cargar Promociones del Centro Comercial
    */
    function cargarPromociones(shoppping) {
        CentrosComerciales.getPromociones(shoppping).then(
            function(success){
                categories.statusObj['loading'] = false;
                if(CentrosComerciales.promociones != null) {
                    $scope.promociones = CentrosComerciales.promociones;
                    console.log($scope.promociones);
                }
            },
            function(error){
                console.log(error);
                categories.statusObj['loading'] = false;
                categories.statusObj['generalmessage'] = "Hubo un error..."
            }
        );
    };

    $scope.eliminarPromocion = function(promocion, key) {
        var comercio = promocion;
        console.log(comercio);
        console.log(key);

        swal({
          title: "Desea eliminar la promocion?",
          text: "Ya no se va a poder recuperar.",
          icon: "warning", 
          buttons: ["Cancelar", "Eliminar"],
          dangerMode: true,
        })
        .then((willDelete) => {
          if (willDelete) {
            console.log(key);
                        CentrosService.eliminarPromocion('centros_comerciales', comercio, key).then(function(success){
                            console.log(success);
                            categories.goTo('admin.categories-centros_comerciales');
                            swal("Eliminado con exito", {
                              icon: "success", 
                            });
                        }, function(error){
                            console.log(error);
                            categories.goTo('admin.categories-centros_comerciales');
                            swal("No se ha eliminado", {
                              icon: "danger", 
                            });
                        });
          }
        });
        
    };


    
    /*
        Funcion para agregar un nuevo Centro Comercial
    */
    $scope.nuevaPromocion = function(shoppping) {
        $state.go('admin.SubmitpromocionesCentrosComerciales',{shopping: shoppping})
        
    };
    $scope.editarPromocion = function(shoppping,idPromocion) {
        $state.go('admin.SubmitpromocionesCentrosComerciales',{shopping: shoppping,promo:idPromocion})
        
    };
    /*
        Funcion para cargar Centro Comercial
    */
    function loadCategories() {
        CentrosComerciales.get().then(
            function(success){
                categories.statusObj['loading'] = false;
                if(CentrosComerciales.all != null) {
                    categories.CategoriesForm = CentrosComerciales.all;
                }
            },
            function(error){
                console.log(error);
                categories.statusObj['loading'] = false;
                categories.statusObj['generalmessage'] = "Hubo un error..."
            }
        );
    };
    
    /*
        Funcion para agregar un nuevo Centro Comercial
    */
    categories.nuevo = function() {
        $state.go('admin.submitCentrosComerciales')
        
    };
    
    categories.add = function() {
        var catId = Utils.alphaNumeric(categories.statusObj.newCategory);
        if(categories.statusObj.newCategory) {
            categories.CategoriesForm[catId] = {
                title: categories.statusObj.newCategory
            };
            set();
        }
    };
    
    categories.remove = function(key) {
        delete categories.CategoriesForm[key];
        set();
    };
    
    categories.save = function() {
        set();
    };
    
    function set() {
        categories.statusObj['generalmessage'] = "Changing categories..."
        CentrosComerciales.set(categories.CategoriesForm).then(
            function(success){
                
                categories.statusObj['generalmessage'] = "Success!"
                
            },
            function(error){
                categories.statusObj['generalmessage'] = "Something went wrong..."
                console.log(error);
            }
        )
    };
    

    /*
        Funcion para editar algun Centro Comercial
    */
    categories.editItem = function(productId) {
        $state.go('admin.submitCentrosComerciales', {productId: productId})
    };
    
    
    /*
        Funcion para ver Locales de algun Centro Comercial
    */
    categories.locales = function(CentroComercial) {
        $state.go('admin.Locales', {CentroComercial: CentroComercial})
    };
    
    
    /*
        Funcion para ver Promociones de algun Centro Comercial
    */
    categories.promociones = function(CentroComercial) {
        $state.go('admin.promocionesCentrosComerciales', {shopping: CentroComercial})
    };
    categories.goTo = function(nextState) {
        $state.go(nextState)
    };
  
})


.controller('LocalesCentros', function($scope, $state, $anchorScroll, $location, $stateParams, 
    Auth, Locales, Utils, CentrosLocalService) {
    
    var locales              = this;
    locales.AuthData         = Auth.AuthData;
    locales.CategoriesForm   = Locales.all;
    
    locales.statusObj = {
        loading: true,
        newCategory: ""
    };
    
    locales.initView = function() {
        $location.hash('page-top');
        $anchorScroll();
        locales.local =  $stateParams.CentroComercial;
        
        cargarLocales();
    };
    
    /*
        Funcion para cargar Locales del Centro Comercial
    */
    function cargarLocales() {
        Locales.get(locales.local).then(
            function(success){
                locales.statusObj['loading'] = false;
                if(Locales.all != null) {
                    locales.CategoriesForm = Locales.all;
                }
            },
            function(error){
                console.log(error);
                locales.statusObj['loading'] = false;
                locales.statusObj['generalmessage'] = "Hubo un error..."
            }
        );
    };

    
    
    $scope.initPromociones = function() {
        $scope.shopping =  $stateParams.shopping;
        $scope.local =  $stateParams.localId;
        cargarPromociones($stateParams.shopping, $stateParams.localId);
    };
    /*
        Funcion para cargar Promociones del Centro Comercial
    */
    function cargarPromociones(shoppping,local) {
        Locales.getPromociones(shoppping,local).then(
            function(success){
                locales.statusObj['loading'] = false;
                if(Locales.promociones != null) {
                    $scope.promociones = Locales.promociones;
                    console.log($scope.promociones);
                }
            },
            function(error){
                console.log(error);
                locales.statusObj['loading'] = false;
                locales.statusObj['generalmessage'] = "Hubo un error..."
            }
        );
    };

    $scope.eliminarPromocion = function(shopping, local, key) {
        swal({
          title: "Desea eliminar la promocion?",
          text: "Ya no se va a poder recuperar.",
          icon: "warning", 
          buttons: ["Cancelar", "Eliminar"],
          dangerMode: true,
        })
        .then((willDelete) => {
          if (willDelete) {
            console.log(key);
                        CentrosLocalService.eliminarPromocion(shopping, local, key).then(function(success){
                            console.log(success);
                            locales.goTocomercio();
                            swal("Eliminado con exito", {
                              icon: "success", 
                            });
                        }, function(error){
                            console.log(error);
                            locales.goTocomercio();
                            swal("No se ha eliminado", {
                              icon: "danger", 
                            });
                        });
          }
        });
        
    };


    
    /*
        Promocion
    */
    $scope.nuevaPromocion = function(shoppping,local) {
        $state.go('admin.SubmitpromocionesCentrosComercialesLocales',{shopping: shoppping, localId:local})
        
    };
    $scope.editarPromocion = function(shoppping,local,idPromocion) {
        $state.go('admin.SubmitpromocionesCentrosComercialesLocales',{shopping: shoppping, localId:local, promo:idPromocion})
        
    };
    
    /*
        Funcion para agregar un nuevo Centro Comercial
    */

    locales.nuevo = function(comercio) {
        $state.go('admin.submitCentrosComercialesLocales', {CentroComercial:comercio})
        
    };
    
    locales.add = function() {
        var catId = Utils.alphaNumeric(categories.statusObj.newCategory);
        if(categories.statusObj.newCategory) {
            categories.CategoriesForm[catId] = {
                title: categories.statusObj.newCategory
            };
            set();
        }
    };
    
    locales.remove = function(key) {
        delete categories.CategoriesForm[key];
        set();
    };
    
    locales.save = function() {
        set();
    };
    
    function set() {
        categories.statusObj['generalmessage'] = "Changing categories..."
        Locales.set(categories.CategoriesForm).then(
            function(success){
                
                categories.statusObj['generalmessage'] = "Success!"
                
            },
            function(error){
                categories.statusObj['generalmessage'] = "Something went wrong..."
                console.log(error);
            }
        )
    };
    

    /*
        Funcion para editar algun Centro Comercial
    */
    locales.editItem = function(localId, centroComercial) {
        $state.go('admin.submitCentrosComercialesLocales', {localId: localId, CentroComercial:centroComercial})
    };
    
    
    /*
        Funcion para ver Promociones de algun Centro Comercial
    */
    locales.promociones = function(local,CentroComercial) {
        $state.go('admin.promocionesCentrosComercialesLocales', {shopping: CentroComercial,localId:local})
    };
    
    locales.goTo = function(nextState) {
        $state.go(nextState)
    };
    

    
    locales.goTocomercio = function() {
        $state.go('admin.Locales',{CentroComercial:$scope.shopping})
    };
  
})


.controller('MultiMarcasCtrl', function($state, $anchorScroll, $location, Auth, MultiMarcas, Utils,
 $stateParams, $scope, MultiMarcasService) {
    
    var categories              = this;
    $scope.AuthData         = Auth.AuthData;
    $scope.multimarcas = MultiMarcas.all;
    

    $scope.promocion =  $stateParams.multimarca;
    
    $scope.initListado = function() {
        $scope.cargando = true;
        $location.hash('page-top');
        $anchorScroll();
        
        loadMultimarcas();
    };
    
    
    $scope.initPromociones = function() {
        cargarPromociones($stateParams.multimarca);
    };

    
    /*
        Funcion para cargar Promociones del Centro Comercial
    */
    function cargarPromociones(shoppping) {
        $scope.cargando = true;
        MultiMarcas.getPromociones(shoppping).then(
            function(success){
                $scope.cargando = false;
                if(MultiMarcas.promociones != null) {
                    $scope.promociones = MultiMarcas.promociones;
                    console.log($scope.promociones);
                }
            },
            function(error){
                console.log(error);
                $scope.cargando = false;
            }
        );
    };

    $scope.eliminarPromocion = function(shopping, key) {
        swal({
          title: "Desea eliminar la promocion?",
          text: "Ya no se va a poder recuperar.",
          icon: "warning",
          buttons: ["Cancelar", "Eliminar"],
          dangerMode: true,
        })
        .then((willDelete) => {
          if (willDelete) {
            console.log(key);
                        MultiMarcasService.eliminarPromocion(shopping, key).then(function(success){
                            console.log(success);
                            categories.goTo('admin.categories-multimarcas');
                            swal("Eliminado con exito", {
                              icon: "success", 
                            });
                        }, function(error){
                            console.log(error);
                            categories.goTo('admin.categories-multimarcas');
                            swal("No se ha eliminado", {
                              icon: "danger", 
                            });
                        });
          }
        });
        
    };


    
    /*
        Funcion para agregar un nuevo Centro Comercial
    */
    $scope.nuevaPromocion = function(shoppping) {
        $state.go('admin.SubmitpromocionesMultimarcas',{shopping: shoppping})
        
    };
    $scope.editarPromocion = function(shoppping,idPromocion) {
        $state.go('admin.SubmitpromocionesMultimarcas',{shopping: shoppping,promo:idPromocion})
        
    };
    /*
        Funcion para cargar Multimarcas
    */
    function loadMultimarcas() {
        MultiMarcas.get().then(
            function(success){
                $scope.cargando = false;
                if(MultiMarcas.all != null) {
                    $scope.multimarcas = MultiMarcas.all;
                    console.log($scope.multimarcas);
                }
            },
            function(error){
                console.log(error);
                $scope.cargando = false;
                $scope.mensaje = "Hubo un error..."
            }
        );
    };
    
    /*
        Funcion para agregar un nuevo Centro Comercial
    */
    categories.nuevo = function() {
        $state.go('admin.submitCentrosComerciales')
        
    };
    
    categories.add = function() {
        var catId = Utils.alphaNumeric(categories.statusObj.newCategory);
        if(categories.statusObj.newCategory) {
            categories.CategoriesForm[catId] = {
                title: categories.statusObj.newCategory
            };
            set();
        }
    };
    
    categories.remove = function(key) {
        delete categories.CategoriesForm[key];
        set();
    };
    
    categories.save = function() {
        set();
    };
    
    function set() {
        categories.statusObj['generalmessage'] = "Changing categories..."
        CentrosComerciales.set(categories.CategoriesForm).then(
            function(success){
                
                categories.statusObj['generalmessage'] = "Success!"
                
            },
            function(error){
                categories.statusObj['generalmessage'] = "Something went wrong..."
                console.log(error);
            }
        )
    };
    

    /*
        Funcion para editar algun Centro Comercial
    */
    $scope.editItem = function(productId) {
        $state.go('admin.submitMultimarcas', {productId: productId})
    };
    
    
    /*
        Funcion para ver Locales de algun Centro Comercial
    */
    categories.locales = function(CentroComercial) {
        $state.go('admin.Locales', {CentroComercial: CentroComercial})
    };
    
    
    /*
        Funcion para ver Promociones de algun Centro Comercial
    */
    categories.promociones = function(CentroComercial) {
        $state.go('admin.promocionesCentrosComerciales', {shopping: CentroComercial})
    };
    categories.goTo = function(nextState) {
        $state.go(nextState)
    };
    

  
})

.controller('SucursalesMultimarcas', function($scope, $state, $anchorScroll, $location,
 $stateParams, Auth, MultiSucursales, Utils, MultiSucursalService) {
    
    var locales              = this;
    locales.AuthData         = Auth.AuthData;
    locales.CategoriesForm   = MultiSucursales.all;
    
    locales.statusObj = {
        loading: true,
        newCategory: ""
    };
    
    $scope.initView = function() {
        $location.hash('page-top');
        $anchorScroll();
        $scope.local =  $stateParams.CentroComercial;
        console.log($scope.local);
        
        cargarLocales();
    };
    
    /*
        Funcion para cargar Locales del Centro Comercial
    */
    function cargarLocales() {
        MultiSucursales.get($scope.local).then(
            function(success){
                locales.statusObj['loading'] = false;
                if(MultiSucursales.all != null) {
                    locales.CategoriesForm = MultiSucursales.all;
                }
            },
            function(error){
                console.log(error);
                locales.statusObj['loading'] = false;
                locales.statusObj['generalmessage'] = "Hubo un error..."
            }
        );
    };

    
    
    $scope.initPromociones = function() {
        $scope.shopping =  $stateParams.shopping;
        $scope.local =  $stateParams.localId;
        cargarPromociones($stateParams.shopping, $stateParams.localId);
    };
    /*
        Funcion para cargar Promociones del Centro Comercial
    */
    function cargarPromociones(shoppping,local) {
        MultiSucursales.getPromociones(shoppping,local).then(
            function(success){
                locales.statusObj['loading'] = false;
                if(MultiSucursales.promociones != null) {
                    $scope.promociones = MultiSucursales.promociones;
                    console.log($scope.promociones);
                }
            },
            function(error){
                console.log(error);
                locales.statusObj['loading'] = false;
                locales.statusObj['generalmessage'] = "Hubo un error..."
            }
        );
    };

    $scope.eliminarPromocion = function(shopping, local, key) {
        swal({
          title: "Desea eliminar la promocion?",
          text: "Ya no se va a poder recuperar.",
          icon: "warning",
          buttons: ["Cancelar", "Eliminar"],
          dangerMode: true,
        })
        .then((willDelete) => {
          if (willDelete) {
            console.log(key);
                        MultiSucursalService.eliminarPromocion(shopping, local, key).then(function(success){
                            console.log(success);
                            locales.goTocomercio();
                            swal("Eliminado con exito", {
                              icon: "success", 
                            });
                        }, function(error){
                            console.log(error);
                            locales.goTocomercio();
                            swal("No se ha eliminado", {
                              icon: "danger", 
                            });
                        });
          }
        });
        
    };


    
    /*
        Promocion
    */
    $scope.nuevaPromocion = function(shoppping,local) {
        $state.go('admin.SubmitpromocionesSucursalesMultimarcas',{shopping: shoppping, localId:local})
        
    };
    $scope.editarPromocion = function(shoppping,local,idPromocion) {
        $state.go('admin.SubmitpromocionesSucursalesMultimarcas',{shopping: shoppping, localId:local, promo:idPromocion})
        
    };
    
    /*
        Funcion para agregar un nuevo Centro Comercial
    */

    locales.nuevo = function(comercio) {
        $state.go('admin.submitSucursalesMultimarcas', {CentroComercial:comercio})
        
    };
    
    locales.add = function() {
        var catId = Utils.alphaNumeric(categories.statusObj.newCategory);
        if(categories.statusObj.newCategory) {
            categories.CategoriesForm[catId] = {
                title: categories.statusObj.newCategory
            };
            set();
        }
    };
    
    locales.remove = function(key) {
        delete categories.CategoriesForm[key];
        set();
    };
    
    locales.save = function() {
        set();
    };
    
    function set() {
        categories.statusObj['generalmessage'] = "Changing categories..."
        MultiSucursales.set(categories.CategoriesForm).then(
            function(success){
                
                categories.statusObj['generalmessage'] = "Success!"
                
            },
            function(error){
                categories.statusObj['generalmessage'] = "Something went wrong..."
                console.log(error);
            }
        )
    };
    

    /*
        Funcion para editar algun Centro Comercial
    */
    locales.editItem = function(localId, centroComercial) {
        $state.go('admin.submitSucursalesMultimarcas', {localId: localId, CentroComercial: $scope.local})
    };
    
    
    /*
        Funcion para ver Promociones de algun Centro Comercial
    */
    locales.promociones = function(local,CentroComercial) {
        $state.go('admin.promocionesSucursalesMultimarcas', {shopping: $scope.local,localId:local})
    };
    
    locales.goTo = function(nextState) {
        $state.go(nextState)
    };
    

    
    locales.goTocomercio = function() {
        $state.go('admin.SucursalesMultimarcas',{CentroComercial:$scope.shopping})
    };
  
})


.controller('SupermercadosCtrl', function($state, $anchorScroll, $location, Auth,
    Supermercados, Utils, $stateParams, $scope, SupermercadosService) {
    
    var categories              = this;
    $scope.AuthData         = Auth.AuthData;
    $scope.multimarcas = Supermercados.all;
    

    $scope.promocion =  $stateParams.multimarca;
    
    $scope.initListado = function() {
        $scope.cargando = true;
        $location.hash('page-top');
        $anchorScroll();
        
        loadMultimarcas();
    };
    
    
    $scope.initPromociones = function() {
        cargarPromociones($stateParams.multimarca);
    };

    
    /*
        Funcion para cargar Promociones del Centro Comercial
    */
    function cargarPromociones(shoppping) {
        $scope.cargando = true;
        Supermercados.getPromociones(shoppping).then(
            function(success){
                $scope.cargando = false;
                if(Supermercados.promociones != null) {
                    $scope.promociones = Supermercados.promociones;
                    console.log($scope.promociones);
                }
            },
            function(error){
                console.log(error);
                $scope.cargando = false;
            }
        );
    };

    $scope.eliminarPromocion = function(shopping, key) {
        swal({
          title: "Desea eliminar la promocion?",
          text: "Ya no se va a poder recuperar.",
          icon: "warning",
          buttons: ["Cancelar", "Eliminar"],
          dangerMode: true,
        })
        .then((willDelete) => {
          if (willDelete) {
            console.log(key);
                        SupermercadosService.eliminarPromocion(shopping, key).then(function(success){
                            console.log(success);
                            categories.goTo('admin.categories-supermercados');
                            swal("Eliminado con exito", {
                              icon: "success", 
                            });
                        }, function(error){
                            console.log(error);
                            categories.goTo('admin.categories-supermercados');
                            swal("No se ha eliminado", {
                              icon: "danger", 
                            });
                        });
          }
        });
        
    };


    
    /*
        Funcion para agregar un nuevo Centro Comercial
    */
    $scope.nuevaPromocion = function(shoppping) {
        $state.go('admin.SubmitpromocionesSupermercados',{shopping: shoppping})
        
    };
    $scope.editarPromocion = function(shoppping,idPromocion) {
        $state.go('admin.SubmitpromocionesSupermercados',{shopping: shoppping,promo:idPromocion})
        
    };
    /*
        Funcion para cargar Multimarcas
    */
    function loadMultimarcas() {
        Supermercados.get().then(
            function(success){
                $scope.cargando = false;
                if(Supermercados.all != null) {
                    $scope.multimarcas = Supermercados.all;
                    console.log($scope.multimarcas);
                }
            },
            function(error){
                console.log(error);
                $scope.cargando = false;
                $scope.mensaje = "Hubo un error..."
            }
        );
    };
    
    /*
        Funcion para agregar un nuevo Centro Comercial
    */
    categories.nuevo = function() {
        $state.go('admin.submitSupermercados')
        
    };
    
    categories.add = function() {
        var catId = Utils.alphaNumeric(categories.statusObj.newCategory);
        if(categories.statusObj.newCategory) {
            categories.CategoriesForm[catId] = {
                title: categories.statusObj.newCategory
            };
            set();
        }
    };
    
    categories.remove = function(key) {
        delete categories.CategoriesForm[key];
        set();
    };
    
    categories.save = function() {
        set();
    };
    
    function set() {
        categories.statusObj['generalmessage'] = "Changing categories..."
        CentrosComerciales.set(categories.CategoriesForm).then(
            function(success){
                
                categories.statusObj['generalmessage'] = "Success!"
                
            },
            function(error){
                categories.statusObj['generalmessage'] = "Something went wrong..."
                console.log(error);
            }
        )
    };
    

    /*
        Funcion para editar algun Centro Comercial
    */
    $scope.editItem = function(productId) {
        $state.go('admin.submitSupermercados', {productId: productId})
    };
    
    
    /*
        Funcion para ver Locales de algun Centro Comercial
    */
    categories.locales = function(CentroComercial) {
        $state.go('admin.SucursalesSupermercados', {CentroComercial: CentroComercial})
    };
    
    
    /*
        Funcion para ver Promociones de algun Centro Comercial
    */
    categories.promociones = function(CentroComercial) {
        $state.go('admin.promocionesSupermercados', {shopping: CentroComercial})
    };
    categories.goTo = function(nextState) {
        $state.go(nextState)
    };
    

  
})

.controller('SucursalesSupermercados', function($scope, $state, $anchorScroll, $location,
 $stateParams, Auth, SuperSucursales, Utils, SuperSucursalService) {
    
    var locales              = this;
    locales.AuthData         = Auth.AuthData;
    locales.CategoriesForm   = SuperSucursales.all;
    
    locales.statusObj = {
        loading: true,
        newCategory: ""
    };
    
    $scope.initView = function() {
        $location.hash('page-top');
        $anchorScroll();
        $scope.local =  $stateParams.CentroComercial;
        console.log($scope.local);
        
        cargarLocales();
    };
    
    /*
        Funcion para cargar Locales del Centro Comercial
    */
    function cargarLocales() {
        SuperSucursales.get($scope.local).then(
            function(success){
                locales.statusObj['loading'] = false;
                if(SuperSucursales.all != null) {
                    locales.CategoriesForm = SuperSucursales.all;
                }
            },
            function(error){
                console.log(error);
                locales.statusObj['loading'] = false;
                locales.statusObj['generalmessage'] = "Hubo un error..."
            }
        );
    };

    
    
    $scope.initPromociones = function() {
        $scope.shopping =  $stateParams.shopping;
        $scope.local =  $stateParams.localId;
        cargarPromociones($stateParams.shopping, $stateParams.localId);
    };
    /*
        Funcion para cargar Promociones del Centro Comercial
    */
    function cargarPromociones(shoppping,local) {
        SuperSucursales.getPromociones(shoppping,local).then(
            function(success){
                locales.statusObj['loading'] = false;
                if(SuperSucursales.promociones != null) {
                    $scope.promociones = SuperSucursales.promociones;
                    console.log($scope.promociones);
                }
            },
            function(error){
                console.log(error);
                locales.statusObj['loading'] = false;
                locales.statusObj['generalmessage'] = "Hubo un error..."
            }
        );
    };

    $scope.eliminarPromocion = function(shopping, local, key) {
        swal({
          title: "Desea eliminar la promocion?",
          text: "Ya no se va a poder recuperar.",
          icon: "warning",
          buttons: ["Cancelar", "Eliminar"],
          dangerMode: true,
        })
        .then((willDelete) => {
          if (willDelete) {
            console.log(key);
                        SuperSucursalService.eliminarPromocion(shopping, local, key).then(function(success){
                            console.log(success);
                            locales.goTocomercio();
                            swal("Eliminado con exito", {
                              icon: "success", 
                            });
                        }, function(error){
                            console.log(error);
                            locales.goTocomercio();
                            swal("No se ha eliminado", {
                              icon: "danger", 
                            });
                        });
          }
        });
        
    };


    
    /*
        Promocion
    */
    $scope.nuevaPromocion = function(shoppping,local) {
        $state.go('admin.SubmitpromocionesSucursalesSupermercados',{shopping: shoppping, localId:local})
        
    };
    $scope.editarPromocion = function(shoppping,local,idPromocion) {
        $state.go('admin.SubmitpromocionesSucursalesSupermercados',{shopping: shoppping, localId:local, promo:idPromocion})
        
    };
    
    /*
        Funcion para agregar un nuevo Centro Comercial
    */

    locales.nuevo = function(comercio) {
        $state.go('admin.submitSucursalesSupermercados', {CentroComercial:comercio})
        
    };
    
    locales.add = function() {
        var catId = Utils.alphaNumeric(categories.statusObj.newCategory);
        if(categories.statusObj.newCategory) {
            categories.CategoriesForm[catId] = {
                title: categories.statusObj.newCategory
            };
            set();
        }
    };
    
    locales.remove = function(key) {
        delete categories.CategoriesForm[key];
        set();
    };
    
    locales.save = function() {
        set();
    };
    
    function set() {
        categories.statusObj['generalmessage'] = "Changing categories..."
        SuperSucursales.set(categories.CategoriesForm).then(
            function(success){
                
                categories.statusObj['generalmessage'] = "Success!"
                
            },
            function(error){
                categories.statusObj['generalmessage'] = "Something went wrong..."
                console.log(error);
            }
        )
    };
    

    /*
        Funcion para editar algun Centro Comercial
    */
    locales.editItem = function(localId, centroComercial) {
        $state.go('admin.submitSucursalesSupermercados', {localId: localId, CentroComercial: $scope.local})
    };
    
    
    /*
        Funcion para ver Promociones de algun Centro Comercial
    */
    locales.promociones = function(local,CentroComercial) {
        $state.go('admin.promocionesSucursalesSupermercados', {shopping: $scope.local,localId:local})
    };
    
    locales.goTo = function(nextState) {
        $state.go(nextState)
    };
    

    
    locales.goTocomercio = function() {
        $state.go('admin.SucursalesSupermercados',{CentroComercial:$scope.shopping})
    };
  
})