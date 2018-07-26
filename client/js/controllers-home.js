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
        $window.open('https://onesignal.com/','_blank');
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
                        $scope.banner = Sponsor.SponsorMeta.banner;
                        var img = document.getElementById('bannerURL');
                        img.src = $scope.banner;
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
            
                        Sponsor.editSponsor($scope.SponsorMeta, $scope.banner, $stateParams.IdSponsor).then(
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
                        Sponsor.submitSponsor($scope.SponsorMeta, $scope.banner).then(
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


    $scope.UploadBanner = function (e, reader, file, fileList, fileOjects, fileObj) {
        var storageRef = firebase.storage().ref();
                var randomvalue = Math.random();
                var ImagenesRef = storageRef.child('home/sponsors/'+ randomvalue).put(file);
                ImagenesRef.on(firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
                  function(snapshot) {
                    // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                    var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                    switch (snapshot.state) {
                      case firebase.storage.TaskState.PAUSED: // or 'paused'
                        console.log('Upload is paused');
                        break;
                      case firebase.storage.TaskState.RUNNING: // or 'running'
                        console.log('Upload is running');
                        break;
                    }
                  }, function(error) {
                  switch (error.code) {
                    case 'storage/unauthorized':
                      // User doesn't have permission to access the object
                      break;

                    case 'storage/canceled':
                      // User canceled the upload
                      break;
                    case 'storage/unknown':
                      // Unknown error occurred, inspect error.serverResponse
                      break;
                  }
                }, function() {
                  // Upload completed successfully, now we can get the download URL
                  $scope.banner = ImagenesRef.snapshot.downloadURL;
                    var img = document.getElementById('bannerURL');
                    img.src = $scope.banner;
                });
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
                        $scope.banner = Destacado.SponsorMeta.banner;
                        var img = document.getElementById('bannerURL');
                        img.src = $scope.banner;
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
            
                        Destacado.editSponsor($scope.SponsorMeta, $scope.banner, $stateParams.IdSponsor).then(
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
                        Destacado.submitSponsor($scope.SponsorMeta, $scope.banner).then(
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

    $scope.UploadBanner = function (e, reader, file, fileList, fileOjects, fileObj) {
        var storageRef = firebase.storage().ref();
                var randomvalue = Math.random();
                var ImagenesRef = storageRef.child('home/destacados/'+ randomvalue).put(file);
                ImagenesRef.on(firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
                  function(snapshot) {
                    // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                    var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                    switch (snapshot.state) {
                      case firebase.storage.TaskState.PAUSED: // or 'paused'
                        console.log('Upload is paused');
                        break;
                      case firebase.storage.TaskState.RUNNING: // or 'running'
                        console.log('Upload is running');
                        break;
                    }
                  }, function(error) {
                  switch (error.code) {
                    case 'storage/unauthorized':
                      // User doesn't have permission to access the object
                      break;

                    case 'storage/canceled':
                      // User canceled the upload
                      break;
                    case 'storage/unknown':
                      // Unknown error occurred, inspect error.serverResponse
                      break;
                  }
                }, function() {
                  // Upload completed successfully, now we can get the download URL
                  $scope.banner = ImagenesRef.snapshot.downloadURL;
                    var img = document.getElementById('bannerURL');
                    img.src = $scope.banner;
                });
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
    $scope.usuarios = [];
    $scope.edades = [];
    $scope.masculino = 0;
    $scope.femenino = 0;
    $scope.na = 0;
    $scope.activada = 0;
    $scope.desactivada = 0;
    $scope.sexo = []
    $scope.sexo_label = ["Masculino","Femenino","Sin Respuesta"]
    $scope.notificaciones = []
    $scope.notificaciones_label = ["Activadas","Desactivada"]

    $scope.getUsuarios = function() {
        UserService.getUsuarios().then(
            function(success){
                $scope.loading = false;
                angular.forEach(success, function(value, key) {
                    console.log(value);
                    if(value.hasOwnProperty('cupones')){
                        var i = 0
                        var j = 0
                        angular.forEach(value.cupones, function(valor, key) {
                            console.log(valor);
                            value.cupones_canjeados = i+1;
                            var timeNow = new Date().getTime();
                            console.log((timeNow-valor.time_generado)/1000/60);
                            if(((timeNow-valor.time_generado)/1000/60)<=4){
                                console.log("Recien genero el cupon");
                                value.cupones_vigentes = j+1;
                            }
                        })
                    }
                    if(value.hasOwnProperty('perfil')){
                        if(value.perfil.hasOwnProperty('nacimiento')){
                            var today = new Date();
                            var birthDate = new Date(value.perfil.nacimiento);
                            var age = today.getFullYear() - birthDate.getFullYear();
                            var m = today.getMonth() - birthDate.getMonth(); 
                            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                                age--;
                            }
                            value.age = age;
                        }else if(value.perfil.hasOwnProperty('birth')){
                            if(value.perfil.birth != ''){
                                var today = new Date();
                                var birthDate = new Date(value.perfil.birth);
                                var age = today.getFullYear() - birthDate.getFullYear();
                                var m = today.getMonth() - birthDate.getMonth(); 
                                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                                    age--;
                                }
                                value.age = age;
                            }else if(value.perfil.hasOwnProperty('edad')){
                                value.age = value.perfil.edad.min;
                            }
                        }

                        if(value.perfil.hasOwnProperty('sexo')){
                            if(value.perfil.sexo == 'Masculino'){
                                $scope.masculino ++;
                                $scope.sexo = [$scope.masculino,$scope.femenino,$scope.na]
                            }else if(value.perfil.sexo == 'Femenino'){
                                $scope.femenino ++;
                                $scope.sexo = [$scope.masculino,$scope.femenino,$scope.na]
                            }else{
                                $scope.na ++;
                                $scope.sexo = [$scope.masculino,$scope.femenino,$scope.na]
                            }
                        }else{
                            $scope.na ++;
                            $scope.sexo = [$scope.masculino,$scope.femenino,$scope.na]
                        }
                        if(value.hasOwnProperty('configuracion.notificaciones')){
                            // Chart para Notificaciones
                            if(value.configuracion.notificaciones.activada == true || value.configuracion.notificaciones.activada == 'true'){
                                $scope.activada ++;
                                $scope.notificaciones = [$scope.activada,$scope.desactivada]
                            }else{
                                $scope.desactivada ++;
                                $scope.notificaciones = [$scope.activada,$scope.desactivada]
                            } 
                        }
                    }

                    $scope.usuarios.push(value);
                })
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
    CentrosComerciales, MultiMarcas, Supermercados, Sponsor, Destacado) {

    $scope.initView = function() {
        $location.hash('page-top');
        $anchorScroll();
        $scope.loading = true;
        $scope.items = [];
        $scope.getComercios();
    };

    $scope.initPromociones = function() {
        $location.hash('page-top');
        $anchorScroll();
        $scope.loading = true;
        $scope.items = [];
        $scope.getComercios2();
    };

    $scope.initSponsor = function() {
        $location.hash('page-top');
        $anchorScroll();
        $scope.loading = true;
        $scope.items = [];
        $scope.getSponsors();
    };

    $scope.initDestacado = function() {
        $location.hash('page-top');
        $anchorScroll();
        $scope.loading = true;
        $scope.items = [];
        $scope.getDestacados();
    };

    $scope.initFavoritas = function() {
        $location.hash('page-top');
        $anchorScroll();
        $scope.loading = true;
        $scope.items = [];
        $scope.getFavoritos();
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
    $scope.getComercios2 = function() {
        console.log("entro");
        MultiMarcas.get().then(
            function(success){
                angular.forEach(success, function(value, key) {
                    angular.forEach(value.promociones, function(valor,key) {
                        valor.categoria = 'Multimarcas'
                        valor.comercio = value.perfil.nombre
                        $scope.items.push(valor);
                    });
                    angular.forEach(value.locales, function(valor,key) {
                        angular.forEach(valor.promociones, function(data,key) {
                            data.categoria = 'Multimarcas'
                            data.comercio = valor.perfil.nombre
                            $scope.items.push(data);
                        });
                    });
                });
            },
            function(error){
                $scope.loading = false;
                console.log(error);
            }
        );
        Supermercados.get().then(
            function(success){
                angular.forEach(success, function(value, key) {
                    angular.forEach(value.promociones, function(valor,key) {
                        valor.categoria = 'Supermercados'
                        valor.comercio = value.perfil.nombre
                        $scope.items.push(valor);
                    });
                    angular.forEach(value.locales, function(valor,key) {
                        angular.forEach(valor.promociones, function(data,key) {
                            data.categoria = 'Supermercados'
                            data.comercio = valor.perfil.nombre
                            $scope.items.push(data);
                        });
                    });
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
                angular.forEach(success, function(value, key) {
                    angular.forEach(value.promociones, function(valor,key) {
                        console.log(valor);
                        valor.categoria = 'Shoppings'
                        valor.comercio = value.perfil.nombre
                        $scope.items.push(valor);
                    });
                    angular.forEach(value.locales, function(valor,key) {
                        console.log(valor);
                        angular.forEach(valor.promociones, function(data,key) {
                            console.log(data);
                            data.categoria = 'Shoppings'
                            data.comercio = valor.perfil.nombre
                            $scope.items.push(data);
                        });
                    });

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
    // Funcion para Cargar el listado de Sponsors
    $scope.getSponsors = function(){
        Sponsor.get().then(
            function(success){
                if(Sponsor.all != null) {
                    $scope.loading = false;
                    angular.forEach(success, function(value, key) {
                        console.log(value);
                        $scope.items.push(value);
                    })

                    // init
                      $scope.sortingOrder = 'clicks';
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

                }
            },
            function(error){
                console.log(error);
                $scope.cargando = true;
                $scope.mensaje =  "Hubo un error..."
            }
        );
    };

    $scope.getDestacados = function(){
        $scope.cargando = true;
        Destacado.get().then(
            function(success){
                if(Destacado.all != null) {
                    $scope.loading = false;
                    angular.forEach(success, function(value, key) {
                        console.log(value);
                        $scope.items.push(value);
                    })

                    // init
                      $scope.sortingOrder = 'clicks';
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
                }
            },
            function(error){
                console.log(error);
                $scope.cargando = true;
                $scope.mensaje =  "Hubo un error..."
            }
        );
    };


    $scope.getFavoritos = function() {
        console.log("entro");
        MultiMarcas.get().then(
            function(success){
                console.log(success);
                angular.forEach(success, function(value, key) {
                    angular.forEach(value.locales, function(valor) {
                        var i =0;
                        angular.forEach(valor.estadisticas.favoritos, function(data) {
                            if(data.fav == true){
                                i++;
                            }
                        })
                            valor.categoria = 'Multimarcas'
                            valor.cantidad = i;
                            $scope.items.push(valor);
                    });

                    var j =0;
                    angular.forEach(value.estadisticas.favoritos, function(data) {
                        if(data.fav == true){
                            j++;
                        }
                    })
                    value.categoria = 'Multimarcas'
                    value.cantidad = j;
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
                        var i =0;
                        angular.forEach(valor.estadisticas.favoritos, function(data) {
                            if(data.fav == true){
                                i++;
                            }
                        })
                            valor.categoria = 'Supermercados'
                            valor.cantidad = i;
                            $scope.items.push(valor);
                    });

                    var j =0;
                    angular.forEach(value.estadisticas.favoritos, function(data) {
                        if(data.fav == true){
                            j++;
                        }
                    })
                    value.categoria = 'Supermercados'
                    value.cantidad = j;
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
                        var i =0;
                        angular.forEach(valor.estadisticas.favoritos, function(data) {
                            if(data.fav == true){
                                i++;
                            }
                        })
                            valor.categoria = 'Shoppings'
                            valor.cantidad = i;
                            $scope.items.push(valor);
                    });

                    var j =0;
                    angular.forEach(value.estadisticas.favoritos, function(data) {
                        if(data.fav == true){
                            j++;
                        }
                    })
                    value.categoria = 'Shoppings'
                    value.cantidad = j;
                    $scope.items.push(value);

                    // init
                      $scope.sortingOrder = '-cantidad';
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