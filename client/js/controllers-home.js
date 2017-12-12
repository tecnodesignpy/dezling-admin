angular.module('noodlio.controllers-home', ["chart.js",'dx',])


.controller('HomeCtrl', function($rootScope, $scope ,$state, $anchorScroll, $location, Auth, $log, $window) {

    var home        = this;
    home.AuthData   = Auth.AuthData;
    
    home.initView = function() {
        $location.hash('page-top');
        $anchorScroll();
        
        checkAuth();
    };
    
    function checkAuth() { // can be put in a resolve in app.js
        home.AuthData   = Auth.AuthData;
        if(!Auth.AuthData.hasOwnProperty('uid')) {
            Auth.checkAuthState().then(
                function(loggedIn){
                    
                    home.AuthData = Auth.AuthData;
                },
                function(notLoggedIn) {
                    $state.go('admin.login')
                }
            )
        };
        
    };
    
    home.goTo = function(nextState) {
        $state.go(nextState)
    };

    $scope.analytics = function(){
        $window.open('https://analytics.google.com/','_blank');
    };

    $scope.devicepush = function(){
        $window.open('http://panel.devicepush.com','_blank');
    };
})

.controller('NotificacionesCtrl', function($rootScope, $scope ,$state, $anchorScroll, $location, $http) {

    // Funcion que llamamos al iniciar la vista
    $scope.initView = function() {
        $location.hash('page-top');
        $anchorScroll();
        $scope.loading = true;
        $scope.getDispositivos();
        $scope.labels = ["Registrados", "Limite"];
        $scope.data = [50, 2000];
    };

    // Obtenemos la cantidad de dispositivos 
    $scope.getDispositivos = function(){
        //var http = require('http');

        $scope.loading = false;
        var datos = {
           idApplication: 'acec-c234-5b44-b430',
           //idDevice: 'DEVICE_ID'
        }
         /*
        var options = {
            method: 'POST',
            url: 'http://api.devicepush.com/1.0/list/devices/',
            port: '80',
            data: datos,
            headers: { 'token': '57695030a93092d74dc1f60e', 'Content-Type': 'application/json'}
        }
        */
        var config = {
          method:'POST',
          url:'http://api.devicepush.com/1.0/list/devices/',
          data:datos,
          headers:{ 'token': '57695030a93092d74dc1f60e', 'Content-Type': 'application/json'}
        } 

        var response = $http(config);
        response.success(function(data,status){
            console.log('Done', data);
            console.log('Done', status);
        });
         /*
        var post_req = $http(config);(options,function(response){
            response.on('data', function (chunk) {
                console.log(JSON.parse(chunk));
         
            });
        });
        */
    };
})

.controller('SponsorCtrl', function($rootScope, $scope ,$state, $anchorScroll, $location, Sponsor,$stateParams, Auth, $window) {

    // Chequeamos siempre si el usuario esta autenticado, caso contrario redireccionamos al login
    $scope.$on('$ionicView.enter', function(e) {
        // global variables
        $scope.AuthData = Auth.AuthData;
        checkAuth();
    });

    //Iniciamos la funcion desde el template para cargar los Sponsors
    $scope.initView = function() {
        $location.hash('page-top');
        $anchorScroll();
        //Cargamos listado de Sponsor
        CargarSponsor();
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
    function CargarSponsor(){
        $scope.cargando = true;
        Sponsor.get().then(
            function(success){
                if(Sponsor.all != null) {
                    $scope.sponsors = Sponsor.all;
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

    // Funcion para Editar Sponsors
    $scope.EditarSponsor = function(IdSponsor){
        $scope.cargando = true;
        $state.go('admin.submit_sponsor', {IdSponsor: IdSponsor});
    };

    // Funcion para Eliminar Sponsors
    $scope.EliminarSponsor = function(IdSponsor){
        swal({
          title: "Desea eliminar el Sponsor?",
          text: "Ya no se va a poder recuperar el sponsor.",
          icon: "warning", 
          buttons: ["Cancelar", "Eliminar"],
          dangerMode: true,
        })
        .then((willDelete) => {
          if (willDelete) {

            Sponsor.eliminar(IdSponsor).then(
                function(success){
                    $window.location.reload();
                    console.log("ok");
                },
                function(error){
                    $window.location.reload();
                    console.log("error");
                }
            );
            swal("Eliminado con exito", {
              icon: "success", 
            });
          }
        });
    };

    $scope.Redireccion = function() {
        var submit = this;
        submit.ErrorMessages    = {};
        $location.hash('page-top');
        $anchorScroll();
        $scope.enviando= false;
        //Verificamos si es nuevo o se edita uno ya existente
        if($stateParams.IdSponsor == '') {
            $scope.status = "new";
        }else{
            $scope.status = "edit";
            //Obtenemos los datos del sponsor y lo cargamos en un $scope
            Sponsor.getSponsor($stateParams.IdSponsor).then(
                function(success){
                    if(Sponsor.SponsorMeta != null) {
                        $scope.SponsorMeta = Sponsor.SponsorMeta;
                        $scope.filepreview = Sponsor.SponsorMeta.banner
                        $scope.cargando = false;
                    }
                },
                function(error){
                    console.log(error);
                    $scope.cargando = true;
                    $scope.mensaje =  "Hubo un error..."
                }
            );

        }
    };

    $scope.guardar = function() {
        scrollToSubmitEnd(); 
        //Chequeamos que los campos esten completos

            switch ($scope.status) {
                case "edit":
                    // Validamos el Formulario
                    if(ValidamosSponsor()){
                        
                        // referential
                        //addReferentialData();
                        
                        // psubmit
                        //submit.status['submitLoading']      = true;
            
                        Sponsor.editSponsor($scope.SponsorMeta, $scope.filepreview, $stateParams.IdSponsor).then(
                            function(success){
                                $state.go('admin.sponsor');
                            },
                            function(error){
                                handleError(error)
                            }
                        );
                        break
                    };
                case "new":
                    // Validamos el Formulario
                    if(ValidamosSponsor()){
                        
                        // referential
                        //addReferentialData();
                        
                        // psubmit
                        //
                        console.log($scope.fileinput);
                        Sponsor.submitSponsor($scope.SponsorMeta, $scope.filepreview).then(
                            function(success){
                                $state.go('admin.sponsor');
                            },
                            function(error){
                                handleError(error)
                            }
                        );
                        break
                    };
            } // ./ switch
        //Enviamos los datos al service para realizar el push or update
    };
    
    // Scroll hasta el final de la pagina
    function scrollToSubmitEnd() {
        $location.hash('submit0');
        $anchorScroll.yOffset = 100;
        $anchorScroll();
    };


    function ValidamosSponsor() {
        submit.ErrorMessages = {};
        $scope.NoError = true;

        //
        // Nombre del Comercio
        var titulo = document.getElementById("titulo").value;
        if( titulo== "" || 
            titulo == null ||
            titulo == undefined){
            submit.ErrorMessages["titulo"] = "*";
            $scope.NoError = false;
        }else{
            submit.ErrorMessages["titulo"] =  "";
        }

        var descripcion = document.getElementById("descripcion").value;
        if( descripcion== "" || 
            descripcion == null ||
            descripcion == undefined){
            submit.ErrorMessages["descripcion"] = "*";
            $scope.NoError = false;
        }else{
            submit.ErrorMessages["descripcion"] =  "";
        }

        var fecha_inicio = document.getElementById("fecha_inicio").value;
        if( fecha_inicio== "" || 
            fecha_inicio == null ||
            fecha_inicio == undefined){
            submit.ErrorMessages["fecha_inicio"] = "*";
            $scope.NoError = false;
        }else{
            submit.ErrorMessages["fecha_inicio"] =  "";
        }

        var fecha_fin = document.getElementById("fecha_fin").value;
        if( fecha_fin== "" || 
            fecha_fin == null ||
            fecha_fin == undefined){
            submit.ErrorMessages["fecha_fin"] = "*";
            $scope.NoError = false;
        }else{
            submit.ErrorMessages["fecha_fin"] =  "";
        }
    /*
            var banner = document.getElementById("banner").value;
            console.log(banner);
            if( banner== "" || 
                banner == null ||
                banner == undefined){
                submit.ErrorMessages["banner"] = "*";
                $scope.NoError = false;
            }else{
                submit.ErrorMessages["banner"] =  "";
            }
    */
        //
        // generic
        if (!$scope.NoError) {
            submit.ErrorMessages['general'] = 
            "Todos los campos deben ser completados";
        };
        console.log($scope.NoError);


        return $scope.NoError;
    };

})

.controller('DestacadosCtrl', function($rootScope, $scope ,$state, $anchorScroll, $location, Destacado, $stateParams, Auth, $window) {

    // Chequeamos siempre si el usuario esta autenticado, caso contrario redireccionamos al login
    $scope.$on('$ionicView.enter', function(e) {
        // global variables
        $scope.AuthData = Auth.AuthData;
        checkAuth();
    });

    //Iniciamos la funcion desde el template para cargar los Sponsors
    $scope.initView = function() {
        $location.hash('page-top');
        $anchorScroll();
        //Cargamos listado de Destacado
        CargarDestacado();
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
    function CargarDestacado(){
        $scope.cargando = true;
        Destacado.get().then(
            function(success){
                if(Destacado.all != null) {
                    $scope.sponsors = Destacado.all;
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

    // Funcion para Editar Sponsors
    $scope.EditarDestacado = function(IdSponsor){
        $scope.cargando = true;
        $state.go('admin.submit_destacado', {IdSponsor: IdSponsor});
    };

    // Funcion para Eliminar Sponsors
    $scope.EliminarDestacado = function(IdSponsor){
        swal({
          title: "Desea eliminar el Destacado?",
          text: "Ya no se va a poder recuperar el sponsor.",
          icon: "warning", 
          buttons: ["Cancelar", "Eliminar"],
          dangerMode: true,
        })
        .then((willDelete) => {
          if (willDelete) {

            Destacado.eliminar(IdSponsor).then(
                function(success){
                    $window.location.reload();
                    console.log("ok");
                },
                function(error){
                    $window.location.reload();
                    console.log("error");
                }
            );
            swal("Eliminado con exito", {
              icon: "success", 
            });
          }
        });
    };

    $scope.Redireccion = function() {
        var submit = this;
        submit.ErrorMessages    = {};
        $location.hash('page-top');
        $anchorScroll();
        $scope.enviando= false;
        //Verificamos si es nuevo o se edita uno ya existente
        if($stateParams.IdSponsor == '') {
            $scope.status = "new";
        }else{
            $scope.status = "edit";
            //Obtenemos los datos del sponsor y lo cargamos en un $scope
            Destacado.getSponsor($stateParams.IdSponsor).then(
                function(success){
                    if(Destacado.SponsorMeta != null) {
                        $scope.SponsorMeta = Destacado.SponsorMeta;
                        $scope.filepreview = Destacado.SponsorMeta.banner
                        $scope.cargando = false;
                    }
                },
                function(error){
                    console.log(error);
                    $scope.cargando = true;
                    $scope.mensaje =  "Hubo un error..."
                }
            );

        }
    };

    $scope.guardar = function() {
        scrollToSubmitEnd(); 
        //Chequeamos que los campos esten completos

            switch ($scope.status) {
                case "edit":
                    // Validamos el Formulario
                    if(ValidamosSponsor()){
                        
                        // referential
                        //addReferentialData();
                        
                        // psubmit
                        //submit.status['submitLoading']      = true;
            
                        Destacado.editSponsor($scope.SponsorMeta, $scope.filepreview, $stateParams.IdSponsor).then(
                            function(success){
                                $state.go('admin.destacados');
                            },
                            function(error){
                                handleError(error)
                            }
                        );
                        break
                    };
                case "new":
                    // Validamos el Formulario
                    if(ValidamosSponsor()){
                        
                        // referential
                        //addReferentialData();
                        
                        // psubmit
                        //
                        console.log($scope.fileinput);
                        Destacado.submitSponsor($scope.SponsorMeta, $scope.filepreview).then(
                            function(success){
                                $state.go('admin.destacados');
                            },
                            function(error){
                                handleError(error)
                            }
                        );
                        break
                    };
            } // ./ switch
        //Enviamos los datos al service para realizar el push or update
    };
    
    // Scroll hasta el final de la pagina
    function scrollToSubmitEnd() {
        $location.hash('submit0');
        $anchorScroll.yOffset = 100;
        $anchorScroll();
    };


    function ValidamosSponsor() {
        submit.ErrorMessages = {};
        $scope.NoError = true;

        //
        // Nombre del Comercio
        var titulo = document.getElementById("titulo").value;
        if( titulo== "" || 
            titulo == null ||
            titulo == undefined){
            submit.ErrorMessages["titulo"] = "*";
            $scope.NoError = false;
        }else{
            submit.ErrorMessages["titulo"] =  "";
        }

        var descripcion = document.getElementById("descripcion").value;
        if( descripcion== "" || 
            descripcion == null ||
            descripcion == undefined){
            submit.ErrorMessages["descripcion"] = "*";
            $scope.NoError = false;
        }else{
            submit.ErrorMessages["descripcion"] =  "";
        }

        var fecha_inicio = document.getElementById("fecha_inicio").value;
        if( fecha_inicio== "" || 
            fecha_inicio == null ||
            fecha_inicio == undefined){
            submit.ErrorMessages["fecha_inicio"] = "*";
            $scope.NoError = false;
        }else{
            submit.ErrorMessages["fecha_inicio"] =  "";
        }

        var fecha_fin = document.getElementById("fecha_fin").value;
        if( fecha_fin== "" || 
            fecha_fin == null ||
            fecha_fin == undefined){
            submit.ErrorMessages["fecha_fin"] = "*";
            $scope.NoError = false;
        }else{
            submit.ErrorMessages["fecha_fin"] =  "";
        }
    /*
            var banner = document.getElementById("banner").value;
            console.log(banner);
            if( banner== "" || 
                banner == null ||
                banner == undefined){
                submit.ErrorMessages["banner"] = "*";
                $scope.NoError = false;
            }else{
                submit.ErrorMessages["banner"] =  "";
            }
    */
        //
        // generic
        if (!$scope.NoError) {
            submit.ErrorMessages['general'] = 
            "Todos los campos deben ser completados";
        };
        console.log($scope.NoError);


        return $scope.NoError;
    };

})

.controller('UsuariosCtrl', function($rootScope, $scope ,$state, $anchorScroll, $location, UserService, $stateParams, $timeout,
    CentrosService, CentrosLocalService, MultiMarcasService, MultiSucursalService, SupermercadosService, SuperSucursalService) {

    $scope.initView = function() {
        $location.hash('page-top');
        $anchorScroll();
        $scope.loading = true;
        $scope.getUsuarios();
    };
    
    /*
        Funcion para obtener listado de Usuarios
    */
    $scope.getUsuarios = function() {
        UserService.getUsuarios().then(
            function(success){
                $scope.loading = false;
                $scope.usuarios = success;
                //console.log(success);
            },
            function(error){
                $scope.loading = false;
                //console.log(error);
            }
        );
    };
    // Lista de compras
    $scope.getListas = function() {
        $scope.loading = true;
        $scope.usuarioId = $stateParams.usuario
        UserService.getUsuario($scope.usuarioId).then(
            function(success){
                $scope.usuarioDetalle = success;
                console.log(success);
                $scope.loading = false;
            },
            function(error){
                $scope.loading = false;
                //console.log(error);
            }
        );
        $scope.listas = [];
        UserService.getListas($scope.usuarioId).then(
            function(success){
                $scope.loading = false;
                angular.forEach(success, function(value, key) {
                    $scope.listas.push(value);
                });
                console.log($scope.listas);
            },
            function(error){
                $scope.loading = false;
                //console.log(error);
            }
        );
    };

    // Favoritos
    $scope.getFavoritos = function() {
        $scope.loading = true;
        $scope.usuarioId = $stateParams.usuario
        UserService.getUsuario($scope.usuarioId).then(
            function(success){
                $scope.usuarioDetalle = success;
                console.log(success);
                $scope.loading = false;
            },
            function(error){
                $scope.loading = false;
                //console.log(error);
            }
        );
        $scope.detalle_Favorito = [];
        UserService.getFavoritos($scope.usuarioId).then(
            function(success){
                $scope.loading = false;
                angular.forEach(success,function (detalles) {
                  if(detalles.categoria == "centros_comerciales"){
                    $timeout(function() {
                      CentrosService.getProductMeta(detalles.slug).then(
                        function(success){
                          console.log(success);
                          $scope.detalle_Favorito.push(success);
                      });
                    }, 500);
                  }
                  if(detalles.categoria == "centros_comerciales_local"){
                    $timeout(function() {
                      CentrosLocalService.getProductMeta(detalles.slug,detalles.comercio).then(
                        function(success){
                          $scope.detalle_Favorito.push(success);
                      });
                    }, 500);
                  }
                  if(detalles.categoria == "multimarcas"){
                    $timeout(function() {
                      MultiMarcasService.getProductMeta(detalles.slug).then(
                        function(success){
                          //console.log(Multimarcas.shopping);
                          $scope.detalle_Favorito.push(success);
                      });
                    }, 500);
                  }
                  if(detalles.categoria == "multimarcas_local"){
                    $timeout(function() {
                      //console.log(detalles.slug,detalles.comercio);
                      MultiSucursalService.getProductMeta(detalles.slug,detalles.comercio).then(
                        function(success){
                          MultiMarcasService.getProductMeta(detalles.slug).then(
                            function(datos){
                              success.perfil.icono = datos.perfil.icono;
                              $scope.detalle_Favorito.push(success);
                          });
                      });
                    }, 500);
                  }
                  if(detalles.categoria == "supermercados"){
                    $timeout(function() {
                      SupermercadosService.getProductMeta(detalles.slug).then(
                        function(success){
                          //console.log(Multimarcas.shopping);
                          $scope.detalle_Favorito.push(success);
                      });
                    }, 500);
                  }
                  if(detalles.categoria == "supermercados_local"){
                    $timeout(function() {
                      //console.log(detalles.slug,detalles.comercio);
                      SuperSucursalService.getProductMeta(detalles.slug,detalles.comercio).then(
                        function(success){
                          SupermercadosService.getProductMeta(detalles.slug).then(
                            function(datos){
                              success.perfil.icono = datos.perfil.icono;
                              $scope.detalle_Favorito.push(success);
                          });
                      });
                    }, 500);
                  }
                });
                console.log($scope.detalle_Favorito);
            },
            function(error){
                $scope.loading = false;
                //console.log(error);
            }
        );
    };

    // Perfil
    $scope.getPerfil = function() {
        $scope.loading = true;
        $scope.usuarioId = $stateParams.usuario
        UserService.getUsuario($scope.usuarioId).then(
            function(success){
                $scope.usuarioDetalle = success;
                console.log(success);
                $scope.formOptions = {
                    formData: success,
                    bindingOptions: {
                        readOnly: "true",
                    },
                    items: [{
                        itemType: "group",
                        cssClass: "first-group",
                        colCount: 4,
                        items: [{
                            template: "<div class='form-avatar'></div>"
                        }, {
                            itemType: "group",
                            colSpan: 3,
                            items: [{
                                dataField: "perfil.nombre",
                                label: {
                                    text: "Nombres"
                                }
                            }, {
                                dataField: "perfil.apellido",
                                label: {
                                    text: "Apellidos"
                                }
                            }, {
                                dataField: "perfil.birth",
                                label: {
                                    text: "Fecha de Nacimiento"
                                }
                            }]
                        }]
                    }, {
                        itemType: "group",
                        cssClass: "second-group",
                        colCount: 2,
                        items: [{
                            itemType: "group",
                            items: [{
                                dataField: "perfil.email",
                                label: {
                                    text: "Email"
                                }
                            }, {
                                dataField: "perfil.ciudad",
                                label: {
                                    text: "Ciudad"
                                }
                            }]
                        }, {
                            itemType: "group",
                            items: [{
                                dataField: "perfil.sexo",
                                label: {
                                    text: "Sexo"
                                }
                            }, {
                                dataField: "perfil.edad.min",
                                label: {
                                    text: "Edad"
                                }
                            }]
                        }]
                    }]
                };
                $scope.loading = false;
            },
            function(error){
                $scope.loading = false;
                //console.log(error);
            }
        );
    };
})

.controller('ReportesCtrl', function($rootScope, $scope, $filter ,$state, $anchorScroll, $location, UserService, $stateParams, $timeout,
    CentrosComerciales, MultiMarcas, Supermercados) {

    $scope.initView = function() {
        $location.hash('page-top');
        $anchorScroll();
        $scope.loading = true;
        $scope.items = [];
        $scope.getComercios();
    };
    
    /*
        Funcion para obtener listado de Usuarios
    */
    $scope.getComercios = function() {
        console.log("entro");
        MultiMarcas.get().then(
            function(success){
                console.log(success);
                angular.forEach(success, function(value, key) {
                    angular.forEach(value.locales, function(valor) {
                        valor.categoria = 'Multimarcas'
                        $scope.items.push(valor);
                    });
                    value.categoria = 'Multimarcas'
                    $scope.items.push(value);
                });
            },
            function(error){
                $scope.loading = false;
                console.log(error);
            }
        );
        Supermercados.get().then(
            function(success){
                console.log(success);
                angular.forEach(success, function(value, key) {
                    angular.forEach(value.locales, function(valor) {
                        valor.categoria = 'Supermercados'
                        $scope.items.push(valor);
                    });
                    value.categoria = 'Supermercados'
                    $scope.items.push(value);
                });
            },
            function(error){
                $scope.loading = false;
                console.log(error);
            }
        );
        CentrosComerciales.get().then(
            function(success){
                $scope.loading = false;
                console.log(success);

                angular.forEach(success, function(value, key) {
                    angular.forEach(value.locales, function(valor) {
                        valor.categoria = 'Shoppings'
                        $scope.items.push(valor);
                    });
                    value.categoria = 'Shoppings'
                    $scope.items.push(value);
                    // init
                      $scope.sortingOrder = 'perfil.nombre';
                      $scope.pageSizes = [5,10,25,50];
                      $scope.reverse = false;
                      $scope.filteredItems = [];
                      $scope.groupedItems = [];
                      $scope.itemsPerPage = 25;
                      $scope.pagedItems = [];
                      $scope.currentPage = 0;
                      console.log($scope.items);

                      var searchMatch = function (haystack, needle) {
                        if (!needle) {
                          return true;
                        }
                        return haystack.toLowerCase().indexOf(needle.toLowerCase()) !== -1;
                      };
                      
                      // init the filtered items
                      $scope.search = function () {
                        $scope.filteredItems = $scope.items;
                        $scope.currentPage = 0;
                        // now group by pages
                        $scope.groupToPages();
                      };
                      
                      // show items per page
                      $scope.perPage = function () {
                        $scope.groupToPages();
                      };
                      
                      // calculate page in place
                      $scope.groupToPages = function () {
                        $scope.pagedItems = [];
                        
                        for (var i = 0; i < $scope.filteredItems.length; i++) {
                          if (i % $scope.itemsPerPage === 0) {
                            $scope.pagedItems[Math.floor(i / $scope.itemsPerPage)] = [ $scope.filteredItems[i] ];
                          } else {
                            $scope.pagedItems[Math.floor(i / $scope.itemsPerPage)].push($scope.filteredItems[i]);
                          }
                        }
                      };

                      /*
                       $scope.deleteItem = function (idx) {
                            var itemToDelete = $scope.pagedItems[$scope.currentPage][idx];
                            var idxInItems = $scope.items.indexOf(itemToDelete);
                            $scope.items.splice(idxInItems,1);
                            $scope.search();
                            
                            return false;
                        };
                      */

                      $scope.range = function (start, end) {
                        var ret = [];
                        if (!end) {
                          end = start;
                          start = 0;
                        }
                        for (var i = start; i < end; i++) {
                          ret.push(i);
                        }
                        return ret;
                      };
                      
                      $scope.prevPage = function () {
                        if ($scope.currentPage > 0) {
                          $scope.currentPage--;
                        }
                      };
                      
                      $scope.nextPage = function () {
                        if ($scope.currentPage < $scope.pagedItems.length - 1) {
                          $scope.currentPage++;
                        }
                      };
                      
                      $scope.setPage = function () {
                        $scope.currentPage = this.n;
                      };
                      
                      // functions have been describe process the data for display
                      $scope.search();
                     
                      
                      // change sorting order
                      $scope.sort_by = function(newSortingOrder) {
                        if ($scope.sortingOrder == newSortingOrder)
                          $scope.reverse = !$scope.reverse;
                        
                        $scope.sortingOrder = newSortingOrder;
                      };
                    // fin 
                });
            },
            function(error){
                $scope.loading = false;
                console.log(error);
            }
        );
    };
})


.directive("fileinput", [function() {
    return {
      $scope: {
        fileinput: "=",
        filepreview: "="
      },
      link: function($scope, element, attributes) {
        element.bind("change", function(changeEvent) {
          $scope.fileinput = changeEvent.target.files[0];
          var reader = new FileReader();
          reader.onload = function(loadEvent) {
            $scope.$apply(function() {
              $scope.filepreview = loadEvent.target.result;
            });
          }
          reader.readAsDataURL($scope.fileinput);
        });
      }
    }
  }]);