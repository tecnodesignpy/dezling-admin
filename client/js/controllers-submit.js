angular.module('noodlio.controllers-submit', ['ui-leaflet'])
// Controladores para hacer Submit de los distintos formularios en categorias, locales, promociones, beneficios y otros

/*
    SHOPPINGS
*/
.controller('SubmitCentros', function($scope,
    $state, $timeout, $location, $anchorScroll, $stateParams,
    Auth, Products, Utils, CentrosService, $log) {

    // controller variables
    var submit = this;
    var currentProductId = null;   
    
    // init variables 
    submit.status = {
        editMode: false,
        submitLoading: false,
        generalView: 'loading',
        containsNoError: true,
        loadingScreenshots: false,
        loadingCategories: true,
    };
    submit.AuthData         = Auth.AuthData;
    submit.ProductMeta      = {};
    submit.ProductImages    = {};
    submit.ErrorMessages    = {};
    submit.IndexData        = {};

    /* 
        Funcion para hacer Drag en el mapa
    */
        var mainMarker = {
                    lat: -25.342132,
                    lng: -57.556246,
                    focus: true,
                    //message: "Hey, drag me if you want",
                    draggable: true
                };

        angular.extend($scope, {
            london: {
                lat: -25.342132,
                lng: -57.556246,
                zoom: 15
            },
            markers: {
                mainMarker: angular.copy(mainMarker)
            },
            position: {
                lat: -25.3313193,
                lng: -57.5719568
            },
            events: { // or just {} //all events
                markers:{
                  enable: [ 'dragend' ]
                  //logic: 'emit'
                }
            },
            defaults: {
                scrollWheelZoom: false
            },
            layers: {
                baselayers: {
                    googleTerrain: {
                        name: 'Google Terrain',
                        layerType: 'TERRAIN',
                        type: 'google'
                    },
                }
            }
        });

        $scope.$on("leafletDirectiveMarker.dragend", function(event, args){
            document.getElementById("mapa.latitud").value = args.model.lat;
            document.getElementById("mapa.longitud").value = args.model.lng;
            submit.ProductMeta.perfil.mapa.latitud = args.model.lat
            submit.ProductMeta.perfil.mapa.longitud = args.model.lng
            console.log($scope.london.lat);
            console.log($scope.london.lng);
        });

    /* 
        FIN Funcion para hacer Drag en el mapa
    */

    // Iniciamos la funcion para redireccion la vista, ya sea un nuevo Centro Comercial o para editar uno ya existente
    submit.initView = function() {

        //Recibimos el parametro productId, que seria el slug del Centro Comercial
        currentProductId = $stateParams.productId;
        $scope.slug = currentProductId;

        //Llamamos a la funcion para redireccion la vista
        redirectView();
        
        $location.hash('page-top');
        $anchorScroll();
    };

    // Iniciamos la funcion para redireccionar la vista de las promociones, ya sea para agregar uno nuevo o editar alguna promocion existente
    submit.initPromociones = function() {
        /*
            Recibimos los parametros :shopping y :promo
            - Shopping es obligatorio, si no le pasamos el parametro no va a poder agregar ninguna nueva promocion, y mucho menos editar
            - Promo es para editar las promociones ya existentes, al pasar la variable promo obligatoriamente se debe pasar la variable :shopping
        */
        $scope.shopping = $stateParams.shopping;
        $scope.promo = $stateParams.promo;

        //Llamamos a la funcion para redireccionar la vista
        redirectViewPromociones();
        //loadCategories();
        
        $location.hash('page-top');
        $anchorScroll();
    };

    
    /*
        Funcion para redireccion
        - Tenemos en cuenta si esta autenticado algun usuario como para poder hacer el cambio, en este caso deben ser solo los administradores
        - Verificamos que se pase el slug del Centro comercial
     */
    function redirectView() {
        if(submit.AuthData.hasOwnProperty('uid')){
            if(currentProductId != undefined && currentProductId != null && currentProductId != "") {

                Products.getProductMeta(currentProductId).then(
                    function(ProductMeta){
                        if(ProductMeta != null) {
                            submit.ProductMeta = ProductMeta;
                            if(ProductMeta.perfil.mapa.latitud != 0 && ProductMeta.perfil.mapa.longitud != 0){
                                setTimeout(function(){
                                    $scope.lat = ProductMeta.perfil.mapa.latitud;
                                    $scope.lng = ProductMeta.perfil.mapa.longitud;
                                    var mainMarker = {
                                        lat: $scope.lat,
                                        lng: $scope.lng,
                                        focus: true,
                                        //message: "Hey, drag me if you want",
                                        draggable: true
                                    };

                                    angular.extend($scope, {
                                        london: {
                                            lat: $scope.lat,
                                            lng: $scope.lng,
                                            zoom: 15
                                        },
                                        markers: {
                                            mainMarker: angular.copy(mainMarker)
                                        },
                                        position: {
                                            lat: $scope.lat,
                                            lng: $scope.lng
                                        },
                                        events: { // or just {} //all events
                                            markers:{
                                              enable: [ 'dragend' ]
                                              //logic: 'emit'
                                            }
                                        },
                                        layers: {
                                            baselayers: {
                                                googleTerrain: {
                                                    name: 'Google Terrain',
                                                    layerType: 'TERRAIN',
                                                    type: 'google'
                                                },
                                            }
                                        }
                                    });


                                    $scope.$apply();
                                }, 0);  
                            }
                            //render_mapa("editar",ProductMeta);

                            initEditMode();  
                        } else {
                            currentProductId = null;
                            initNewSubmission();    // Error tecnico, entonces le damos la opcion de crear un nuevo Objeto
                        };
                    },
                    function(error){
                        console.log('e1', error);
                        initError();
                    }
                )
            } else {
                initNewSubmission();
            };
        } else {
            console.log('e2');
            initError();
        };
        
        // stateA - new
        function initNewSubmission() {
            //render_mapa("nuevo");
            submit.status["generalView"]    = "new";
            submit.status["editMode"]       = false;
            currentProductId                = null; 
            
            // 
            submit.ProductMeta = {
                userId: submit.AuthData.uid
            };
            
            submit.status['loadingScreenshots'] = false
    
        };
        
        // stateB - edit mode
        function initEditMode() {   
            
            //console.log("edit submission")
            submit.status["generalView"]    = "edit";
            submit.status["editMode"]       = true;
            
            // -->
            if(submit.ProductMeta.hasOwnProperty('discount_date_end')) {
                submit.ProductMeta["discount_date_end_raw"] = new Date(submit.ProductMeta["discount_date_end"]);
            };
            
            // -->
            getIndexValues()
            
            // -->
            loadScreenshots();
            loadIcono();
            loadBanners();
            loadMapa();
        };
        
        // stateB - something went wrong
        function initError() {
            submit.status["generalView"] = "error";     //console.log("error")
            $state.go('admin.home');
        };
        
    };
    function redirectViewPromociones() {
        if(submit.AuthData.hasOwnProperty('uid')){
            if($scope.promo != undefined && $scope.promo != null && $scope.promo != "") {
                
                
                // load product
                Products.getPromoMeta($scope.shopping,$scope.promo).then(
                    function(PromocionMeta){
                        if(PromocionMeta != null) {
                            submit.PromocionMeta = PromocionMeta;   // bind the data
                            initEditMode();  
                        } else {
                            $scope.shopping = null;
                            initNewSubmission();    // technically an error
                        };
                    },
                    function(error){
                        console.log('e1', error);
                        initError();
                    }
                )
            } else {
                initNewSubmission();
            };
        } else {
            console.log('e2');
            initError();
        };
        
        // stateA - new
        function initNewSubmission() {
            
            submit.status["generalView"]    = "new";
            submit.status["editMode"]       = false;
            
            // 
            submit.PromocionMeta = {
                userId: submit.AuthData.uid
            };
            
            submit.status['loadingScreenshots'] = false
    
        };
        
        // stateB - edit mode
        function initEditMode() {                       //console.log("edit submission")
            submit.status["generalView"]    = "edit";
            submit.status["editMode"]       = true;
            
            /*
            if(submit.PromocionMeta.hasOwnProperty('fechafin')) {
                submit.PromocionMeta["fechafin"] = new Date(submit.PromocionMeta["fechafin"]);
            };
            if(submit.PromocionMeta.hasOwnProperty('fechainicio')) {
                submit.PromocionMeta["fechainicio"] = new Date(submit.PromocionMeta["fechainicio"]);
            };
            */
        };
        
        // stateB - something went wrong
        function initError() {
            submit.status["generalView"] = "error";     //console.log("error")
            $state.go('admin.home');
        };
        
    };
    
    /*
        Cargamos las Imagenes
    */
    function loadScreenshots() {
        CentrosService.getProductScreenshots(currentProductId).then(
            function(ScreenshotsData){

                $scope.avatarURL= ScreenshotsData;
                var img = document.getElementById('avatarURL');
                img.src = $scope.avatarURL;
            },
            function(error){
                submit.status["generalView"] = "error";
            }
        );
    };
    function loadIcono() {
        CentrosService.getIcono(currentProductId).then(
            function(ScreenshotsData){

                $scope.iconoURL= ScreenshotsData;
                var img = document.getElementById('iconoURL');
                img.src = $scope.iconoURL;
            },
            function(error){
                submit.status["generalView"] = "error";
            }
        );
    };
    function loadMapa() {
        CentrosService.getMapa(currentProductId).then(
            function(ScreenshotsData){

                $scope.mapa_complejoURL= ScreenshotsData;
                var img = document.getElementById('mapa_complejoURL');
                img.src = $scope.mapa_complejoURL;
            },
            function(error){
                submit.status["generalView"] = "error";
            }
        );
    };
    function loadBanners() {
        CentrosService.getBanner1(currentProductId).then(
            function(ScreenshotsData){

                $scope.banner1= ScreenshotsData;
                var img = document.getElementById('banner1URL');
                img.src = $scope.banner1;
            },
            function(error){
                submit.status["generalView"] = "error";
            }
        );
        CentrosService.getBanner2(currentProductId).then(
            function(ScreenshotsData){

                $scope.banner2= ScreenshotsData;
                var img = document.getElementById('banner2URL');
                img.src = $scope.banner2;
            },
            function(error){
                submit.status["generalView"] = "error";
            }
        );
        CentrosService.getBanner3(currentProductId).then(
            function(ScreenshotsData){

                $scope.banner3= ScreenshotsData;
                var img = document.getElementById('banner3URL');
                img.src = $scope.banner3;
            },
            function(error){
                submit.status["generalView"] = "error";
            }
        );
    };
    
    // fn index values (inventory_count)
    function getIndexValues() {
        Products.getIndexValues(currentProductId).then(
            function(IndexValues){
                submit.IndexData = IndexValues;
            },
            function(error){
                console.log(error)
            }
        )
    };
    

    /**
     * Validamos el formulario y enviamos la promocion, ya sea uno nuevo o editamos uno ya existente
     */
    submit.status['submitLoading'] = false;
    submit.submitFormPromociones = function() {
        
        // prepare
        scrollToSubmitEnd(); 
        
        
        
            switch (submit.status['editMode']) {
                case true:
                    //// validate
                    if(validarPromocion()){
                        
                        // referential
                        //addReferentialData();
                        
                        // psubmit
                        submit.status['submitLoading']      = true;
            
                        CentrosService.editPromocion(submit.PromocionMeta, Auth.AuthData, $scope.shopping, $scope.promo).then(
                            function(success){
                                handleSuccess();
                            },
                            function(error){
                                handleError(error)
                            }
                        );
                        break
                    };
                case false:
                    //// validate
                    if(validarPromocion()){
                        
                        // referential
                        //addReferentialData();
                        
                        // psubmit
                        submit.status['submitLoading']      = true;
                        //
                        CentrosService.submitPromocion(submit.PromocionMeta, Auth.AuthData, $scope.shopping).then(
                            function(success){
                                handleSuccess();
                            },
                            function(error){
                                handleError(error)
                            }
                        );
                        break
                    };
            } // ./ switch
            
        
        // fn error
        function handleError(error) {
            submit.status['submitLoading']      = false;
            submit.status['containsNoError']    = false;
            submit.ErrorMessages['general']     = "Ooops hubo un problema ... " + error;
        };
        
        // fn success
        function handleSuccess() {
            submit.status['submitLoading']      = false;
            submit.status['containsNoError']    = false;
            $state.go('admin.categories-centros_comerciales');
        };
        
    };    
    
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    
    /**
     * Validate and Submit the form with ProductMeta
     */
    submit.status['submitLoading'] = false;
    submit.submitForm = function() {
        
        // prepare
        scrollToSubmitEnd();
        console.log(submit.status['editMode']);
        
        
        
            
        
        
        
            if(submit.status['editMode']) {
                    //// validate
                    if(validarEdicion()){
                        
                        // referential
                        //addReferentialData();
                        
                        // psubmit
                        submit.status['submitLoading']      = true;
            
                        CentrosService.editProduct(submit.ProductMeta, $scope.avatarURL, Auth.AuthData, currentProductId, $scope.banner1, $scope.banner2, $scope.banner3, $scope.iconoURL, $scope.mapa_complejoURL).then(
                            function(success){
                                handleSuccess();
                            },
                            function(error){
                                handleError(error)
                            }
                        );
                    }
            }else{
                    //// validate
                    if(validateProductMeta()){
                        
                        // referential
                        //addReferentialData();
                        
                        // psubmit
                        submit.status['submitLoading']      = true;
                        //
                        CentrosService.submitProduct(submit.ProductMeta, $scope.avatarURL, Auth.AuthData).then(
                            function(){
                                handleSuccess();
                            },
                            function(error){
                                handleError(error)
                            }
                        );
                    };
            }; // ./ switch
            
        
        // fn error
        function handleError(error) {
            submit.status['submitLoading']      = false;
            submit.status['containsNoError']    = false;
            submit.ErrorMessages['general']     = "Ooops hubo un problema ... " + error;
        };
        
        // fn success
        function handleSuccess() {
            submit.status['submitLoading']      = false;
            submit.status['containsNoError']    = false;
            $state.go('admin.categories-centros_comerciales');
        };
        
    };
    
  
    /**
     * Used for filtering
     * *** put this on the SERVER
     */
    function addReferentialData() {
        // server values firebase
        submit.ProductMeta["timestamp_update"] = firebase.database.ServerValue.TIMESTAMP;
        if(!submit.ProductMeta.hasOwnProperty('timestamp_creation')) {
            submit.ProductMeta["timestamp_creation"] = firebase.database.ServerValue.TIMESTAMP;
        };
        
        // transform to timestamp
        if(submit.ProductMeta["discount_date_end_raw"]) {
            submit.ProductMeta["discount_date_end"] = submit.ProductMeta["discount_date_end_raw"].getTime();
        };

    };
    

    /**
     * 
     * Base 64 File Upload
     * *** Redo to one function
     * 
     */
    submit.dimensions = {
        screenshot: {
            w: 400,
            h: 400
        }
    };

    
    // screenshots
    var ProductImagesArray = [];
    submit.avatar = function (e, reader, file, fileList, fileOjects, fileObj) {
        var storageRef = firebase.storage().ref();
                var ImagenesRef = storageRef.child('avatar/'+ currentProductId).put(file);
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
                  $scope.avatarURL = ImagenesRef.snapshot.downloadURL;
                    var img = document.getElementById('avatarURL');
                    img.src = $scope.avatarURL;
                });
    };
    submit.icono = function (e, reader, file, fileList, fileOjects, fileObj) {
        var storageRef = firebase.storage().ref();
                var ImagenesRef = storageRef.child('icono/'+ currentProductId).put(file);
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
                  $scope.iconoURL = ImagenesRef.snapshot.downloadURL;
                    var img = document.getElementById('iconoURL');
                    img.src = $scope.iconoURL;
                });
    };
    submit.mapa_complejo = function (e, reader, file, fileList, fileOjects, fileObj) {
        var storageRef = firebase.storage().ref();
                var ImagenesRef = storageRef.child('mapa_complejo/'+ currentProductId).put(file);
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
                  $scope.mapa_complejoURL = ImagenesRef.snapshot.downloadURL;
                    var img = document.getElementById('mapa_complejoURL');
                    img.src = $scope.mapa_complejoURL;
                });
    };
    submit.banner1 = function (e, reader, file, fileList, fileOjects, fileObj) {
        var storageRef = firebase.storage().ref();
                var ImagenesRef = storageRef.child('destacados/'+ currentProductId +'/banner1').put(file);
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
                  $scope.banner1 = ImagenesRef.snapshot.downloadURL;
                    var img = document.getElementById('banner1URL');
                    img.src = $scope.banner1;
                });
    };
    submit.banner2 = function (e, reader, file, fileList, fileOjects, fileObj) {
        var storageRef = firebase.storage().ref();
                var ImagenesRef = storageRef.child('destacados/'+ currentProductId +'/banner2').put(file);
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
                  $scope.banner2 = ImagenesRef.snapshot.downloadURL;
                    var img = document.getElementById('banner2URL');
                    img.src = $scope.banner2;
                });
    };
    submit.banner3 = function (e, reader, file, fileList, fileOjects, fileObj) {
        var storageRef = firebase.storage().ref();
                var ImagenesRef = storageRef.child('destacados/'+ currentProductId +'/banner3').put(file);
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
                  $scope.banner3 = ImagenesRef.snapshot.downloadURL;
                    var img = document.getElementById('banner3URL');
                    img.src = $scope.banner3;
                });
    };
    
    submit.EliminarImagen = function(carpeta,key){
        console.log(carpeta);
        console.log(key);
    };
    
    submit.Eliminar = function(categoria, key){
        swal({
          title: "Desea eliminar el Comercio?",
          text: "Ya no se va a poder recuperar el Comercio.",
          icon: "warning", 
          buttons: ["Cancelar", "Eliminar"],
          dangerMode: true,
        })
        .then((willDelete) => {
          if (willDelete) {
            console.log(key);
            switch (categoria) {
                    case 'centros_comerciales':
                        CentrosService.eliminarComercio(key).then(function(success){
                            console.log(success);
                            submit.goTo('admin.categories-centros_comerciales');
                            swal("Eliminado con exito", {
                              icon: "success", 
                            });
                        }, function(error){
                            console.log(error);
                            submit.goTo('admin.categories-centros_comerciales');
                            swal("No se ha eliminado", {
                              icon: "danger", 
                            });
                        });
                        break
            }
          }
        });
    };
    
    // takes ProductImagesArray and sets in ProductsImages  
    function transformArrayToScreenshot() {
      submit.ProductImages = {};
      for (var i = 0; i<ProductImagesArray.length; i++) {
          var iter = i+1;
          submit.ProductImages['screenshot' + iter] = ProductImagesArray[i];
      }
    };
    
    function initProductArray() {
        var iter = 0;
        angular.forEach(submit.ProductImages, function(value, key){
            if(key != 'icon') {
                ProductImagesArray[iter] = value;
                iter = iter+1; 
            }
        })
    };
    
    
    // handling 
    // v2
    function processScreenshotsData(ScreenshotsData) {
        submit.ProductImages = ScreenshotsData;
        initProductArray();
        submit.status['loadingScreenshots'] = false;
    };
    
    
    // -------------------------------------------------------------------------
    // Attributes
    submit.addAttributeType = function() {
        var aType = submit.status.newAttributeType;
        console.log('adding type', aType)
        if(aType) {
            if(submit.ProductMeta.hasOwnProperty('attributes')){
                submit.ProductMeta['attributes'][aType] = {}
            } else {
                var tempObj = {};
                tempObj[submit.status.newAttributeType] = {};
                submit.ProductMeta['attributes'] = tempObj;
            }
        }
        console.log(submit.ProductMeta['attributes'])
    };
    submit.deleteAttributeType = function(aType) {
        delete submit.ProductMeta['attributes'][aType]
    };
    
    submit.addAttributeValue = function() {
        var aValue = submit.status.newAttributeValue;
        var aType = submit.status.selectedAttributeType;
        console.log('adding value', aValue, aType)
        if(aValue && aType) {
            submit.ProductMeta['attributes'][aType][aValue] = true;
        };
    };
    
    submit.deleteAttributeValue = function(aType, aValue) {
        delete submit.ProductMeta['attributes'][aType][aValue];
    };
    
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    
    
    /**
     * Other helpers and buttons
     */
    function scrollToSubmitEnd() {
        $location.hash('submit0');
        $anchorScroll.yOffset = 100;
        $anchorScroll();
    };
    
    // -------------------------------------------------------------------------
    // navigation wise 
    
    submit.goTo = function(nextState) {
        $state.go(nextState);
    };
    
    // -------------------------------------------------------------------------
    // Validate submitform
    
    function validarPromocion() {
        submit.ErrorMessages = {};
        submit.status['containsNoError'] = true;

        //
        // Titulo
        var titulo = document.getElementById("titulo").value;
        if( titulo== "" || 
            titulo == null ||
            titulo == undefined){
            submit.ErrorMessages["titulo"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["titulo"] =  "";
        }

        //
        // Descripcion
        var descripcion = document.getElementById("descripcion").value;
        if( descripcion== "" || 
            descripcion == null ||
            descripcion == undefined){
            submit.ErrorMessages["descripcion"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["descripcion"] =  "";
        }

        //
        // Fecha Inicio
        var fecha_inicio = document.getElementById("fecha_inicio").value;
        if( fecha_inicio== "" || 
            fecha_inicio == null ||
            fecha_inicio == undefined){
            submit.ErrorMessages["fecha_inicio"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["fecha_inicio"] =  "";
        }

        //
        // Fecha Fin
        var fecha_fin = document.getElementById("fecha_fin").value;
        if( fecha_fin== "" || 
            fecha_fin == null ||
            fecha_fin == undefined){
            submit.ErrorMessages["fecha_fin"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["fecha_fin"] =  "";
        }

        //
        // Categoria
        var categoria = document.getElementById("categoria").value;
        if( categoria== "" || 
            categoria == null ||
            categoria == undefined){
            submit.ErrorMessages["categoria"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["categoria"] =  "";
        }
        //
        // generic
        if (!submit.status['containsNoError']) {
            submit.status['submitLoading'] = false;
            submit.ErrorMessages['general'] = 
            "Hay campos que deben ser completados";
        };


        return submit.status['containsNoError'];
    };

    
    function validarEdicion() {
        submit.ErrorMessages = {};
        submit.status['containsNoError'] = true;

        //
        // Nombre del Comercio
        var nombre = document.getElementById("nombre").value;
        if( nombre== "" || 
            nombre == null ||
            nombre == undefined){
            submit.ErrorMessages["nombre"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["nombre"] =  "";
        }

        //
        // Email
        var email = document.getElementById("email").value;
        if( email== "" || 
            email == null ||
            email == undefined){
            submit.ErrorMessages["email"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["email"] =  "";
        }

        //
        // Telefono
        var telefono = document.getElementById("telefono").value;
        if( telefono== "" || 
            telefono == null ||
            telefono == undefined){
            submit.ErrorMessages["telefono"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["telefono"] =  "";
        }

        //
        // generic
        if (!submit.status['containsNoError']) {
            submit.status['submitLoading'] = false;
            submit.ErrorMessages['general'] = 
            "Hay campos que deben ser completados";
        };


        return submit.status['containsNoError'];
    };


    function validateProductMeta() {
        submit.ErrorMessages = {};
        submit.status['containsNoError'] = true;

        //
        // Nombre del Comercio
        var nombre = document.getElementById("nombre").value;
        if( nombre== "" || 
            nombre == null ||
            nombre == undefined){
            submit.ErrorMessages["nombre"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["nombre"] =  "";
        }

        //
        // Slug
        var slug = document.getElementById("slug").value;
        if( slug== "" || 
            slug == null ||
            slug == undefined){
            submit.ErrorMessages["slug"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["slug"] =  "";
        }

        //
        // Email
        var email = document.getElementById("email").value;
        if( email== "" || 
            email == null ||
            email == undefined){
            submit.ErrorMessages["email"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["email"] =  "";
        }

        //
        // Telefono
        var telefono = document.getElementById("telefono").value;
        if( telefono== "" || 
            telefono == null ||
            telefono == undefined){
            submit.ErrorMessages["telefono"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["telefono"] =  "";
        }

        //
        // generic
        if (!submit.status['containsNoError']) {
            submit.status['submitLoading'] = false;
            submit.ErrorMessages['general'] = 
            "Hay campos que deben ser completados";
        };


        return submit.status['containsNoError'];
    };     
})

.controller('SubmitCentrosLocales', function($scope,
    $state, $timeout, $location, $anchorScroll, $stateParams,
    Auth, Utils, CentrosLocalService) {
        
    // controller variables
    var submit = this;
    var currentProductId = null;   
    
    // init variables 
    submit.status = {
        editMode: false,
        submitLoading: false,
        generalView: 'loading',
        containsNoError: true,
        loadingScreenshots: true,
        loadingCategories: true,
    };
    submit.AuthData         = Auth.AuthData;
    submit.ProductMeta      = {};
    submit.ProductImages    = {};
    submit.ErrorMessages    = {};
    submit.IndexData        = {};

    // init the dependencies on load
    submit.initView = function() {
        
        local = $stateParams.localId;
        comercio = $stateParams.CentroComercial;
        
        submit.local = $stateParams.localId;
        submit.comercio = $stateParams.CentroComercial;
        redirectView();
        //loadCategories();
        
        $location.hash('page-top');
        $anchorScroll();
    };
    
    submit.Eliminar = function(categoria, shopping, local){
        swal({
          title: "Desea eliminar el Local?",
          text: "Ya no se va a poder recuperar el Local.",
          icon: "warning", 
          buttons: ["Cancelar", "Eliminar"],
          dangerMode: true,
        })
        .then((willDelete) => {
          if (willDelete) {
            console.log(categoria, shopping, local);
            
            switch (categoria) {
                    case 'centros_comerciales_locales':
                        CentrosLocalService.eliminarLocal(shopping, local).then(function(success){
                            console.log(success);
                            submit.goTocomercio();
                            swal("Eliminado con exito", {
                              icon: "success", 
                            });
                        }, function(error){
                            console.log(error);
                            submit.goTocomercio();
                            swal("No se ha eliminado", {
                              icon: "danger", 
                            });
                        });
                        break
            }
          }
        });
    };

    // Iniciamos la funcion para redireccionar la vista de las promociones, ya sea para agregar uno nuevo o editar alguna promocion existente
    submit.initPromociones = function() {
        /*
            Recibimos los parametros :shopping y :promo
            - Shopping es obligatorio, si no le pasamos el parametro no va a poder agregar ninguna nueva promocion, y mucho menos editar
            - Promo es para editar las promociones ya existentes, al pasar la variable promo obligatoriamente se debe pasar la variable :shopping
        */
        $scope.shopping = $stateParams.shopping;
        $scope.promo = $stateParams.promo;
        $scope.local = $stateParams.localId;

        //Llamamos a la funcion para redireccionar la vista
        redirectViewPromociones();
        //loadCategories();
        
        $location.hash('page-top');
        $anchorScroll();
    };

    
    submit.goTocomercio = function() {
        $state.go('admin.Locales',{CentroComercial:submit.comercio})
    };

    
    submit.IrAlShopping = function() {
        $state.go('admin.Locales',{CentroComercial:$scope.shopping})
    };


    function redirectViewPromociones() {
        if(submit.AuthData.hasOwnProperty('uid')){
            if($scope.promo != undefined && $scope.promo != null && $scope.promo != "") {
                
                
                // load product
                CentrosLocalService.getPromoMeta($scope.shopping,$scope.local,$scope.promo).then(
                    function(PromocionMeta){
                        if(PromocionMeta != null) {
                            submit.PromocionMeta = PromocionMeta;   // bind the data
                            initEditMode();  
                        } else {
                            $scope.shopping = null;
                            initNewSubmission();    // technically an error
                        };
                    },
                    function(error){
                        console.log('e1', error);
                        initError();
                    }
                )
            } else {
                initNewSubmission();
            };
        } else {
            console.log('e2');
            initError();
        };
        
        // stateA - new
        function initNewSubmission() {
            
            submit.status["generalView"]    = "new";
            submit.status["editMode"]       = false;
            
            // 
            submit.PromocionMeta = {
                userId: submit.AuthData.uid
            };
            
            submit.status['loadingScreenshots'] = false
    
        };
        
        // stateB - edit mode
        function initEditMode() {                       //console.log("edit submission")
            submit.status["generalView"]    = "edit";
            submit.status["editMode"]       = true;
            
            /*
            if(submit.PromocionMeta.hasOwnProperty('fechafin')) {
                submit.PromocionMeta["fechafin"] = new Date(submit.PromocionMeta["fechafin"]);
            };
            if(submit.PromocionMeta.hasOwnProperty('fechainicio')) {
                submit.PromocionMeta["fechainicio"] = new Date(submit.PromocionMeta["fechainicio"]);
            };
            */
            // -->
            //getIndexValues()
            
            // -->
            //loadScreenshots();
        };
        
        // stateB - something went wrong
        function initError() {
            submit.status["generalView"] = "error";     //console.log("error")
            $state.go('admin.home');
        };
        
    };

    

    /**
     * Validamos el formulario y enviamos la promocion, ya sea uno nuevo o editamos uno ya existente
     */
    submit.status['submitLoading'] = false;
    submit.submitFormPromociones = function() {
        
        // prepare
        scrollToSubmitEnd(); 
        
        
        
            switch (submit.status['editMode']) {
                case true:
                    //// validate
                    if(validarPromocion()){
                        
                        // referential
                        //addReferentialData();
                        
                        // psubmit
                        submit.status['submitLoading']      = true;
            
                        CentrosLocalService.editPromocion(submit.PromocionMeta, Auth.AuthData, $scope.shopping, $scope.local, $scope.promo).then(
                            function(success){
                                handleSuccess();
                            },
                            function(error){
                                handleError(error)
                            }
                        );
                        break
                    };
                case false:
                    //// validate
                    if(validarPromocion()){
                        
                        // referential
                        //addReferentialData();
                        
                        // psubmit
                        submit.status['submitLoading']      = true;
                        //
                        CentrosLocalService.submitPromocion(submit.PromocionMeta, Auth.AuthData, $scope.shopping, $scope.local).then(
                            function(success){
                                handleSuccess();
                            },
                            function(error){
                                handleError(error)
                            }
                        );
                        break
                    };
            } // ./ switch
            
        
        // fn error
        function handleError(error) {
            submit.status['submitLoading']      = false;
            submit.status['containsNoError']    = false;
            submit.ErrorMessages['general']     = "Ooops hubo un problema ... " + error;
        };
        
        // fn success
        function handleSuccess() {
            submit.status['submitLoading']      = false;
            submit.status['containsNoError']    = false;
            $state.go('admin.categories-centros_comerciales');
        };
        
    };
    /**
     * Edit mode verification and redirection:
     * - is it in the edit mode?
     * - does product excist?
     * - does author have the right to edit?
     * - submit with new productId or existing
     */
    function redirectView() {
        console.log("Redirecciona a Editar o Nuevo Local Shopping");
        if(submit.AuthData.hasOwnProperty('uid')){
            if(local != undefined && local != null && local != "") {
                
                
                // load product
                CentrosLocalService.getProductMeta(comercio,local).then(
                    function(ProductMeta){
                        if(ProductMeta != null) {
                            submit.ProductMeta = ProductMeta;   // bind the data
                            initEditMode();  
                        } else {
                            local = null;
                            initNewSubmission();    // technically an error
                        };
                    },
                    function(error){
                        console.log('e1', error);
                        initError();
                    }
                )
            } else {
                initNewSubmission();
            };
        } else {
            console.log('e2');
            initError();
        };
        
        // stateA - new
        function initNewSubmission() {
            
            submit.status["generalView"]    = "new";
            submit.status["editMode"]       = false;
            local                           = null; 
            
            // 
            submit.ProductMeta = {
                userId: submit.AuthData.uid
            };
            
            submit.status['loadingScreenshots'] = false
    
        };
        
        // stateB - edit mode
        function initEditMode() {                       //console.log("edit submission")
            submit.status["generalView"]    = "edit";
            submit.status["editMode"]       = true;

            // -->
            loadScreenshots();
            loadIcono();
            loadBanners();
        };
        
        // stateB - something went wrong
        function initError() {
            submit.status["generalView"] = "error";     //console.log("error")
            $state.go('admin.home');
        };
        
    };

    /*
        Cargamos las Imagenes
    */
    function loadScreenshots() {
        CentrosLocalService.getProductScreenshots(comercio,local).then(
            function(ScreenshotsData){

                $scope.avatarURL= ScreenshotsData;
                var img = document.getElementById('avatarURL');
                img.src = $scope.avatarURL;
            },
            function(error){
                submit.status["generalView"] = "error";
            }
        );
    };
    function loadIcono() {
        CentrosLocalService.getIcono(comercio,local).then(
            function(ScreenshotsData){
                console.log("Icono" + ScreenshotsData);

                $scope.iconoURL= ScreenshotsData;
                var img = document.getElementById('iconoURL');
                img.src = $scope.iconoURL;
            },
            function(error){
                submit.status["generalView"] = "error";
            }
        );
    };

    function loadBanners() {
        CentrosLocalService.getBanner1(comercio,local).then(
            function(ScreenshotsData){

                $scope.banner1= ScreenshotsData;
                var img = document.getElementById('banner1URL');
                img.src = $scope.banner1;
            },
            function(error){
                submit.status["generalView"] = "error";
            }
        );
        CentrosLocalService.getBanner2(comercio,local).then(
            function(ScreenshotsData){

                $scope.banner2= ScreenshotsData;
                var img = document.getElementById('banner2URL');
                img.src = $scope.banner2;
            },
            function(error){
                submit.status["generalView"] = "error";
            }
        );
        CentrosLocalService.getBanner3(comercio,local).then(
            function(ScreenshotsData){

                $scope.banner3= ScreenshotsData;
                var img = document.getElementById('banner3URL');
                img.src = $scope.banner3;
            },
            function(error){
                submit.status["generalView"] = "error";
            }
        );
    };
    
    
    // fn index values (inventory_count)
    function getIndexValues() {
        CentrosLocalService.getIndexValues(local).then(
            function(IndexValues){
                submit.IndexData = IndexValues;
            },
            function(error){
                console.log(error)
            }
        )
    };
    
    
    // -------------------------------------------------------------------------
    submit.simulateSubmit = function() {
        
        submit.ProductMeta = {
            'categoryId': 'first',
            'tagsString': 'semin, test, hello',
            'title': 'Hello world',
            'price': 5,
            'userId': submit.AuthData.uid,
            'discount_date_end_raw': new Date("February 27, 2016 11:13:00"),
            'discount_perc': 50,
        };
        submit.OtherData = {
            'inventory_nb_items': 14
        }
        
        //submit.submitForm();
    };
    
    
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    
    /**
     * Validate and Submit the form with ProductMeta
     */
    submit.status['submitLoading'] = false;
    submit.submitForm = function(comercio) {
                        //
                        console.log(comercio);
        
        // prepare
        scrollToSubmitEnd(); 
        
        
            console.log(submit.status['editMode']);
            switch (submit.status['editMode']) {
                case true:
                    //// validate
                    console.log("Editamos");
                    if(validarEdicion()){
                        
                        // referential
                        //addReferentialData();
                        
                        // psubmit
                        submit.status['submitLoading']      = true;
            
                        CentrosLocalService.editProduct(submit.ProductMeta, $scope.avatarURL, Auth.AuthData, comercio, local, $scope.banner1, $scope.banner2, $scope.banner3, $scope.iconoURL).then(
                            function(success){
                                handleSuccess();
                            },
                            function(error){
                                handleError(error)
                            }
                        );
                        break
                    };
                case false:
                    //// validate
                    if(validateProductMeta()){
                        
                        // referential
                        //addReferentialData();
                        
                        // psubmit
                        submit.status['submitLoading']      = true;
                        CentrosLocalService.submitProduct(submit.ProductMeta, Auth.AuthData, comercio).then(
                            function(){
                                handleSuccess();
                            },
                            function(error){
                                handleError(error)
                            }
                        );
                        break
                    };
            } // ./ switch
            
        
        // fn error
        function handleError(error) {
            submit.status['submitLoading']      = false;
            submit.status['containsNoError']    = false;
            submit.ErrorMessages['general']     = "Ooops Something went wrong... try again or contact us with reference code " + error;
        };
        
        // fn success
        function handleSuccess() {
            submit.status['submitLoading']      = false;
            submit.status['containsNoError']    = false;
            $state.go('admin.categories-centros_comerciales');
        };
        
    };
    
  
    /**
     * Used for filtering
     * *** put this on the SERVER
     */
    function addReferentialData() {
        // server values firebase
        submit.ProductMeta["timestamp_update"] = firebase.database.ServerValue.TIMESTAMP;
        if(!submit.ProductMeta.hasOwnProperty('timestamp_creation')) {
            submit.ProductMeta["timestamp_creation"] = firebase.database.ServerValue.TIMESTAMP;
        };
        
        // transform to timestamp
        if(submit.ProductMeta["discount_date_end_raw"]) {
            submit.ProductMeta["discount_date_end"] = submit.ProductMeta["discount_date_end_raw"].getTime();
        };
        
        
    };
    

    
    /**
     * 
     * Base 64 File Upload
     * *** Redo to one function
     * 
     */
    submit.dimensions = {
        screenshot: {
            w: 400,
            h: 400
        }
    };

    
    // screenshots
    var ProductImagesArray = [];
    submit.avatar = function (e, reader, file, fileList, fileOjects, fileObj) {
        var storageRef = firebase.storage().ref();
                var ImagenesRef = storageRef.child('avatar/'+ local).put(file);
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
                  $scope.avatarURL = ImagenesRef.snapshot.downloadURL;
                    var img = document.getElementById('avatarURL');
                    img.src = $scope.avatarURL;
                });
    };
    submit.icono = function (e, reader, file, fileList, fileOjects, fileObj) {
        var storageRef = firebase.storage().ref();
                var ImagenesRef = storageRef.child('icono/'+ local).put(file);
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
                  $scope.iconoURL = ImagenesRef.snapshot.downloadURL;
                    var img = document.getElementById('iconoURL');
                    img.src = $scope.iconoURL;
                });
    };
    submit.banner1 = function (e, reader, file, fileList, fileOjects, fileObj) {
        var storageRef = firebase.storage().ref();
                var ImagenesRef = storageRef.child('destacados/'+ local +'/banner1').put(file);
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
                  $scope.banner1 = ImagenesRef.snapshot.downloadURL;
                    var img = document.getElementById('banner1URL');
                    img.src = $scope.banner1;
                });
    };
    submit.banner2 = function (e, reader, file, fileList, fileOjects, fileObj) {
        var storageRef = firebase.storage().ref();
                var ImagenesRef = storageRef.child('destacados/'+ local +'/banner2').put(file);
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
                  $scope.banner2 = ImagenesRef.snapshot.downloadURL;
                    var img = document.getElementById('banner2URL');
                    img.src = $scope.banner2;
                });
    };
    submit.banner3 = function (e, reader, file, fileList, fileOjects, fileObj) {
        var storageRef = firebase.storage().ref();
                var ImagenesRef = storageRef.child('destacados/'+ local +'/banner3').put(file);
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
                  $scope.banner3 = ImagenesRef.snapshot.downloadURL;
                    var img = document.getElementById('banner3URL');
                    img.src = $scope.banner3;
                });
    };

    submit.onLoad9 = function (e, reader, file, fileList, fileOjects, fileObj) {
        Utils.resizeImage("canvas9", fileObj.base64, submit.dimensions["screenshot"].w, submit.dimensions["screenshot"].h).then(
            function(resizedBase64){
                ProductImagesArray.push(resizedBase64);
                transformArrayToScreenshot();
            }, function(error){
                //console.log(error)
            }
        )
    };
    
    submit.removeScreenshot = function(key){
        var index = key.match(/\d+/)[0];
        //console.log('remove', key, index)
        //console.log(ProductImagesArray)
        ProductImagesArray.splice(index-1, 1);
        transformArrayToScreenshot();
    };
    
    // takes ProductImagesArray and sets in ProductsImages  
    function transformArrayToScreenshot() {
      submit.ProductImages = {};
      for (var i = 0; i<ProductImagesArray.length; i++) {
          var iter = i+1;
          submit.ProductImages['screenshot' + iter] = ProductImagesArray[i];
      }
    };
    
    function initProductArray() {
        var iter = 0;
        angular.forEach(submit.ProductImages, function(value, key){
            if(key != 'icon') {
                ProductImagesArray[iter] = value;
                iter = iter+1; 
            }
        })
    };
    
    
    // handling 
    // v2
    function processScreenshotsData(ScreenshotsData) {
        submit.ProductImages = ScreenshotsData;
        initProductArray();
        submit.status['loadingScreenshots'] = false;
    };
    
    
    // -------------------------------------------------------------------------
    // Attributes
    submit.addAttributeType = function() {
        var aType = submit.status.newAttributeType;
        console.log('adding type', aType)
        if(aType) {
            if(submit.ProductMeta.hasOwnProperty('attributes')){
                submit.ProductMeta['attributes'][aType] = {}
            } else {
                var tempObj = {};
                tempObj[submit.status.newAttributeType] = {};
                submit.ProductMeta['attributes'] = tempObj;
            }
        }
        console.log(submit.ProductMeta['attributes'])
    };
    submit.deleteAttributeType = function(aType) {
        delete submit.ProductMeta['attributes'][aType]
    };
    
    submit.addAttributeValue = function() {
        var aValue = submit.status.newAttributeValue;
        var aType = submit.status.selectedAttributeType;
        console.log('adding value', aValue, aType)
        if(aValue && aType) {
            submit.ProductMeta['attributes'][aType][aValue] = true;
        };
    };
    
    submit.deleteAttributeValue = function(aType, aValue) {
        delete submit.ProductMeta['attributes'][aType][aValue];
    };
    
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    
    
    /**
     * Other helpers and buttons
     */
    function scrollToSubmitEnd() {
        $location.hash('submit0');
        $anchorScroll.yOffset = 100;
        $anchorScroll();
    };
    
    // -------------------------------------------------------------------------
    // navigation wise 
    
    submit.goTo = function(nextState) {
        $state.go(nextState);
    };
    
    // -------------------------------------------------------------------------
    // Validate submitform
    
    
    function validarPromocion() {
        submit.ErrorMessages = {};
        submit.status['containsNoError'] = true;

        //
        // Titulo
        var titulo = document.getElementById("titulo").value;
        if( titulo== "" || 
            titulo == null ||
            titulo == undefined){
            submit.ErrorMessages["titulo"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["titulo"] =  "";
        }

        //
        // Descripcion
        var descripcion = document.getElementById("descripcion").value;
        if( descripcion== "" || 
            descripcion == null ||
            descripcion == undefined){
            submit.ErrorMessages["descripcion"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["descripcion"] =  "";
        }

        //
        // Fecha Inicio
        var fecha_inicio = document.getElementById("fecha_inicio").value;
        if( fecha_inicio== "" || 
            fecha_inicio == null ||
            fecha_inicio == undefined){
            submit.ErrorMessages["fecha_inicio"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["fecha_inicio"] =  "";
        }

        //
        // Fecha Fin
        var fecha_fin = document.getElementById("fecha_fin").value;
        if( fecha_fin== "" || 
            fecha_fin == null ||
            fecha_fin == undefined){
            submit.ErrorMessages["fecha_fin"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["fecha_fin"] =  "";
        }

        //
        // Categoria
        var categoria = document.getElementById("categoria").value;
        if( categoria== "" || 
            categoria == null ||
            categoria == undefined){
            submit.ErrorMessages["categoria"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["categoria"] =  "";
        }
        //
        // generic
        if (!submit.status['containsNoError']) {
            submit.status['submitLoading'] = false;
            submit.ErrorMessages['general'] = 
            "Hay campos que deben ser completados";
        };


        return submit.status['containsNoError'];
    };

    function validarEdicion() {
        submit.ErrorMessages = {};
        submit.status['containsNoError'] = true;

        //
        // Nombre del Comercio
        var nombre = document.getElementById("nombre").value;
        if( nombre== "" || 
            nombre == null ||
            nombre == undefined){
            submit.ErrorMessages["nombre"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["nombre"] =  "";
        }

        //
        // Email
        var email = document.getElementById("email").value;
        if( email== "" || 
            email == null ||
            email == undefined){
            submit.ErrorMessages["email"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["email"] =  "";
        }

        //
        // Telefono
        var telefono = document.getElementById("telefono").value;
        if( telefono== "" || 
            telefono == null ||
            telefono == undefined){
            submit.ErrorMessages["telefono"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["telefono"] =  "";
        }

        //
        // Horario
        console.log(submit.ProductMeta.perfil.horario);
        if( submit.ProductMeta.perfil.horario== "" || 
            submit.ProductMeta.perfil.horario == null ||
            submit.ProductMeta.perfil.horario == undefined){
            submit.ErrorMessages["horario"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["horario"] =  "";
        }

        //
        // generic
        if (!submit.status['containsNoError']) {
            submit.status['submitLoading'] = false;
            submit.ErrorMessages['general'] = 
            "Hay campos que deben ser completados";
        };


        return submit.status['containsNoError'];
    };

    function validateProductMeta() {
        submit.ErrorMessages = {};
        submit.status['containsNoError'] = true;

        //
        // Nombre del Comercio
        var nombre = document.getElementById("nombre").value;
        if( nombre== "" || 
            nombre == null ||
            nombre == undefined){
            submit.ErrorMessages["nombre"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["nombre"] =  "";
        }

        //
        // Slug
        var slug = document.getElementById("slug").value;
        if( slug== "" || 
            slug == null ||
            slug == undefined){
            submit.ErrorMessages["slug"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["slug"] =  "";
        }

        //
        // Email
        var email = document.getElementById("email").value;
        if( email== "" || 
            email == null ||
            email == undefined){
            submit.ErrorMessages["email"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["email"] =  "";
        }

        //
        // Telefono
        var telefono = document.getElementById("telefono").value;
        if( telefono== "" || 
            telefono == null ||
            telefono == undefined){
            submit.ErrorMessages["telefono"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["telefono"] =  "";
        }

        //
        // generic
        if (!submit.status['containsNoError']) {
            submit.status['submitLoading'] = false;
            submit.ErrorMessages['general'] = 
            "Hay campos que deben ser completados";
        };


        return submit.status['containsNoError'];
    }; 
})

/*
    MULTIMARCAS
*/
.controller('SubmitMultiMarcas', function($scope, $state, $timeout, $location, $anchorScroll, $stateParams,
    Auth, Utils, MultiMarcas, MultiMarcasService) {

    // controller variables
    var submit = this;
    var currentProductId = null;   
    
    // init variables 
    $scope.status = {
        editMode: false,
        submitLoading: false,
        generalView: 'loading',
        containsNoError: true,
        loadingScreenshots: false,
        loadingCategories: true,
    };
    $scope.AuthData         = Auth.AuthData;
    $scope.ProductMeta      = {};
    $scope.ProductImages    = {};
    $scope.ErrorMessages    = {};
    $scope.IndexData        = {};

    // Iniciamos la funcion para redireccion la vista, ya sea un nuevo Centro Comercial o para editar uno ya existente
    $scope.initSubmit = function() {

        //Recibimos el parametro productId, que seria el slug del Centro Comercial
        //currentProductId = $stateParams.productId;
        $scope.multimarca = $stateParams.productId;

        //Llamamos a la funcion para redireccion la vista
        redirectView();
        
        $location.hash('page-top');
        $anchorScroll();
    };

    
    $scope.Eliminar = function(categoria, key){
        swal({
          title: "Desea eliminar la Multitienda?",
          text: "Ya no se va a poder recuperar la Multitienda.",
          icon: "warning", 
          buttons: ["Cancelar", "Eliminar"],
          dangerMode: true,
        })
        .then((willDelete) => {
          if (willDelete) {
            console.log(key);
            
            switch (categoria) {
                    case 'multimarcas':
                        MultiMarcasService.eliminarComercio(key).then(function(success){
                            console.log(success);
                            submit.goTo('admin.categories-multimarcas');
                            swal("Eliminado con exito", {
                              icon: "success", 
                            });
                        }, function(error){
                            console.log(error);
                            submit.goTo('admin.categories-multimarcas');
                            swal("No se ha eliminado", {
                              icon: "danger", 
                            });
                        });
                        break
            }
            
          }
        });
    };

    // Iniciamos la funcion para redireccionar la vista de las promociones, ya sea para agregar uno nuevo o editar alguna promocion existente
    $scope.initPromociones = function() {
        /*
            Recibimos los parametros :shopping y :promo
            - Shopping es obligatorio, si no le pasamos el parametro no va a poder agregar ninguna nueva promocion, y mucho menos editar
            - Promo es para editar las promociones ya existentes, al pasar la variable promo obligatoriamente se debe pasar la variable :shopping
        */
        $scope.shopping = $stateParams.shopping;
        $scope.promo = $stateParams.promo;

        //Llamamos a la funcion para redireccionar la vista
        redirectViewPromociones();
        //loadCategories();
        
        $location.hash('page-top');
        $anchorScroll();
    };
    
    /*
        Funcion para redireccion
        - Tenemos en cuenta si esta autenticado algun usuario como para poder hacer el cambio, en este caso deben ser solo los administradores
        - Verificamos que se pase el slug del Centro comercial
     */
    function redirectView() {
        if($scope.AuthData.hasOwnProperty('uid')){
            if($scope.multimarca != undefined && $scope.multimarca != null && $scope.multimarca != "") {

                MultiMarcasService.getProductMeta($scope.multimarca).then(
                    function(ProductMeta){
                        console.log(ProductMeta)
                        if(ProductMeta != null) {
                            $scope.ProductMeta = ProductMeta;
                            console.log(ProductMeta);
                            initEditMode();  
                        } else {
                            $scope.multimarca = null;
                            initNewSubmission();    // Error tecnico, entonces le damos la opcion de crear un nuevo Objeto
                        };
                    },
                    function(error){
                        console.log('e1', error);
                        initError();
                    }
                )
            } else {
                initNewSubmission();
            };
        } else {
            console.log('e2');
            initError();
        };
        
        // stateA - new
        function initNewSubmission() {
            
            $scope.status["generalView"]    = "new";
            $scope.status.editMode      = false;
            $scope.multimarca                = null; 
            
            // 
            submit.ProductMeta = {
                userId: $scope.AuthData.uid
            };

            
            $scope.status['loadingScreenshots'] = false
    
        };
        
        // stateB - edit mode
        function initEditMode() {                       //console.log("edit submission")
            $scope.status["generalView"]    = "edit";
            $scope.status.editMode      = true;
            console.log($scope.status.editMode); 
            // -->
            
            // -->
            loadScreenshots();
            loadIcono();
            loadBanners();
        };
        
        // stateB - something went wrong
        function initError() {
            $scope.status["generalView"] = "error";     //console.log("error")
            $state.go('admin.home');
        };
        
    };

    function redirectViewPromociones() {
        if($scope.AuthData.hasOwnProperty('uid')){
            if($scope.promo != undefined && $scope.promo != null && $scope.promo != "") {
                
                
                // load product
                MultiMarcasService.getPromoMeta($scope.shopping,$scope.promo).then(
                    function(PromocionMeta){
                        if(PromocionMeta != null) {
                            $scope.PromocionMeta = PromocionMeta;   // bind the data
                            initEditMode();  
                        } else {
                            $scope.shopping = null;
                            initNewSubmission();    // technically an error
                        };
                    },
                    function(error){
                        console.log('e1', error);
                        initError();
                    }
                )
            } else {
                initNewSubmission();
            };
        } else {
            console.log('e2');
            initError();
        };
        
        // stateA - new
        function initNewSubmission() {
            
            $scope.status["generalView"]    = "new";
            $scope.status["editMode"]       = false;
            
            // 
            $scope.PromocionMeta = {
                userId: $scope.AuthData.uid
            };
            
            $scope.status['loadingScreenshots'] = false
    
        };
        
        // stateB - edit mode
        function initEditMode() {                       //console.log("edit submission")
            $scope.status["generalView"]    = "edit";
            $scope.status["editMode"]       = true;
            
            /*
            if(submit.PromocionMeta.hasOwnProperty('fechafin')) {
                submit.PromocionMeta["fechafin"] = new Date(submit.PromocionMeta["fechafin"]);
            };
            if(submit.PromocionMeta.hasOwnProperty('fechainicio')) {
                submit.PromocionMeta["fechainicio"] = new Date(submit.PromocionMeta["fechainicio"]);
            };
            */
            // -->
            
            // -->
        };
        
        // stateB - something went wrong
        function initError() {
            $scope.status["generalView"] = "error";     //console.log("error")
            $state.go('admin.home');
        };
        
    };
    
    /*
        Cargamos las Imagenes
    */
    function loadScreenshots() {
        MultiMarcasService.getProductScreenshots($scope.multimarca).then(
            function(ScreenshotsData){

                $scope.avatarURL= ScreenshotsData;
                var img = document.getElementById('avatarURL');
                img.src = $scope.avatarURL;
            },
            function(error){
                submit.status["generalView"] = "error";
            }
        );
    };
    function loadIcono() {
        MultiMarcasService.getIcono($scope.multimarca).then(
            function(ScreenshotsData){

                $scope.iconoURL= ScreenshotsData;
                var img = document.getElementById('iconoURL');
                img.src = $scope.iconoURL;
            },
            function(error){
                submit.status["generalView"] = "error";
            }
        );
    };
    function loadBanners() {
        MultiMarcasService.getBanner1($scope.multimarca).then(
            function(ScreenshotsData){

                $scope.banner1= ScreenshotsData;
                var img = document.getElementById('banner1URL');
                img.src = $scope.banner1;
            },
            function(error){
                submit.status["generalView"] = "error";
            }
        );
        MultiMarcasService.getBanner2($scope.multimarca).then(
            function(ScreenshotsData){

                $scope.banner2= ScreenshotsData;
                var img = document.getElementById('banner2URL');
                img.src = $scope.banner2;
            },
            function(error){
                submit.status["generalView"] = "error";
            }
        );
        MultiMarcasService.getBanner3($scope.multimarca).then(
            function(ScreenshotsData){

                $scope.banner3= ScreenshotsData;
                var img = document.getElementById('banner3URL');
                img.src = $scope.banner3;
            },
            function(error){
                submit.status["generalView"] = "error";
            }
        );
    };
    
    

    /**
     * Validamos el formulario y enviamos la promocion, ya sea uno nuevo o editamos uno ya existente
     */
    $scope.status['submitLoading'] = false;
    $scope.submitFormPromociones = function() {
        
        // prepare
        scrollToSubmitEnd(); 
        
        
        
            switch ($scope.status['editMode']) {
                case true:
                    //// validate
                    console.log("Edita");
                    if(validarPromocion()){
                        
                        // referential
                        //addReferentialData();
                        
                        // psubmit
                        $scope.status['submitLoading']      = true;
            
                        MultiMarcasService.editPromocion($scope.PromocionMeta, Auth.AuthData, $scope.shopping, $scope.promo).then(
                            function(success){
                                handleSuccess();
                            },
                            function(error){
                                handleError(error)
                            }
                        );
                        break
                    };
                case false:
                    //// validate
                    console.log("Nuevo");
                    if(validarPromocion()){
                        
                        // referential
                        //addReferentialData();
                        
                        // psubmit
                        $scope.status['submitLoading']      = true;
                        //
                        MultiMarcasService.submitPromocion($scope.PromocionMeta, Auth.AuthData, $scope.shopping).then(
                            function(success){
                                handleSuccess();
                            },
                            function(error){
                                handleError(error)
                            }
                        );
                        break
                    };
            } // ./ switch
            
        
        // fn error
        function handleError(error) {
            $scope.status['submitLoading']      = false;
            $scope.status['containsNoError']    = false;
            submit.ErrorMessages['general']     = "Ooops hubo un problema ... " + error;
        };
        
        // fn success
        function handleSuccess() {
            $scope.status['submitLoading']      = false;
            $scope.status['containsNoError']    = false;
            $state.go('admin.categories-multimarcas');
        };
        
    };    
    
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    
    /**
     * Validate and Submit the form with ProductMeta
     */
    $scope.status['submitLoading'] = false;
    $scope.submitForm = function() {
        
        // prepare
        scrollToSubmitEnd(); 
        
        
        
            if($scope.status.editMode) {
                     console.log($scope.status.editMode)
                    //// validate
                    if(validarEdicion()){
                        
                        // referential
                        //addReferentialData();
                        
                        // psubmit
                        $scope.status['submitLoading']      = true;
            
                        MultiMarcasService.editProduct($scope.ProductMeta, $scope.avatarURL, Auth.AuthData, $scope.multimarca, $scope.banner1, $scope.banner2, $scope.banner3, $scope.iconoURL).then(
                            function(success){
                                handleSuccess();
                            },
                            function(error){
                                handleError(error)
                            }
                        );
                    };
            }else{
                    console.log($scope.status.editMode)
                    //// validate
                    if(validateProductMeta()){
                        
                        // referential
                        //addReferentialData();
                        
                        // psubmit
                        $scope.status['submitLoading']      = true;
                        console.log($scope.ProductMeta);
                        //
                        MultiMarcasService.submitProduct($scope.ProductMeta, Auth.AuthData).then(
                            function(){
                                handleSuccess();
                            },
                            function(error){
                                handleError(error)
                            }
                        );
                    };
            }
            
        
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
            $state.go('admin.categories-multimarcas');
        };
        
    };
    
  
    /**
     * Used for filtering
     * *** put this on the SERVER
     */
    function addReferentialData() {
        // server values firebase
        submit.ProductMeta["timestamp_update"] = firebase.database.ServerValue.TIMESTAMP;
        if(!submit.ProductMeta.hasOwnProperty('timestamp_creation')) {
            submit.ProductMeta["timestamp_creation"] = firebase.database.ServerValue.TIMESTAMP;
        };
        
        // transform to timestamp
        if(submit.ProductMeta["discount_date_end_raw"]) {
            submit.ProductMeta["discount_date_end"] = submit.ProductMeta["discount_date_end_raw"].getTime();
        };
        
        
    };
    

    
    /**
     * 
     * Base 64 File Upload
     * *** Redo to one function
     * 
     */
    submit.dimensions = {
        screenshot: {
            w: 400,
            h: 400
        }
    };

    
    // screenshots
    var ProductImagesArray = [];
    $scope.avatar = function (e, reader, file, fileList, fileOjects, fileObj) {
        var storageRef = firebase.storage().ref();
                var ImagenesRef = storageRef.child('avatar/'+ $scope.multimarca).put(file);
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
                  $scope.avatarURL = ImagenesRef.snapshot.downloadURL;
                    var img = document.getElementById('avatarURL');
                    img.src = $scope.avatarURL;
                });
    };
    $scope.icono = function (e, reader, file, fileList, fileOjects, fileObj) {
        var storageRef = firebase.storage().ref();
        console.log('icono/'+ $scope.multimarca);
                var ImagenesRef = storageRef.child('icono/'+ $scope.multimarca).put(file);
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
                  $scope.iconoURL = ImagenesRef.snapshot.downloadURL;
                    var img = document.getElementById('iconoURL');
                    img.src = $scope.iconoURL;
                });
    };
    $scope.SubirBanner1 = function (e, reader, file, fileList, fileOjects, fileObj) {
        console.log("Banner 1");
        var storageRef = firebase.storage().ref();
        console.log('destacados/'+ $scope.multimarca +'/banner1');
                var ImagenesRef = storageRef.child('destacados/'+ $scope.multimarca +'/banner1').put(file);
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
                  $scope.banner1 = ImagenesRef.snapshot.downloadURL;
                    var img = document.getElementById('banner1URL');
                    img.src = $scope.banner1;
                });
    };
    $scope.SubirBanner2 = function (e, reader, file, fileList, fileOjects, fileObj) {
        var storageRef = firebase.storage().ref();
                var ImagenesRef = storageRef.child('destacados/'+ $scope.multimarca +'/banner2').put(file);
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
                  $scope.banner2 = ImagenesRef.snapshot.downloadURL;
                    var img = document.getElementById('banner2URL');
                    img.src = $scope.banner2;
                });
    };
    $scope.SubirBanner3 = function (e, reader, file, fileList, fileOjects, fileObj) {
        var storageRef = firebase.storage().ref();
                var ImagenesRef = storageRef.child('destacados/'+ $scope.multimarca +'/banner3').put(file);
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
                  $scope.banner3 = ImagenesRef.snapshot.downloadURL;
                    var img = document.getElementById('banner3URL');
                    img.src = $scope.banner3;
                });
    };
    
    submit.removeScreenshot = function(key){
        var index = key.match(/\d+/)[0];
        //console.log('remove', key, index)
        //console.log(ProductImagesArray)
        ProductImagesArray.splice(index-1, 1);
        transformArrayToScreenshot();
    };
    
    // takes ProductImagesArray and sets in ProductsImages  
    function transformArrayToScreenshot() {
      submit.ProductImages = {};
      for (var i = 0; i<ProductImagesArray.length; i++) {
          var iter = i+1;
          submit.ProductImages['screenshot' + iter] = ProductImagesArray[i];
      }
    };
    
    function initProductArray() {
        var iter = 0;
        angular.forEach(submit.ProductImages, function(value, key){
            if(key != 'icon') {
                ProductImagesArray[iter] = value;
                iter = iter+1; 
            }
        })
    };
    
    
    // handling 
    // v2
    function processScreenshotsData(ScreenshotsData) {
        submit.ProductImages = ScreenshotsData;
        initProductArray();
        submit.status['loadingScreenshots'] = false;
    };
    
    
    // -------------------------------------------------------------------------
    // Attributes
    submit.addAttributeType = function() {
        var aType = submit.status.newAttributeType;
        console.log('adding type', aType)
        if(aType) {
            if(submit.ProductMeta.hasOwnProperty('attributes')){
                submit.ProductMeta['attributes'][aType] = {}
            } else {
                var tempObj = {};
                tempObj[submit.status.newAttributeType] = {};
                submit.ProductMeta['attributes'] = tempObj;
            }
        }
        console.log(submit.ProductMeta['attributes'])
    };
    submit.deleteAttributeType = function(aType) {
        delete submit.ProductMeta['attributes'][aType]
    };
    
    submit.addAttributeValue = function() {
        var aValue = submit.status.newAttributeValue;
        var aType = submit.status.selectedAttributeType;
        console.log('adding value', aValue, aType)
        if(aValue && aType) {
            submit.ProductMeta['attributes'][aType][aValue] = true;
        };
    };
    
    submit.deleteAttributeValue = function(aType, aValue) {
        delete submit.ProductMeta['attributes'][aType][aValue];
    };
    
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    
    
    /**
     * Other helpers and buttons
     */
    function scrollToSubmitEnd() {
        $location.hash('submit0');
        $anchorScroll.yOffset = 100;
        $anchorScroll();
    };
    
    // -------------------------------------------------------------------------
    // navigation wise 
    
    submit.goTo = function(nextState) {
        $state.go(nextState);
    };
    
    // -------------------------------------------------------------------------
    // Validate submitform
    
    function validarPromocion() {
        $scope.ErrorMessages = {};
        $scope.status['containsNoError'] = true;

        //
        // Titulo
        var titulo = document.getElementById("titulo").value;
        if( titulo== "" || 
            titulo == null ||
            titulo == undefined){
            $scope.ErrorMessages["titulo"] = "*";
            $scope.status['containsNoError'] = false;
        }else{
            $scope.ErrorMessages["titulo"] =  "";
        }

        //
        // Descripcion
        var descripcion = document.getElementById("descripcion").value;
        if( descripcion== "" || 
            descripcion == null ||
            descripcion == undefined){
            $scope.ErrorMessages["descripcion"] = "*";
            $scope.status['containsNoError'] = false;
        }else{
            $scope.ErrorMessages["descripcion"] =  "";
        }

        //
        // Fecha Inicio
        var fecha_inicio = document.getElementById("fecha_inicio").value;
        if( fecha_inicio== "" || 
            fecha_inicio == null ||
            fecha_inicio == undefined){
            $scope.ErrorMessages["fecha_inicio"] = "*";
            $scope.status['containsNoError'] = false;
        }else{
            $scope.ErrorMessages["fecha_inicio"] =  "";
        }

        //
        // Fecha Fin
        var fecha_fin = document.getElementById("fecha_fin").value;
        if( fecha_fin== "" || 
            fecha_fin == null ||
            fecha_fin == undefined){
            $scope.ErrorMessages["fecha_fin"] = "*";
            $scope.status['containsNoError'] = false;
        }else{
            $scope.ErrorMessages["fecha_fin"] =  "";
        }

        //
        // Categoria
        var categoria = document.getElementById("categoria").value;
        if( categoria== "" || 
            categoria == null ||
            categoria == undefined){
            $scope.ErrorMessages["categoria"] = "*";
            $scope.status['containsNoError'] = false;
        }else{
            $scope.ErrorMessages["categoria"] =  "";
        }
        //
        // generic
        if (!$scope.status['containsNoError']) {
            $scope.status['submitLoading'] = false;
            $scope.ErrorMessages['general'] = 
            "Hay campos que deben ser completados";
        };


        return $scope.status['containsNoError'];
    };

    
    function validarEdicion() {
        $scope.ErrorMessages = {};
        $scope.status['containsNoError'] = true;

        //
        // Nombre del Comercio
        var nombre = document.getElementById("nombre").value;
        if( nombre== "" || 
            nombre == null ||
            nombre == undefined){
            $scope.ErrorMessages["nombre"] = "*";
            $scope.status['containsNoError'] = false;
        }else{
            $scope.ErrorMessages["nombre"] =  "";
        }

        //
        // Email
        var email = document.getElementById("email").value;
        if( email== "" || 
            email == null ||
            email == undefined){
            $scope.ErrorMessages["email"] = "*";
            $scope.status['containsNoError'] = false;
        }else{
            $scope.ErrorMessages["email"] =  "";
        }

        //
        // Telefono
        var telefono = document.getElementById("telefono").value;
        if( telefono== "" || 
            telefono == null ||
            telefono == undefined){
            $scope.ErrorMessages["telefono"] = "*";
            $scope.status['containsNoError'] = false;
        }else{
            $scope.ErrorMessages["telefono"] =  "";
        }

        //
        // generic
        if (!$scope.status['containsNoError']) {
            $scope.status['submitLoading'] = false;
            $scope.ErrorMessages['general'] = 
            "Hay campos que deben ser completados";
        };


        return $scope.status['containsNoError'];
    };


    function validateProductMeta() {
        $scope.ErrorMessages = {};
        $scope.status['containsNoError'] = true;

        //
        // Nombre del Comercio
        var nombre = document.getElementById("nombre").value;
        if( nombre== "" || 
            nombre == null ||
            nombre == undefined){
            $scope.ErrorMessages["nombre"] = "*";
            $scope.status['containsNoError'] = false;
        }else{
            $scope.ErrorMessages["nombre"] =  "";
        }

        //
        // Slug
        
        var slug = document.getElementById("slug").value;
        if( slug== "" || 
            slug == null ||
            slug == undefined){
            $scope.ErrorMessages["slug"] = "*";
            $scope.status['containsNoError'] = false;
        }else{
            $scope.ErrorMessages["slug"] =  "";
        }
        

        //
        // Email
        var email = document.getElementById("email").value;
        if( email== "" || 
            email == null ||
            email == undefined){
            $scope.ErrorMessages["email"] = "*";
            $scope.status['containsNoError'] = false;
        }else{
            $scope.ErrorMessages["email"] =  "";
        }

        //
        // Telefono
        var telefono = document.getElementById("telefono").value;
        if( telefono== "" || 
            telefono == null ||
            telefono == undefined){
            $scope.ErrorMessages["telefono"] = "*";
            $scope.status['containsNoError'] = false;
        }else{
            $scope.ErrorMessages["telefono"] =  "";
        }

        //
        // generic
        if (!$scope.status['containsNoError']) {
            $scope.status['submitLoading'] = false;
            $scope.ErrorMessages['general'] = "Hay campos que deben ser completados";
        };


        return $scope.status['containsNoError'];
    };     
})

.controller('SubmitMultimarcasSucursales', function($scope,
    $state, $timeout, $location, $anchorScroll, $stateParams,
    Auth, Utils, MultiSucursalService) {
        
    // controller variables
    var submit = this;
    var currentProductId = null;   
    
    // init variables 
    submit.status = {
        editMode: false,
        submitLoading: false,
        generalView: 'loading',
        containsNoError: true,
        loadingScreenshots: true,
        loadingCategories: true,
    };
    submit.AuthData         = Auth.AuthData;
    submit.ProductMeta      = {};
    submit.ProductImages    = {};
    submit.ErrorMessages    = {};
    submit.IndexData        = {};

    /* 
        Funcion para hacer Drag en el mapa
    */
        var mainMarker = {
                    lat: -25.342132,
                    lng: -57.556246,
                    focus: true,
                    //message: "Hey, drag me if you want",
                    draggable: true
                };

        angular.extend($scope, {
            london: {
                lat: -25.342132,
                lng: -57.556246,
                zoom: 15
            },
            markers: {
                mainMarker: angular.copy(mainMarker)
            },
            position: {
                lat: -25.3313193,
                lng: -57.5719568
            },
            events: { // or just {} //all events
                markers:{
                  enable: [ 'dragend' ]
                  //logic: 'emit'
                }
            },
            defaults: {
                scrollWheelZoom: false
            },
            layers: {
                baselayers: {
                    googleTerrain: {
                        name: 'Google Terrain',
                        layerType: 'TERRAIN',
                        type: 'google'
                    },
                }
            }
        });

        $scope.$on("leafletDirectiveMarker.dragend", function(event, args){
            document.getElementById("mapa.latitud").value = args.model.lat;
            document.getElementById("mapa.longitud").value = args.model.lng;
            submit.ProductMeta.perfil.mapa.latitud = args.model.lat
            submit.ProductMeta.perfil.mapa.longitud = args.model.lng
            console.log($scope.london.lat);
            console.log($scope.london.lng);
        });

    /* 
        FIN Funcion para hacer Drag en el mapa
    */

    // init the dependencies on load
    submit.initView = function() {
        
        local = $stateParams.localId;
        comercio = $stateParams.CentroComercial;
        
        submit.local = $stateParams.localId;
        submit.comercio = $stateParams.CentroComercial;
        redirectView();
        //loadCategories();
        
        $location.hash('page-top');
        $anchorScroll();
    };

    // Iniciamos la funcion para redireccionar la vista de las promociones, ya sea para agregar uno nuevo o editar alguna promocion existente
    submit.initPromociones = function() {
        /*
            Recibimos los parametros :shopping y :promo
            - Shopping es obligatorio, si no le pasamos el parametro no va a poder agregar ninguna nueva promocion, y mucho menos editar
            - Promo es para editar las promociones ya existentes, al pasar la variable promo obligatoriamente se debe pasar la variable :shopping
        */
        $scope.shopping = $stateParams.shopping;
        $scope.promo = $stateParams.promo;
        $scope.local = $stateParams.localId;

        //Llamamos a la funcion para redireccionar la vista
        redirectViewPromociones();
        //loadCategories();
        
        $location.hash('page-top');
        $anchorScroll();
    };
    
    submit.Eliminar = function(categoria, shopping, local){
        swal({
          title: "Desea eliminar la Sucursal?",
          text: "Ya no se va a poder recuperar la Sucursal.",
          icon: "warning", 
          buttons: ["Cancelar", "Eliminar"],
          dangerMode: true,
        })
        .then((willDelete) => {
          if (willDelete) {
            console.log(categoria, shopping, local);
            
            switch (categoria) {
                    case 'multimarcas_sucursales':
                        MultiSucursalService.eliminarSucursal(shopping, local).then(function(success){
                            console.log(success);
                            submit.goTocomercio();
                            swal("Eliminado con exito", {
                              icon: "success", 
                            });
                        }, function(error){
                            console.log(error);
                            submit.goTocomercio();
                            swal("No se ha eliminado", {
                              icon: "danger", 
                            });
                        });
                        break
            }
            
          }
        });
    };

    
    submit.goTocomercio = function() {
        $state.go('admin.SucursalesMultimarcas',{CentroComercial:submit.comercio})
    };

    
    submit.IrAlShopping = function() {
        $state.go('admin.SucursalesMultimarcas',{CentroComercial:$scope.shopping})
    };


    function redirectViewPromociones() {
        if(submit.AuthData.hasOwnProperty('uid')){
            if($scope.promo != undefined && $scope.promo != null && $scope.promo != "") {
                
                
                // load product
                MultiSucursalService.getPromoMeta($scope.shopping,$scope.local,$scope.promo).then(
                    function(PromocionMeta){
                        if(PromocionMeta != null) {
                            submit.PromocionMeta = PromocionMeta;   // bind the data
                            initEditMode();  
                        } else {
                            $scope.shopping = null;
                            initNewSubmission();    // technically an error
                        };
                    },
                    function(error){
                        console.log('e1', error);
                        initError();
                    }
                )
            } else {
                initNewSubmission();
            };
        } else {
            console.log('e2');
            initError();
        };
        
        // stateA - new
        function initNewSubmission() {
            
            submit.status["generalView"]    = "new";
            submit.status["editMode"]       = false;
            
            // 
            submit.PromocionMeta = {
                userId: submit.AuthData.uid
            };
            
            submit.status['loadingScreenshots'] = false
    
        };
        
        // stateB - edit mode
        function initEditMode() {                       //console.log("edit submission")
            submit.status["generalView"]    = "edit";
            submit.status["editMode"]       = true;
            
            /*
            if(submit.PromocionMeta.hasOwnProperty('fechafin')) {
                submit.PromocionMeta["fechafin"] = new Date(submit.PromocionMeta["fechafin"]);
            };
            if(submit.PromocionMeta.hasOwnProperty('fechainicio')) {
                submit.PromocionMeta["fechainicio"] = new Date(submit.PromocionMeta["fechainicio"]);
            };
            */
            // -->
            //getIndexValues()
            
            // -->
            //loadScreenshots();
        };
        
        // stateB - something went wrong
        function initError() {
            submit.status["generalView"] = "error";     //console.log("error")
            $state.go('admin.home');
        };
        
    };

    

    /**
     * Validamos el formulario y enviamos la promocion, ya sea uno nuevo o editamos uno ya existente
     */
    submit.status['submitLoading'] = false;
    submit.submitFormPromociones = function() {
        
        // prepare
        scrollToSubmitEnd(); 
        
        
        
            switch (submit.status['editMode']) {
                case true:
                    //// validate
                    if(validarPromocion()){
                        
                        // referential
                        //addReferentialData();
                        
                        // psubmit
                        submit.status['submitLoading']      = true;
            
                        MultiSucursalService.editPromocion(submit.PromocionMeta, Auth.AuthData, $scope.shopping, $scope.local, $scope.promo).then(
                            function(success){
                                handleSuccess();
                            },
                            function(error){
                                handleError(error)
                            }
                        );
                        break
                    };
                case false:
                    //// validate
                    if(validarPromocion()){
                        
                        // referential
                        //addReferentialData();
                        
                        // psubmit
                        submit.status['submitLoading']      = true;
                        //
                        MultiSucursalService.submitPromocion(submit.PromocionMeta, Auth.AuthData, $scope.shopping, $scope.local).then(
                            function(success){
                                handleSuccess();
                            },
                            function(error){
                                handleError(error)
                            }
                        );
                        break
                    };
            } // ./ switch
            
        
        // fn error
        function handleError(error) {
            submit.status['submitLoading']      = false;
            submit.status['containsNoError']    = false;
            submit.ErrorMessages['general']     = "Ooops hubo un problema ... " + error;
        };
        
        // fn success
        function handleSuccess() {
            submit.status['submitLoading']      = false;
            submit.status['containsNoError']    = false;
            $state.go('admin.categories-multimarcas');
        };
        
    };
    /**
     * Edit mode verification and redirection:
     * - is it in the edit mode?
     * - does product excist?
     * - does author have the right to edit?
     * - submit with new productId or existing
     */
    function redirectView() {
        console.log("Redirecciona a Editar o Nuevo");
        if(submit.AuthData.hasOwnProperty('uid')){
            if(local != undefined && local != null && local != "") {
                
                
                // load product
                MultiSucursalService.getProductMeta(comercio,local).then(
                    function(ProductMeta){
                        if(ProductMeta != null) {
                            submit.ProductMeta = ProductMeta;   // bind the data
                            if(ProductMeta.perfil.mapa.latitud != 0 || ProductMeta.perfil.mapa.longitud != 0){
                                setTimeout(function(){
                                    $scope.lat = ProductMeta.perfil.mapa.latitud;
                                    $scope.lng = ProductMeta.perfil.mapa.longitud;
                                    var mainMarker = {
                                        lat: $scope.lat,
                                        lng: $scope.lng,
                                        focus: true,
                                        //message: "Hey, drag me if you want",
                                        draggable: true
                                    };

                                    angular.extend($scope, {
                                        london: {
                                            lat: $scope.lat,
                                            lng: $scope.lng,
                                            zoom: 15
                                        },
                                        markers: {
                                            mainMarker: angular.copy(mainMarker)
                                        },
                                        position: {
                                            lat: $scope.lat,
                                            lng: $scope.lng
                                        },
                                        events: { // or just {} //all events
                                            markers:{
                                              enable: [ 'dragend' ]
                                              //logic: 'emit'
                                            }
                                        },
                                        layers: {
                                            baselayers: {
                                                googleTerrain: {
                                                    name: 'Google Terrain',
                                                    layerType: 'TERRAIN',
                                                    type: 'google'
                                                },
                                            }
                                        }
                                    });


                                    $scope.$apply();
                                }, 0);  
                            }
                            initEditMode();  
                        } else {
                            local = null;
                            initNewSubmission();    // technically an error
                        };
                    },
                    function(error){
                        console.log('e1', error);
                        initError();
                    }
                )
            } else {
                initNewSubmission();
            };
        } else {
            console.log('e2');
            initError();
        };
        
        // stateA - new
        function initNewSubmission() {
            
            submit.status["generalView"]    = "new";
            submit.status["editMode"]       = false;
            local                           = null; 
            
            // 
            submit.ProductMeta = {
                userId: submit.AuthData.uid
            };
            
            submit.status['loadingScreenshots'] = false
    
        };
        
        // stateB - edit mode
        function initEditMode() {                       //console.log("edit submission")
            submit.status["generalView"]    = "edit";
            submit.status["editMode"]       = true;
            
            // -->
            if(submit.ProductMeta.hasOwnProperty('discount_date_end')) {
                submit.ProductMeta["discount_date_end_raw"] = new Date(submit.ProductMeta["discount_date_end"]);
            };
            
            // -->
            loadBanners();
            
            // -->
            loadScreenshots();
        };
        
        // stateB - something went wrong
        function initError() {
            submit.status["generalView"] = "error";     //console.log("error")
            $state.go('admin.home');
        };
        
    };
    
    // -------------------------------------------------------------------------
    // Load editable data
    function loadScreenshots() {
        // load images
        MultiSucursalService.getProductScreenshots(comercio,local).then(
            function(ScreenshotsData){
                processScreenshotsData(ScreenshotsData);
            },
            function(error){
                //console.log(error);
                submit.status["generalView"] = "error";
            }
        );
    };
    
    // fn index values (inventory_count)
    function getIndexValues() {
        MultiSucursalService.getIndexValues(local).then(
            function(IndexValues){
                submit.IndexData = IndexValues;
            },
            function(error){
                console.log(error)
            }
        )
    };
    
    
    // -------------------------------------------------------------------------
    submit.simulateSubmit = function() {
        
        submit.ProductMeta = {
            'categoryId': 'first',
            'tagsString': 'semin, test, hello',
            'title': 'Hello world',
            'price': 5,
            'userId': submit.AuthData.uid,
            'discount_date_end_raw': new Date("February 27, 2016 11:13:00"),
            'discount_perc': 50,
        };
        submit.OtherData = {
            'inventory_nb_items': 14
        }
        
        //submit.submitForm();
    };
    
    
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    
    /**
     * Validate and Submit the form with ProductMeta
     */
    submit.status['submitLoading'] = false;
    submit.submitForm = function(comercio) {
                        //
                        console.log(comercio);
        
        // prepare
        scrollToSubmitEnd(); 
        
        
        
            if(submit.status['editMode']) {
                    //// validate
                    if(validarEdicion()){
                        
                        // referential
                        //addReferentialData();
                        
                        // psubmit
                        submit.status['submitLoading']      = true;
            
                        MultiSucursalService.editProduct(submit.ProductMeta, Auth.AuthData, comercio, local, $scope.banner1, $scope.banner2, $scope.banner3).then(
                            function(success){
                                handleSuccess();
                            },
                            function(error){
                                handleError(error)
                            }
                        );
                    };
            }else{
                    //// validate
                    if(validateProductMeta()){
                        
                        // referential
                        //addReferentialData();
                        
                        // psubmit
                        submit.status['submitLoading']      = true;
                        MultiSucursalService.submitProduct(submit.ProductMeta, Auth.AuthData, comercio).then(
                            function(){
                                handleSuccess();
                            },
                            function(error){
                                handleError(error)
                            }
                        );
                    };
            }
            
        
        // fn error
        function handleError(error) {
            submit.status['submitLoading']      = false;
            submit.status['containsNoError']    = false;
            submit.ErrorMessages['general']     = "Ooops Something went wrong... try again or contact us with reference code " + error;
        };
        
        // fn success
        function handleSuccess() {
            submit.status['submitLoading']      = false;
            submit.status['containsNoError']    = false;
            $state.go('admin.categories-multimarcas');
        };
        
    };

    function loadBanners() {
        console.log("Cargando Banners" + local);

                $scope.banner1= submit.ProductMeta.perfil.banners_destacados.banner1;
                var img = document.getElementById('banner1URL');
                img.src = $scope.banner1;

                $scope.banner2= submit.ProductMeta.perfil.banners_destacados.banner2;
                var img = document.getElementById('banner2URL');
                img.src = $scope.banner2;

                $scope.banner3= submit.ProductMeta.perfil.banners_destacados.banner3;
                var img = document.getElementById('banner3URL');
                img.src = $scope.banner3;
    };

    submit.banner1 = function (e, reader, file, fileList, fileOjects, fileObj) {
        var storageRef = firebase.storage().ref();
                var ImagenesRef = storageRef.child('destacados/'+ local +'/banner1').put(file);
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
                  $scope.banner1 = ImagenesRef.snapshot.downloadURL;
                  console.log($scope.banner1);
                    var img = document.getElementById('banner1URL');
                    img.src = $scope.banner1;
                });
    };
    submit.banner2 = function (e, reader, file, fileList, fileOjects, fileObj) {
        var storageRef = firebase.storage().ref();
                var ImagenesRef = storageRef.child('destacados/'+ local +'/banner2').put(file);
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
                  $scope.banner2 = ImagenesRef.snapshot.downloadURL;
                    var img = document.getElementById('banner2URL');
                    img.src = $scope.banner2;
                });
    };
    submit.banner3 = function (e, reader, file, fileList, fileOjects, fileObj) {
        var storageRef = firebase.storage().ref();
                var ImagenesRef = storageRef.child('destacados/'+ local +'/banner3').put(file);
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
                  $scope.banner3 = ImagenesRef.snapshot.downloadURL;
                    var img = document.getElementById('banner3URL');
                    img.src = $scope.banner3;
                });
    };
    
  
    /**
     * Used for filtering
     * *** put this on the SERVER
     */
    function addReferentialData() {
        // server values firebase
        submit.ProductMeta["timestamp_update"] = firebase.database.ServerValue.TIMESTAMP;
        if(!submit.ProductMeta.hasOwnProperty('timestamp_creation')) {
            submit.ProductMeta["timestamp_creation"] = firebase.database.ServerValue.TIMESTAMP;
        };
        
        // transform to timestamp
        if(submit.ProductMeta["discount_date_end_raw"]) {
            submit.ProductMeta["discount_date_end"] = submit.ProductMeta["discount_date_end_raw"].getTime();
        };
        
        
    };
    

    
    /**
     * 
     * Base 64 File Upload
     * *** Redo to one function
     * 
     */
    submit.dimensions = {
        screenshot: {
            w: 400,
            h: 400
        }
    };

    
    // screenshots
    var ProductImagesArray = [];
    submit.onLoad9 = function (e, reader, file, fileList, fileOjects, fileObj) {
        Utils.resizeImage("canvas9", fileObj.base64, submit.dimensions["screenshot"].w, submit.dimensions["screenshot"].h).then(
            function(resizedBase64){
                ProductImagesArray.push(resizedBase64);
                transformArrayToScreenshot();
            }, function(error){
                //console.log(error)
            }
        )
    };
    
    submit.removeScreenshot = function(key){
        var index = key.match(/\d+/)[0];
        //console.log('remove', key, index)
        //console.log(ProductImagesArray)
        ProductImagesArray.splice(index-1, 1);
        transformArrayToScreenshot();
    };
    
    // takes ProductImagesArray and sets in ProductsImages  
    function transformArrayToScreenshot() {
      submit.ProductImages = {};
      for (var i = 0; i<ProductImagesArray.length; i++) {
          var iter = i+1;
          submit.ProductImages['screenshot' + iter] = ProductImagesArray[i];
      }
    };
    
    function initProductArray() {
        var iter = 0;
        angular.forEach(submit.ProductImages, function(value, key){
            if(key != 'icon') {
                ProductImagesArray[iter] = value;
                iter = iter+1; 
            }
        })
    };
    
    
    // handling 
    // v2
    function processScreenshotsData(ScreenshotsData) {
        submit.ProductImages = ScreenshotsData;
        initProductArray();
        submit.status['loadingScreenshots'] = false;
    };
    
    
    // -------------------------------------------------------------------------
    // Attributes
    submit.addAttributeType = function() {
        var aType = submit.status.newAttributeType;
        console.log('adding type', aType)
        if(aType) {
            if(submit.ProductMeta.hasOwnProperty('attributes')){
                submit.ProductMeta['attributes'][aType] = {}
            } else {
                var tempObj = {};
                tempObj[submit.status.newAttributeType] = {};
                submit.ProductMeta['attributes'] = tempObj;
            }
        }
        console.log(submit.ProductMeta['attributes'])
    };
    submit.deleteAttributeType = function(aType) {
        delete submit.ProductMeta['attributes'][aType]
    };
    
    submit.addAttributeValue = function() {
        var aValue = submit.status.newAttributeValue;
        var aType = submit.status.selectedAttributeType;
        console.log('adding value', aValue, aType)
        if(aValue && aType) {
            submit.ProductMeta['attributes'][aType][aValue] = true;
        };
    };
    
    submit.deleteAttributeValue = function(aType, aValue) {
        delete submit.ProductMeta['attributes'][aType][aValue];
    };
    
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    
    
    /**
     * Other helpers and buttons
     */
    function scrollToSubmitEnd() {
        $location.hash('submit0');
        $anchorScroll.yOffset = 100;
        $anchorScroll();
    };
    
    // -------------------------------------------------------------------------
    // navigation wise 
    
    submit.goTo = function(nextState) {
        $state.go(nextState);
    };
    
    // -------------------------------------------------------------------------
    // Validate submitform
    
    
    function validarPromocion() {
        submit.ErrorMessages = {};
        submit.status['containsNoError'] = true;

        //
        // Titulo
        var titulo = document.getElementById("titulo").value;
        if( titulo== "" || 
            titulo == null ||
            titulo == undefined){
            submit.ErrorMessages["titulo"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["titulo"] =  "";
        }

        //
        // Descripcion
        var descripcion = document.getElementById("descripcion").value;
        if( descripcion== "" || 
            descripcion == null ||
            descripcion == undefined){
            submit.ErrorMessages["descripcion"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["descripcion"] =  "";
        }

        //
        // Fecha Inicio
        var fecha_inicio = document.getElementById("fecha_inicio").value;
        if( fecha_inicio== "" || 
            fecha_inicio == null ||
            fecha_inicio == undefined){
            submit.ErrorMessages["fecha_inicio"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["fecha_inicio"] =  "";
        }

        //
        // Fecha Fin
        var fecha_fin = document.getElementById("fecha_fin").value;
        if( fecha_fin== "" || 
            fecha_fin == null ||
            fecha_fin == undefined){
            submit.ErrorMessages["fecha_fin"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["fecha_fin"] =  "";
        }

        //
        // Categoria
        var categoria = document.getElementById("categoria").value;
        if( categoria== "" || 
            categoria == null ||
            categoria == undefined){
            submit.ErrorMessages["categoria"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["categoria"] =  "";
        }
        //
        // generic
        if (!submit.status['containsNoError']) {
            submit.status['submitLoading'] = false;
            submit.ErrorMessages['general'] = 
            "Hay campos que deben ser completados";
        };


        return submit.status['containsNoError'];
    };

    function validarEdicion() {
        submit.ErrorMessages = {};
        submit.status['containsNoError'] = true;

        //
        // Nombre del Comercio
        var nombre = document.getElementById("nombre").value;
        if( nombre== "" || 
            nombre == null ||
            nombre == undefined){
            submit.ErrorMessages["nombre"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["nombre"] =  "";
        }

        //
        // Email
        var email = document.getElementById("email").value;
        if( email== "" || 
            email == null ||
            email == undefined){
            submit.ErrorMessages["email"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["email"] =  "";
        }

        //
        // Telefono
        var telefono = document.getElementById("telefono").value;
        if( telefono== "" || 
            telefono == null ||
            telefono == undefined){
            submit.ErrorMessages["telefono"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["telefono"] =  "";
        }

        //
        // generic
        if (!submit.status['containsNoError']) {
            submit.status['submitLoading'] = false;
            submit.ErrorMessages['general'] = 
            "Hay campos que deben ser completados";
        };


        return submit.status['containsNoError'];
    };

    function validateProductMeta() {
        submit.ErrorMessages = {};
        submit.status['containsNoError'] = true;

        //
        // Nombre del Comercio
        var nombre = document.getElementById("nombre").value;
        if( nombre== "" || 
            nombre == null ||
            nombre == undefined){
            submit.ErrorMessages["nombre"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["nombre"] =  "";
        }

        //
        // Slug
        var slug = document.getElementById("slug").value;
        if( slug== "" || 
            slug == null ||
            slug == undefined){
            submit.ErrorMessages["slug"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["slug"] =  "";
        }

        //
        // Email
        var email = document.getElementById("email").value;
        if( email== "" || 
            email == null ||
            email == undefined){
            submit.ErrorMessages["email"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["email"] =  "";
        }

        //
        // Telefono
        var telefono = document.getElementById("telefono").value;
        if( telefono== "" || 
            telefono == null ||
            telefono == undefined){
            submit.ErrorMessages["telefono"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["telefono"] =  "";
        }

        //
        // generic
        if (!submit.status['containsNoError']) {
            submit.status['submitLoading'] = false;
            submit.ErrorMessages['general'] = 
            "Hay campos que deben ser completados";
        };


        return submit.status['containsNoError'];
    }; 
})
/*
    SUPERMERCADOS
*/
.controller('SubmitSupermercados', function($scope, $state, $timeout, $location, $anchorScroll, $stateParams,
    Auth, Utils, MultiMarcas, SupermercadosService) {

    // controller variables
    var submit = this;
    var currentProductId = null;   
    
    // init variables 
    $scope.status = {
        editMode: false,
        submitLoading: false,
        generalView: 'loading',
        containsNoError: true,
        loadingScreenshots: false,
        loadingCategories: true,
    };
    $scope.AuthData         = Auth.AuthData;
    $scope.ProductMeta      = {};
    $scope.ProductImages    = {};
    $scope.ErrorMessages    = {};
    $scope.IndexData        = {};

    // Iniciamos la funcion para redireccion la vista, ya sea un nuevo Centro Comercial o para editar uno ya existente
    $scope.initSubmit = function() {

        //Recibimos el parametro productId, que seria el slug del Centro Comercial
        //currentProductId = $stateParams.productId;
        $scope.multimarca = $stateParams.productId;

        //Llamamos a la funcion para redireccion la vista
        redirectView();
        
        $location.hash('page-top');
        $anchorScroll();
    };

    // Iniciamos la funcion para redireccionar la vista de las promociones, ya sea para agregar uno nuevo o editar alguna promocion existente
    $scope.initPromociones = function() {
        /*
            Recibimos los parametros :shopping y :promo
            - Shopping es obligatorio, si no le pasamos el parametro no va a poder agregar ninguna nueva promocion, y mucho menos editar
            - Promo es para editar las promociones ya existentes, al pasar la variable promo obligatoriamente se debe pasar la variable :shopping
        */
        $scope.shopping = $stateParams.shopping;
        $scope.promo = $stateParams.promo;

        //Llamamos a la funcion para redireccionar la vista
        redirectViewPromociones();
        //loadCategories();
        
        $location.hash('page-top');
        $anchorScroll();
    };
    
    $scope.Eliminar = function(categoria, key){
        swal({
          title: "Desea eliminar el Supermercado?",
          text: "Ya no se va a poder recuperar el Supermercado.",
          icon: "warning", 
          buttons: ["Cancelar", "Eliminar"],
          dangerMode: true,
        })
        .then((willDelete) => {
          if (willDelete) {
            console.log(key);
            
            switch (categoria) {
                    case 'supermercado':
                        SupermercadosService.eliminarComercio(key).then(function(success){
                            console.log(success);
                            submit.goTo('admin.categories-supermercados');
                            swal("Eliminado con exito", {
                              icon: "success", 
                            });
                        }, function(error){
                            console.log(error);
                            submit.goTo('admin.categories-supermercados');
                            swal("No se ha eliminado", {
                              icon: "danger", 
                            });
                        });
                        break
            }
            
          }
        });
    };

    $scope.EliminarImagen = function() {
        
    }
    
    /*
        Funcion para redireccion
        - Tenemos en cuenta si esta autenticado algun usuario como para poder hacer el cambio, en este caso deben ser solo los administradores
        - Verificamos que se pase el slug del Centro comercial
     */
    function redirectView() {
        if($scope.AuthData.hasOwnProperty('uid')){
            if($scope.multimarca != undefined && $scope.multimarca != null && $scope.multimarca != "") {

                SupermercadosService.getProductMeta($scope.multimarca).then(
                    function(ProductMeta){
                        console.log(ProductMeta)
                        if(ProductMeta != null) {
                            $scope.ProductMeta = ProductMeta;
                            console.log(ProductMeta);
                            initEditMode();  
                        } else {
                            $scope.multimarca = null;
                            initNewSubmission();    // Error tecnico, entonces le damos la opcion de crear un nuevo Objeto
                        };
                    },
                    function(error){
                        console.log('e1', error);
                        initError();
                    }
                )
            } else {
                initNewSubmission();
            };
        } else {
            console.log('e2');
            initError();
        };
        
        // stateA - new
        function initNewSubmission() {
            
            $scope.status["generalView"]    = "new";
            $scope.status.editMode      = false;
            $scope.multimarca                = null; 
            
            // 
            submit.ProductMeta = {
                userId: $scope.AuthData.uid
            };

            
            $scope.status['loadingScreenshots'] = false
    
        };
        
        // stateB - edit mode
        function initEditMode() {                       //console.log("edit submission")
            $scope.status["generalView"]    = "edit";
            $scope.status.editMode      = true;
            console.log($scope.status.editMode); 
            // -->
            
            // -->
            loadScreenshots();
            loadIcono();
            loadBanners();
        };
        
        // stateB - something went wrong
        function initError() {
            $scope.status["generalView"] = "error";     //console.log("error")
            $state.go('admin.home');
        };
        
    };

    function redirectViewPromociones() {
        if($scope.AuthData.hasOwnProperty('uid')){
            if($scope.promo != undefined && $scope.promo != null && $scope.promo != "") {
                
                
                // load product
                SupermercadosService.getPromoMeta($scope.shopping,$scope.promo).then(
                    function(PromocionMeta){
                        if(PromocionMeta != null) {
                            $scope.PromocionMeta = PromocionMeta;   // bind the data
                            initEditMode();  
                        } else {
                            $scope.shopping = null;
                            initNewSubmission();    // technically an error
                        };
                    },
                    function(error){
                        console.log('e1', error);
                        initError();
                    }
                )
            } else {
                initNewSubmission();
            };
        } else {
            console.log('e2');
            initError();
        };
        
        // stateA - new
        function initNewSubmission() {
            
            $scope.status["generalView"]    = "new";
            $scope.status["editMode"]       = false;
            
            // 
            $scope.PromocionMeta = {
                userId: $scope.AuthData.uid
            };
            
            $scope.status['loadingScreenshots'] = false
    
        };
        
        // stateB - edit mode
        function initEditMode() {                       //console.log("edit submission")
            $scope.status["generalView"]    = "edit";
            $scope.status["editMode"]       = true;
            
            /*
            if(submit.PromocionMeta.hasOwnProperty('fechafin')) {
                submit.PromocionMeta["fechafin"] = new Date(submit.PromocionMeta["fechafin"]);
            };
            if(submit.PromocionMeta.hasOwnProperty('fechainicio')) {
                submit.PromocionMeta["fechainicio"] = new Date(submit.PromocionMeta["fechainicio"]);
            };
            */
            // -->
            
            // -->
        };
        
        // stateB - something went wrong
        function initError() {
            $scope.status["generalView"] = "error";     //console.log("error")
            $state.go('admin.home');
        };
        
    };
    
    /*
        Cargamos las Imagenes
    */
    function loadScreenshots() {
        SupermercadosService.getProductScreenshots($scope.multimarca).then(
            function(ScreenshotsData){

                $scope.avatarURL= ScreenshotsData;
                var img = document.getElementById('avatarURL');
                img.src = $scope.avatarURL;
            },
            function(error){
                submit.status["generalView"] = "error";
            }
        );
    };
    function loadIcono() {
        SupermercadosService.getIcono($scope.multimarca).then(
            function(ScreenshotsData){

                $scope.iconoURL= ScreenshotsData;
                var img = document.getElementById('iconoURL');
                img.src = $scope.iconoURL;
            },
            function(error){
                submit.status["generalView"] = "error";
            }
        );
    };
    function loadBanners() {
        SupermercadosService.getBanner1($scope.multimarca).then(
            function(ScreenshotsData){

                $scope.banner1= ScreenshotsData;
                var img = document.getElementById('banner1URL');
                img.src = $scope.banner1;
            },
            function(error){
                submit.status["generalView"] = "error";
            }
        );
        SupermercadosService.getBanner2($scope.multimarca).then(
            function(ScreenshotsData){

                $scope.banner2= ScreenshotsData;
                var img = document.getElementById('banner2URL');
                img.src = $scope.banner2;
            },
            function(error){
                submit.status["generalView"] = "error";
            }
        );
        SupermercadosService.getBanner3($scope.multimarca).then(
            function(ScreenshotsData){

                $scope.banner3= ScreenshotsData;
                var img = document.getElementById('banner3URL');
                img.src = $scope.banner3;
            },
            function(error){
                submit.status["generalView"] = "error";
            }
        );
    };
    
    

    /**
     * Validamos el formulario y enviamos la promocion, ya sea uno nuevo o editamos uno ya existente
     */
    $scope.status['submitLoading'] = false;
    $scope.submitFormPromociones = function() {
        
        // prepare
        scrollToSubmitEnd(); 
        
        
        
            switch ($scope.status['editMode']) {
                case true:
                    //// validate
                    console.log("Edita");
                    if(validarPromocion()){
                        
                        // referential
                        //addReferentialData();
                        
                        // psubmit
                        $scope.status['submitLoading']      = true;
            
                        SupermercadosService.editPromocion($scope.PromocionMeta, Auth.AuthData, $scope.shopping, $scope.promo).then(
                            function(success){
                                handleSuccess();
                            },
                            function(error){
                                handleError(error)
                            }
                        );
                        break
                    };
                case false:
                    //// validate
                    console.log("Nuevo");
                    if(validarPromocion()){
                        
                        // referential
                        //addReferentialData();
                        
                        // psubmit
                        $scope.status['submitLoading']      = true;
                        //
                        SupermercadosService.submitPromocion($scope.PromocionMeta, Auth.AuthData, $scope.shopping).then(
                            function(success){
                                handleSuccess();
                            },
                            function(error){
                                handleError(error)
                            }
                        );
                        break
                    };
            } // ./ switch
            
        
        // fn error
        function handleError(error) {
            $scope.status['submitLoading']      = false;
            $scope.status['containsNoError']    = false;
            submit.ErrorMessages['general']     = "Ooops hubo un problema ... " + error;
        };
        
        // fn success
        function handleSuccess() {
            $scope.status['submitLoading']      = false;
            $scope.status['containsNoError']    = false;
            $state.go('admin.categories-supermercados');
        };
        
    };    
    
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    
    /**
     * Validate and Submit the form with ProductMeta
     */
    $scope.status['submitLoading'] = false;
    $scope.submitForm = function() {
        
        // prepare
        scrollToSubmitEnd(); 
        
        
        
            if($scope.status.editMode) {
                     console.log($scope.status.editMode)
                    //// validate
                    if(validarEdicion()){
                        
                        // referential
                        //addReferentialData();
                        
                        // psubmit
                        $scope.status['submitLoading']      = true;
            
                        SupermercadosService.editProduct($scope.ProductMeta, $scope.avatarURL, Auth.AuthData, $scope.multimarca, $scope.banner1, $scope.banner2, $scope.banner3, $scope.iconoURL).then(
                            function(success){
                                handleSuccess();
                            },
                            function(error){
                                handleError(error)
                            }
                        );
                    };
            }else{
                    console.log($scope.status.editMode)
                    //// validate
                    if(validateProductMeta()){
                        
                        // referential
                        //addReferentialData();
                        
                        // psubmit
                        $scope.status['submitLoading']      = true;
                        console.log($scope.ProductMeta);
                        //
                        SupermercadosService.submitProduct($scope.ProductMeta, Auth.AuthData).then(
                            function(){
                                handleSuccess();
                            },
                            function(error){
                                handleError(error)
                            }
                        );
                    };
            }
            
        
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
            $state.go('admin.categories-supermercados');
        };
        
    };
    
  
    /**
     * Used for filtering
     * *** put this on the SERVER
     */
    function addReferentialData() {
        // server values firebase
        submit.ProductMeta["timestamp_update"] = firebase.database.ServerValue.TIMESTAMP;
        if(!submit.ProductMeta.hasOwnProperty('timestamp_creation')) {
            submit.ProductMeta["timestamp_creation"] = firebase.database.ServerValue.TIMESTAMP;
        };
        
        // transform to timestamp
        if(submit.ProductMeta["discount_date_end_raw"]) {
            submit.ProductMeta["discount_date_end"] = submit.ProductMeta["discount_date_end_raw"].getTime();
        };
        
        
    };
    

    
    /**
     * 
     * Base 64 File Upload
     * *** Redo to one function
     * 
     */
    submit.dimensions = {
        screenshot: {
            w: 400,
            h: 400
        }
    };

    
    // screenshots
    var ProductImagesArray = [];
    $scope.avatar = function (e, reader, file, fileList, fileOjects, fileObj) {
        var storageRef = firebase.storage().ref();
                var ImagenesRef = storageRef.child('avatar/'+ $scope.multimarca).put(file);
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
                  $scope.avatarURL = ImagenesRef.snapshot.downloadURL;
                    var img = document.getElementById('avatarURL');
                    img.src = $scope.avatarURL;
                });
    };
    $scope.icono = function (e, reader, file, fileList, fileOjects, fileObj) {
        var storageRef = firebase.storage().ref();
        console.log('icono/'+ $scope.multimarca);
                var ImagenesRef = storageRef.child('icono/'+ $scope.multimarca).put(file);
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
                  $scope.iconoURL = ImagenesRef.snapshot.downloadURL;
                    var img = document.getElementById('iconoURL');
                    img.src = $scope.iconoURL;
                });
    };
    $scope.SubirBanner1 = function (e, reader, file, fileList, fileOjects, fileObj) {
        console.log("Banner 1");
        var storageRef = firebase.storage().ref();
        console.log('destacados/'+ $scope.multimarca +'/banner1');
                var ImagenesRef = storageRef.child('destacados/'+ $scope.multimarca +'/banner1').put(file);
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
                  $scope.banner1 = ImagenesRef.snapshot.downloadURL;
                    var img = document.getElementById('banner1URL');
                    img.src = $scope.banner1;
                });
    };
    $scope.SubirBanner2 = function (e, reader, file, fileList, fileOjects, fileObj) {
        var storageRef = firebase.storage().ref();
                var ImagenesRef = storageRef.child('destacados/'+ $scope.multimarca +'/banner2').put(file);
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
                  $scope.banner2 = ImagenesRef.snapshot.downloadURL;
                    var img = document.getElementById('banner2URL');
                    img.src = $scope.banner2;
                });
    };
    $scope.SubirBanner3 = function (e, reader, file, fileList, fileOjects, fileObj) {
        var storageRef = firebase.storage().ref();
                var ImagenesRef = storageRef.child('destacados/'+ $scope.multimarca +'/banner3').put(file);
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
                  $scope.banner3 = ImagenesRef.snapshot.downloadURL;
                    var img = document.getElementById('banner3URL');
                    img.src = $scope.banner3;
                });
    };
    
    submit.removeScreenshot = function(key){
        var index = key.match(/\d+/)[0];
        //console.log('remove', key, index)
        //console.log(ProductImagesArray)
        ProductImagesArray.splice(index-1, 1);
        transformArrayToScreenshot();
    };
    
    // takes ProductImagesArray and sets in ProductsImages  
    function transformArrayToScreenshot() {
      submit.ProductImages = {};
      for (var i = 0; i<ProductImagesArray.length; i++) {
          var iter = i+1;
          submit.ProductImages['screenshot' + iter] = ProductImagesArray[i];
      }
    };
    
    function initProductArray() {
        var iter = 0;
        angular.forEach(submit.ProductImages, function(value, key){
            if(key != 'icon') {
                ProductImagesArray[iter] = value;
                iter = iter+1; 
            }
        })
    };
    
    
    // handling 
    // v2
    function processScreenshotsData(ScreenshotsData) {
        submit.ProductImages = ScreenshotsData;
        initProductArray();
        submit.status['loadingScreenshots'] = false;
    };
    
    
    // -------------------------------------------------------------------------
    // Attributes
    submit.addAttributeType = function() {
        var aType = submit.status.newAttributeType;
        console.log('adding type', aType)
        if(aType) {
            if(submit.ProductMeta.hasOwnProperty('attributes')){
                submit.ProductMeta['attributes'][aType] = {}
            } else {
                var tempObj = {};
                tempObj[submit.status.newAttributeType] = {};
                submit.ProductMeta['attributes'] = tempObj;
            }
        }
        console.log(submit.ProductMeta['attributes'])
    };
    submit.deleteAttributeType = function(aType) {
        delete submit.ProductMeta['attributes'][aType]
    };
    
    submit.addAttributeValue = function() {
        var aValue = submit.status.newAttributeValue;
        var aType = submit.status.selectedAttributeType;
        console.log('adding value', aValue, aType)
        if(aValue && aType) {
            submit.ProductMeta['attributes'][aType][aValue] = true;
        };
    };
    
    submit.deleteAttributeValue = function(aType, aValue) {
        delete submit.ProductMeta['attributes'][aType][aValue];
    };
    
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    
    
    /**
     * Other helpers and buttons
     */
    function scrollToSubmitEnd() {
        $location.hash('submit0');
        $anchorScroll.yOffset = 100;
        $anchorScroll();
    };
    
    // -------------------------------------------------------------------------
    // navigation wise 
    
    submit.goTo = function(nextState) {
        $state.go(nextState);
    };
    
    // -------------------------------------------------------------------------
    // Validate submitform
    
    function validarPromocion() {
        $scope.ErrorMessages = {};
        $scope.status['containsNoError'] = true;

        //
        // Titulo
        var titulo = document.getElementById("titulo").value;
        if( titulo== "" || 
            titulo == null ||
            titulo == undefined){
            $scope.ErrorMessages["titulo"] = "*";
            $scope.status['containsNoError'] = false;
        }else{
            $scope.ErrorMessages["titulo"] =  "";
        }

        //
        // Descripcion
        var descripcion = document.getElementById("descripcion").value;
        if( descripcion== "" || 
            descripcion == null ||
            descripcion == undefined){
            $scope.ErrorMessages["descripcion"] = "*";
            $scope.status['containsNoError'] = false;
        }else{
            $scope.ErrorMessages["descripcion"] =  "";
        }

        //
        // Fecha Inicio
        var fecha_inicio = document.getElementById("fecha_inicio").value;
        if( fecha_inicio== "" || 
            fecha_inicio == null ||
            fecha_inicio == undefined){
            $scope.ErrorMessages["fecha_inicio"] = "*";
            $scope.status['containsNoError'] = false;
        }else{
            $scope.ErrorMessages["fecha_inicio"] =  "";
        }

        //
        // Fecha Fin
        var fecha_fin = document.getElementById("fecha_fin").value;
        if( fecha_fin== "" || 
            fecha_fin == null ||
            fecha_fin == undefined){
            $scope.ErrorMessages["fecha_fin"] = "*";
            $scope.status['containsNoError'] = false;
        }else{
            $scope.ErrorMessages["fecha_fin"] =  "";
        }

        //
        // Categoria
        var categoria = document.getElementById("categoria").value;
        if( categoria== "" || 
            categoria == null ||
            categoria == undefined){
            $scope.ErrorMessages["categoria"] = "*";
            $scope.status['containsNoError'] = false;
        }else{
            $scope.ErrorMessages["categoria"] =  "";
        }

        //
        // generic
        if (!$scope.status['containsNoError']) {
            $scope.status['submitLoading'] = false;
            $scope.ErrorMessages['general'] = 
            "Hay campos que deben ser completados";
        };


        return $scope.status['containsNoError'];
    };

    
    function validarEdicion() {
        $scope.ErrorMessages = {};
        $scope.status['containsNoError'] = true;

        //
        // Nombre del Comercio
        var nombre = document.getElementById("nombre").value;
        if( nombre== "" || 
            nombre == null ||
            nombre == undefined){
            $scope.ErrorMessages["nombre"] = "*";
            $scope.status['containsNoError'] = false;
        }else{
            $scope.ErrorMessages["nombre"] =  "";
        }

        //
        // Email
        var email = document.getElementById("email").value;
        if( email== "" || 
            email == null ||
            email == undefined){
            $scope.ErrorMessages["email"] = "*";
            $scope.status['containsNoError'] = false;
        }else{
            $scope.ErrorMessages["email"] =  "";
        }

        //
        // Telefono
        var telefono = document.getElementById("telefono").value;
        if( telefono== "" || 
            telefono == null ||
            telefono == undefined){
            $scope.ErrorMessages["telefono"] = "*";
            $scope.status['containsNoError'] = false;
        }else{
            $scope.ErrorMessages["telefono"] =  "";
        }

        //
        // generic
        if (!$scope.status['containsNoError']) {
            $scope.status['submitLoading'] = false;
            $scope.ErrorMessages['general'] = 
            "Hay campos que deben ser completados";
        };


        return $scope.status['containsNoError'];
    };


    function validateProductMeta() {
        $scope.ErrorMessages = {};
        $scope.status['containsNoError'] = true;

        //
        // Nombre del Comercio
        var nombre = document.getElementById("nombre").value;
        if( nombre== "" || 
            nombre == null ||
            nombre == undefined){
            $scope.ErrorMessages["nombre"] = "*";
            $scope.status['containsNoError'] = false;
        }else{
            $scope.ErrorMessages["nombre"] =  "";
        }

        //
        // Slug
        
        var slug = document.getElementById("slug").value;
        if( slug== "" || 
            slug == null ||
            slug == undefined){
            $scope.ErrorMessages["slug"] = "*";
            $scope.status['containsNoError'] = false;
        }else{
            $scope.ErrorMessages["slug"] =  "";
        }
        

        //
        // Email
        var email = document.getElementById("email").value;
        if( email== "" || 
            email == null ||
            email == undefined){
            $scope.ErrorMessages["email"] = "*";
            $scope.status['containsNoError'] = false;
        }else{
            $scope.ErrorMessages["email"] =  "";
        }

        //
        // Telefono
        var telefono = document.getElementById("telefono").value;
        if( telefono== "" || 
            telefono == null ||
            telefono == undefined){
            $scope.ErrorMessages["telefono"] = "*";
            $scope.status['containsNoError'] = false;
        }else{
            $scope.ErrorMessages["telefono"] =  "";
        }

        //
        // generic
        if (!$scope.status['containsNoError']) {
            $scope.status['submitLoading'] = false;
            $scope.ErrorMessages['general'] = "Hay campos que deben ser completados";
        };


        return $scope.status['containsNoError'];
    };     
})

.controller('SubmitSupermercadosSucursales', function($scope,
    $state, $timeout, $location, $anchorScroll, $stateParams,
    Auth, Utils, SuperSucursalService) {
        
    // controller variables
    var submit = this;
    var currentProductId = null;   
    
    // init variables 
    submit.status = {
        editMode: false,
        submitLoading: false,
        generalView: 'loading',
        containsNoError: true,
        loadingScreenshots: true,
        loadingCategories: true,
    };
    submit.AuthData         = Auth.AuthData;
    submit.ProductMeta      = {};
    submit.ProductImages    = {};
    submit.ErrorMessages    = {};
    submit.IndexData        = {};

    /* 
        Funcion para hacer Drag en el mapa
    */
        var mainMarker = {
                    lat: -25.342132,
                    lng: -57.556246,
                    focus: true,
                    //message: "Hey, drag me if you want",
                    draggable: true
                };

        angular.extend($scope, {
            london: {
                lat: -25.342132,
                lng: -57.556246,
                zoom: 15
            },
            markers: {
                mainMarker: angular.copy(mainMarker)
            },
            position: {
                lat: -25.3313193,
                lng: -57.5719568
            },
            events: { // or just {} //all events
                markers:{
                  enable: [ 'dragend' ]
                  //logic: 'emit'
                }
            },
            defaults: {
                scrollWheelZoom: false
            },
            layers: {
                baselayers: {
                    googleTerrain: {
                        name: 'Google Terrain',
                        layerType: 'TERRAIN',
                        type: 'google'
                    },
                }
            }
        });

        $scope.$on("leafletDirectiveMarker.dragend", function(event, args){
            document.getElementById("mapa.latitud").value = args.model.lat;
            document.getElementById("mapa.longitud").value = args.model.lng;
            submit.ProductMeta.perfil.mapa.latitud = args.model.lat
            submit.ProductMeta.perfil.mapa.longitud = args.model.lng
            console.log($scope.london.lat);
            console.log($scope.london.lng);
        });

    /* 
        FIN Funcion para hacer Drag en el mapa
    */

    // init the dependencies on load
    submit.initView = function() {
        
        local = $stateParams.localId;
        comercio = $stateParams.CentroComercial;
        
        submit.local = $stateParams.localId;
        submit.comercio = $stateParams.CentroComercial;
        redirectView();
        //loadCategories();
        
        $location.hash('page-top');
        $anchorScroll();
    };

    // Iniciamos la funcion para redireccionar la vista de las promociones, ya sea para agregar uno nuevo o editar alguna promocion existente
    submit.initPromociones = function() {
        /*
            Recibimos los parametros :shopping y :promo
            - Shopping es obligatorio, si no le pasamos el parametro no va a poder agregar ninguna nueva promocion, y mucho menos editar
            - Promo es para editar las promociones ya existentes, al pasar la variable promo obligatoriamente se debe pasar la variable :shopping
        */
        $scope.shopping = $stateParams.shopping;
        $scope.promo = $stateParams.promo;
        $scope.local = $stateParams.localId;

        //Llamamos a la funcion para redireccionar la vista
        redirectViewPromociones();
        //loadCategories();
        
        $location.hash('page-top');
        $anchorScroll();
    };
    
    submit.Eliminar = function(categoria, shopping, local){
        swal({
          title: "Desea eliminar la Sucursal?",
          text: "Ya no se va a poder recuperar la Sucursal.",
          icon: "warning", 
          buttons: ["Cancelar", "Eliminar"],
          dangerMode: true,
        })
        .then((willDelete) => {
          if (willDelete) {
            console.log(categoria, shopping, local);
            
            switch (categoria) {
                    case 'supermercado_sucursales':
                        SuperSucursalService.eliminarSucursal(shopping, local).then(function(success){
                            console.log(success);
                            submit.goTocomercio();
                            swal("Eliminado con exito", {
                              icon: "success", 
                            });
                        }, function(error){
                            console.log(error);
                            submit.goTocomercio();
                            swal("No se ha eliminado", {
                              icon: "danger", 
                            });
                        });
                        break
            }
            
          }
        });
    };

    
    submit.goTocomercio = function() {
        $state.go('admin.SucursalesSupermercados',{CentroComercial:submit.comercio})
    };

    
    submit.IrAlShopping = function() {
        $state.go('admin.SucursalesSupermercados',{CentroComercial:$scope.shopping})
    };


    function redirectViewPromociones() {
        if(submit.AuthData.hasOwnProperty('uid')){
            if($scope.promo != undefined && $scope.promo != null && $scope.promo != "") {
                
                
                // load product
                SuperSucursalService.getPromoMeta($scope.shopping,$scope.local,$scope.promo).then(
                    function(PromocionMeta){
                        if(PromocionMeta != null) {
                            submit.PromocionMeta = PromocionMeta;   // bind the data
                            initEditMode();  
                        } else {
                            $scope.shopping = null;
                            initNewSubmission();    // technically an error
                        };
                    },
                    function(error){
                        console.log('e1', error);
                        initError();
                    }
                )
            } else {
                initNewSubmission();
            };
        } else {
            console.log('e2');
            initError();
        };
        
        // stateA - new
        function initNewSubmission() {
            
            submit.status["generalView"]    = "new";
            submit.status["editMode"]       = false;
            
            // 
            submit.PromocionMeta = {
                userId: submit.AuthData.uid
            };
            
            submit.status['loadingScreenshots'] = false
    
        };
        
        // stateB - edit mode
        function initEditMode() {                       //console.log("edit submission")
            submit.status["generalView"]    = "edit";
            submit.status["editMode"]       = true;
            
            /*
            if(submit.PromocionMeta.hasOwnProperty('fechafin')) {
                submit.PromocionMeta["fechafin"] = new Date(submit.PromocionMeta["fechafin"]);
            };
            if(submit.PromocionMeta.hasOwnProperty('fechainicio')) {
                submit.PromocionMeta["fechainicio"] = new Date(submit.PromocionMeta["fechainicio"]);
            };
            */
            // -->
            //getIndexValues()
            
            // -->
            //loadScreenshots();
        };
        
        // stateB - something went wrong
        function initError() {
            submit.status["generalView"] = "error";     //console.log("error")
            $state.go('admin.home');
        };
        
    };

    

    /**
     * Validamos el formulario y enviamos la promocion, ya sea uno nuevo o editamos uno ya existente
     */
    submit.status['submitLoading'] = false;
    submit.submitFormPromociones = function() {
        
        // prepare
        scrollToSubmitEnd(); 
        
        
        
            switch (submit.status['editMode']) {
                case true:
                    //// validate
                    if(validarPromocion()){
                        
                        // referential
                        //addReferentialData();
                        
                        // psubmit
                        submit.status['submitLoading']      = true;
            
                        SuperSucursalService.editPromocion(submit.PromocionMeta, Auth.AuthData, $scope.shopping, $scope.local, $scope.promo).then(
                            function(success){
                                handleSuccess();
                            },
                            function(error){
                                handleError(error)
                            }
                        );
                        break
                    };
                case false:
                    //// validate
                    if(validarPromocion()){
                        
                        // referential
                        //addReferentialData();
                        
                        // psubmit
                        submit.status['submitLoading']      = true;
                        //
                        SuperSucursalService.submitPromocion(submit.PromocionMeta, Auth.AuthData, $scope.shopping, $scope.local).then(
                            function(success){
                                handleSuccess();
                            },
                            function(error){
                                handleError(error)
                            }
                        );
                        break
                    };
            } // ./ switch
            
        
        // fn error
        function handleError(error) {
            submit.status['submitLoading']      = false;
            submit.status['containsNoError']    = false;
            submit.ErrorMessages['general']     = "Ooops hubo un problema ... " + error;
        };
        
        // fn success
        function handleSuccess() {
            submit.status['submitLoading']      = false;
            submit.status['containsNoError']    = false;
            $state.go('admin.categories-supermercados');
        };
        
    };
    /**
     * Edit mode verification and redirection:
     * - is it in the edit mode?
     * - does product excist?
     * - does author have the right to edit?
     * - submit with new productId or existing
     */
    function redirectView() {
        console.log("Redirecciona a Editar o Nuevo");
        if(submit.AuthData.hasOwnProperty('uid')){
            if(local != undefined && local != null && local != "") {
                
                
                // load product
                SuperSucursalService.getProductMeta(comercio,local).then(
                    function(ProductMeta){
                        if(ProductMeta != null) {
                            submit.ProductMeta = ProductMeta;   // bind the data
                            
                            submit.ProductMeta = ProductMeta;   // bind the data
                            if(ProductMeta.perfil.mapa.latitud != 0 || ProductMeta.perfil.mapa.longitud != 0){
                                setTimeout(function(){
                                    $scope.lat = ProductMeta.perfil.mapa.latitud;
                                    $scope.lng = ProductMeta.perfil.mapa.longitud;
                                    var mainMarker = {
                                        lat: $scope.lat,
                                        lng: $scope.lng,
                                        focus: true,
                                        //message: "Hey, drag me if you want",
                                        draggable: true
                                    };

                                    angular.extend($scope, {
                                        london: {
                                            lat: $scope.lat,
                                            lng: $scope.lng,
                                            zoom: 15
                                        },
                                        markers: {
                                            mainMarker: angular.copy(mainMarker)
                                        },
                                        position: {
                                            lat: $scope.lat,
                                            lng: $scope.lng
                                        },
                                        events: { // or just {} //all events
                                            markers:{
                                              enable: [ 'dragend' ]
                                              //logic: 'emit'
                                            }
                                        },
                                        layers: {
                                            baselayers: {
                                                googleTerrain: {
                                                    name: 'Google Terrain',
                                                    layerType: 'TERRAIN',
                                                    type: 'google'
                                                },
                                            }
                                        }
                                    });


                                    $scope.$apply();
                                }, 0);  
                            }
                            initEditMode();  
                        } else {
                            local = null;
                            initNewSubmission();    // technically an error
                        };
                    },
                    function(error){
                        console.log('e1', error);
                        initError();
                    }
                )
            } else {
                initNewSubmission();
            };
        } else {
            console.log('e2');
            initError();
        };
        
        // stateA - new
        function initNewSubmission() {
            
            submit.status["generalView"]    = "new";
            submit.status["editMode"]       = false;
            local                           = null; 
            
            // 
            submit.ProductMeta = {
                userId: submit.AuthData.uid
            };
            
            submit.status['loadingScreenshots'] = false
    
        };
        
        // stateB - edit mode
        function initEditMode() {                       //console.log("edit submission")
            submit.status["generalView"]    = "edit";
            submit.status["editMode"]       = true;
            
            // -->
            if(submit.ProductMeta.hasOwnProperty('discount_date_end')) {
                submit.ProductMeta["discount_date_end_raw"] = new Date(submit.ProductMeta["discount_date_end"]);
            };
            
            // -->
            loadBanners();
            
            // -->
            loadScreenshots();
        };
        
        // stateB - something went wrong
        function initError() {
            submit.status["generalView"] = "error";     //console.log("error")
            $state.go('admin.home');
        };
        
    };
    
    // -------------------------------------------------------------------------
    // Load editable data
    function loadScreenshots() {
        // load images
        SuperSucursalService.getProductScreenshots(comercio,local).then(
            function(ScreenshotsData){
                processScreenshotsData(ScreenshotsData);
            },
            function(error){
                //console.log(error);
                submit.status["generalView"] = "error";
            }
        );
    };
    
    // fn index values (inventory_count)
    function getIndexValues() {
        SuperSucursalService.getIndexValues(local).then(
            function(IndexValues){
                submit.IndexData = IndexValues;
            },
            function(error){
                console.log(error)
            }
        )
    };
    
    
    // -------------------------------------------------------------------------
    submit.simulateSubmit = function() {
        
        submit.ProductMeta = {
            'categoryId': 'first',
            'tagsString': 'semin, test, hello',
            'title': 'Hello world',
            'price': 5,
            'userId': submit.AuthData.uid,
            'discount_date_end_raw': new Date("February 27, 2016 11:13:00"),
            'discount_perc': 50,
        };
        submit.OtherData = {
            'inventory_nb_items': 14
        }
        
        //submit.submitForm();
    };
    
    
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    
    /**
     * Validate and Submit the form with ProductMeta
     */
    submit.status['submitLoading'] = false;
    submit.submitForm = function(comercio) {
                        //
                        console.log(comercio);
        
        // prepare
        scrollToSubmitEnd(); 
        
        
        
            if(submit.status['editMode']) {
                    //// validate
                    if(validarEdicion()){
                        
                        // referential
                        //addReferentialData();
                        
                        // psubmit
                        submit.status['submitLoading']      = true;
            
                        SuperSucursalService.editProduct(submit.ProductMeta, Auth.AuthData, comercio, local, $scope.banner1, $scope.banner2, $scope.banner3).then(
                            function(success){
                                handleSuccess();
                            },
                            function(error){
                                handleError(error)
                            }
                        );
                    };
            }else{
                    //// validate
                    if(validateProductMeta()){
                        
                        // referential
                        //addReferentialData();
                        
                        // psubmit
                        submit.status['submitLoading']      = true;
                        SuperSucursalService.submitProduct(submit.ProductMeta, Auth.AuthData, comercio).then(
                            function(){
                                handleSuccess();
                            },
                            function(error){
                                handleError(error)
                            }
                        );
                    };
            }
            
        
        // fn error
        function handleError(error) {
            submit.status['submitLoading']      = false;
            submit.status['containsNoError']    = false;
            submit.ErrorMessages['general']     = "Ooops Something went wrong... try again or contact us with reference code " + error;
        };
        
        // fn success
        function handleSuccess() {
            submit.status['submitLoading']      = false;
            submit.status['containsNoError']    = false;
            $state.go('admin.categories-supermercados');
        };
        
    };

    function loadBanners() {
        console.log("Cargando Banners" + local);

                $scope.banner1= submit.ProductMeta.perfil.banners_destacados.banner1;
                var img = document.getElementById('banner1URL');
                img.src = $scope.banner1;

                $scope.banner2= submit.ProductMeta.perfil.banners_destacados.banner2;
                var img = document.getElementById('banner2URL');
                img.src = $scope.banner2;

                $scope.banner3= submit.ProductMeta.perfil.banners_destacados.banner3;
                var img = document.getElementById('banner3URL');
                img.src = $scope.banner3;
    };

    submit.banner1 = function (e, reader, file, fileList, fileOjects, fileObj) {
        var storageRef = firebase.storage().ref();
                var ImagenesRef = storageRef.child('destacados/'+ local +'/banner1').put(file);
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
                  $scope.banner1 = ImagenesRef.snapshot.downloadURL;
                  console.log($scope.banner1);
                    var img = document.getElementById('banner1URL');
                    img.src = $scope.banner1;
                });
    };
    submit.banner2 = function (e, reader, file, fileList, fileOjects, fileObj) {
        var storageRef = firebase.storage().ref();
                var ImagenesRef = storageRef.child('destacados/'+ local +'/banner2').put(file);
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
                  $scope.banner2 = ImagenesRef.snapshot.downloadURL;
                    var img = document.getElementById('banner2URL');
                    img.src = $scope.banner2;
                });
    };
    submit.banner3 = function (e, reader, file, fileList, fileOjects, fileObj) {
        var storageRef = firebase.storage().ref();
                var ImagenesRef = storageRef.child('destacados/'+ local +'/banner3').put(file);
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
                  $scope.banner3 = ImagenesRef.snapshot.downloadURL;
                    var img = document.getElementById('banner3URL');
                    img.src = $scope.banner3;
                });
    };
    
  
    /**
     * Used for filtering
     * *** put this on the SERVER
     */
    function addReferentialData() {
        // server values firebase
        submit.ProductMeta["timestamp_update"] = firebase.database.ServerValue.TIMESTAMP;
        if(!submit.ProductMeta.hasOwnProperty('timestamp_creation')) {
            submit.ProductMeta["timestamp_creation"] = firebase.database.ServerValue.TIMESTAMP;
        };
        
        // transform to timestamp
        if(submit.ProductMeta["discount_date_end_raw"]) {
            submit.ProductMeta["discount_date_end"] = submit.ProductMeta["discount_date_end_raw"].getTime();
        };
        
        
    };
    

    
    /**
     * 
     * Base 64 File Upload
     * *** Redo to one function
     * 
     */
    submit.dimensions = {
        screenshot: {
            w: 400,
            h: 400
        }
    };

    
    // screenshots
    var ProductImagesArray = [];
    submit.onLoad9 = function (e, reader, file, fileList, fileOjects, fileObj) {
        Utils.resizeImage("canvas9", fileObj.base64, submit.dimensions["screenshot"].w, submit.dimensions["screenshot"].h).then(
            function(resizedBase64){
                ProductImagesArray.push(resizedBase64);
                transformArrayToScreenshot();
            }, function(error){
                //console.log(error)
            }
        )
    };
    
    submit.removeScreenshot = function(key){
        var index = key.match(/\d+/)[0];
        //console.log('remove', key, index)
        //console.log(ProductImagesArray)
        ProductImagesArray.splice(index-1, 1);
        transformArrayToScreenshot();
    };
    
    // takes ProductImagesArray and sets in ProductsImages  
    function transformArrayToScreenshot() {
      submit.ProductImages = {};
      for (var i = 0; i<ProductImagesArray.length; i++) {
          var iter = i+1;
          submit.ProductImages['screenshot' + iter] = ProductImagesArray[i];
      }
    };
    
    function initProductArray() {
        var iter = 0;
        angular.forEach(submit.ProductImages, function(value, key){
            if(key != 'icon') {
                ProductImagesArray[iter] = value;
                iter = iter+1; 
            }
        })
    };
    
    
    // handling 
    // v2
    function processScreenshotsData(ScreenshotsData) {
        submit.ProductImages = ScreenshotsData;
        initProductArray();
        submit.status['loadingScreenshots'] = false;
    };
    
    
    // -------------------------------------------------------------------------
    // Attributes
    submit.addAttributeType = function() {
        var aType = submit.status.newAttributeType;
        console.log('adding type', aType)
        if(aType) {
            if(submit.ProductMeta.hasOwnProperty('attributes')){
                submit.ProductMeta['attributes'][aType] = {}
            } else {
                var tempObj = {};
                tempObj[submit.status.newAttributeType] = {};
                submit.ProductMeta['attributes'] = tempObj;
            }
        }
        console.log(submit.ProductMeta['attributes'])
    };
    submit.deleteAttributeType = function(aType) {
        delete submit.ProductMeta['attributes'][aType]
    };
    
    submit.addAttributeValue = function() {
        var aValue = submit.status.newAttributeValue;
        var aType = submit.status.selectedAttributeType;
        console.log('adding value', aValue, aType)
        if(aValue && aType) {
            submit.ProductMeta['attributes'][aType][aValue] = true;
        };
    };
    
    submit.deleteAttributeValue = function(aType, aValue) {
        delete submit.ProductMeta['attributes'][aType][aValue];
    };
    
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    
    
    /**
     * Other helpers and buttons
     */
    function scrollToSubmitEnd() {
        $location.hash('submit0');
        $anchorScroll.yOffset = 100;
        $anchorScroll();
    };
    
    // -------------------------------------------------------------------------
    // navigation wise 
    
    submit.goTo = function(nextState) {
        $state.go(nextState);
    };
    
    // -------------------------------------------------------------------------
    // Validate submitform
    
    
    function validarPromocion() {
        submit.ErrorMessages = {};
        submit.status['containsNoError'] = true;

        //
        // Titulo
        var titulo = document.getElementById("titulo").value;
        if( titulo== "" || 
            titulo == null ||
            titulo == undefined){
            submit.ErrorMessages["titulo"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["titulo"] =  "";
        }

        //
        // Descripcion
        var descripcion = document.getElementById("descripcion").value;
        if( descripcion== "" || 
            descripcion == null ||
            descripcion == undefined){
            submit.ErrorMessages["descripcion"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["descripcion"] =  "";
        }

        //
        // Fecha Inicio
        var fecha_inicio = document.getElementById("fecha_inicio").value;
        if( fecha_inicio== "" || 
            fecha_inicio == null ||
            fecha_inicio == undefined){
            submit.ErrorMessages["fecha_inicio"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["fecha_inicio"] =  "";
        }

        //
        // Fecha Fin
        var fecha_fin = document.getElementById("fecha_fin").value;
        if( fecha_fin== "" || 
            fecha_fin == null ||
            fecha_fin == undefined){
            submit.ErrorMessages["fecha_fin"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["fecha_fin"] =  "";
        }

        //
        // Categoria
        var categoria = document.getElementById("categoria").value;
        if( categoria== "" || 
            categoria == null ||
            categoria == undefined){
            submit.ErrorMessages["categoria"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["categoria"] =  "";
        }

        //
        // generic
        if (!submit.status['containsNoError']) {
            submit.status['submitLoading'] = false;
            submit.ErrorMessages['general'] = 
            "Hay campos que deben ser completados";
        };


        return submit.status['containsNoError'];
    };

    function validarEdicion() {
        submit.ErrorMessages = {};
        submit.status['containsNoError'] = true;

        //
        // Nombre del Comercio
        var nombre = document.getElementById("nombre").value;
        if( nombre== "" || 
            nombre == null ||
            nombre == undefined){
            submit.ErrorMessages["nombre"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["nombre"] =  "";
        }

        //
        // Email
        var email = document.getElementById("email").value;
        if( email== "" || 
            email == null ||
            email == undefined){
            submit.ErrorMessages["email"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["email"] =  "";
        }

        //
        // Telefono
        var telefono = document.getElementById("telefono").value;
        if( telefono== "" || 
            telefono == null ||
            telefono == undefined){
            submit.ErrorMessages["telefono"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["telefono"] =  "";
        }

        //
        // generic
        if (!submit.status['containsNoError']) {
            submit.status['submitLoading'] = false;
            submit.ErrorMessages['general'] = 
            "Hay campos que deben ser completados";
        };


        return submit.status['containsNoError'];
    };

    function validateProductMeta() {
        submit.ErrorMessages = {};
        submit.status['containsNoError'] = true;

        //
        // Nombre del Comercio
        var nombre = document.getElementById("nombre").value;
        if( nombre== "" || 
            nombre == null ||
            nombre == undefined){
            submit.ErrorMessages["nombre"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["nombre"] =  "";
        }

        //
        // Slug
        var slug = document.getElementById("slug").value;
        if( slug== "" || 
            slug == null ||
            slug == undefined){
            submit.ErrorMessages["slug"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["slug"] =  "";
        }

        //
        // Email
        var email = document.getElementById("email").value;
        if( email== "" || 
            email == null ||
            email == undefined){
            submit.ErrorMessages["email"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["email"] =  "";
        }

        //
        // Telefono
        var telefono = document.getElementById("telefono").value;
        if( telefono== "" || 
            telefono == null ||
            telefono == undefined){
            submit.ErrorMessages["telefono"] = "*";
            submit.status['containsNoError'] = false;
        }else{
            submit.ErrorMessages["telefono"] =  "";
        }

        //
        // generic
        if (!submit.status['containsNoError']) {
            submit.status['submitLoading'] = false;
            submit.ErrorMessages['general'] = 
            "Hay campos que deben ser completados";
        };


        return submit.status['containsNoError'];
    }; 
})