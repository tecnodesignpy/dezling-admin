angular.module('noodlio.services-settings', [])

.factory('CentrosComerciales', function($q, FireFunc) {

  var self = this;
  self.all = {};
  self.promociones = {};
  self.beneficios = {};

  self.get = function() {
    var qCat = $q.defer();
    FireFunc.onValue('categorias/centros_comerciales/comercios').then(function(result){
      if(result != null) {
        self.all = result;
      } else {
        self.all = {};
      }
      qCat.resolve(self.all);
    },
    function(error){
      qCat.reject(error);
    })
    return qCat.promise;
  };

  self.getBeneficios = function(shopping) {
    var qCat = $q.defer();
    FireFunc.onValue('categorias/centros_comerciales/comercios/'+shopping+'/beneficios').then(function(result){
      if(result != null) {
        self.beneficios = result;
      } else {
        self.beneficios = {};
      }
      qCat.resolve(self.beneficios);
    },
    function(error){
      qCat.reject(error);
    })
    return qCat.promise;
  };

  self.getPromociones = function(shoppping) {
    var qCat = $q.defer();
    FireFunc.onValue('categorias/centros_comerciales/comercios/'+shoppping+'/promociones').then(function(result){
      if(result != null) {
        self.promociones = result;
      } else {
        self.promociones = {};
      }
      qCat.resolve(self.promociones);
    },
    function(error){
      qCat.reject(error);
    })
    return qCat.promise;
  };

  self.set = function(CategoriesObj) {
    return FireFunc.set('categorias/centros_comerciales/comercios', CategoriesObj);
  };

  return self;
})

.factory('Locales', function($q, FireFunc) {

  var self = this;
  self.all = {};
  self.promociones = {};

  self.get = function(local) {
    var qCat = $q.defer();
    FireFunc.onValue('categorias/centros_comerciales/comercios/'+local+'/locales').then(function(result){
      if(result != null) {
        self.all = result;
      } else {
        self.all = {};
      }
      qCat.resolve(self.all);
    },
    function(error){
      qCat.reject(error);
    })
    return qCat.promise;
  };

  self.getPromociones = function(shoppping,local) {
    var qCat = $q.defer();
    FireFunc.onValue('categorias/centros_comerciales/comercios/'+shoppping+'/locales/'+ local +'/promociones').then(function(result){
      if(result != null) {
        self.promociones = result;
      } else {
        self.promociones = {};
      }
      qCat.resolve(self.promociones);
    },
    function(error){
      qCat.reject(error);
    })
    return qCat.promise;
  };

  self.set = function(CategoriesObj) {
    return FireFunc.set('categorias/centros_comerciales/comercios/locales', CategoriesObj);
  };

  return self;
})

.factory('Sponsor', function($q, FireFunc) {

  var self = this;
  self.all = {};
  self.SponsorMeta = {};

  self.get = function() {
    var qCat = $q.defer();
    FireFunc.onValue('sponsors').then(function(result){
      if(result != null) {
        self.all = result;
      } else {
        self.all = {};
      }
      qCat.resolve(self.all);
    },
    function(error){
      qCat.reject(error);
    })
    return qCat.promise;
  };

  self.getSponsor = function(id) {
    var qCat = $q.defer();
    FireFunc.onValue('sponsors/' + id ).then(function(result){
      if(result != null) {
        self.SponsorMeta = result;
      } else {
        self.SponsorMeta = {};
      }
      qCat.resolve(self.SponsorMeta);
    },
    function(error){
      qCat.reject(error);
    })
    return qCat.promise;
  };

  self.set = function(CategoriesObj) {
    return FireFunc.set('sponsors', CategoriesObj);
  };

  self.eliminar = function(CategoriesObj) {
    console.log(CategoriesObj);
    return firebase.database().ref('sponsors/'+CategoriesObj+'/').remove();
  };

    // Hacemos Submit al nuevo Comercio, lo agregamos a la base de datos
    self.submitSponsor = function(SponsorMeta, ProductImages) {
      console.log("submit");
        var database = firebase.database();

        var funcion = firebase.database().ref('sponsors/').push({
                            titulo: SponsorMeta.titulo,
                            descripcion: SponsorMeta.descripcion,
                            fechainicio: SponsorMeta.fechainicio,
                            fechafin: SponsorMeta.fechafin,
                            banner: ProductImages
          });
        return funcion;
    };

    // Hacemos Submit al nuevo Comercio, lo agregamos a la base de datos
    self.editSponsor = function(SponsorMeta, ProductImages,idSponsor) {
      console.log("submit");
        var database = firebase.database();

        var funcion = firebase.database().ref('sponsors/'+idSponsor+'/').update({
                            titulo: SponsorMeta.titulo,
                            descripcion: SponsorMeta.descripcion,
                            fechainicio: SponsorMeta.fechainicio,
                            fechafin: SponsorMeta.fechafin,
                            banner: ProductImages
          });
        return funcion;
    };

  return self;
})

.factory('Destacado', function($q, FireFunc) {

  var self = this;
  self.all = {};
  self.SponsorMeta = {};

  self.get = function() {
    var qCat = $q.defer();
    FireFunc.onValue('destacados').then(function(result){
      if(result != null) {
        self.all = result;
      } else {
        self.all = {};
      }
      qCat.resolve(self.all);
    },
    function(error){
      qCat.reject(error);
    })
    return qCat.promise;
  };

  self.getSponsor = function(id) {
    var qCat = $q.defer();
    FireFunc.onValue('destacados/' + id ).then(function(result){
      if(result != null) {
        self.SponsorMeta = result;
      } else {
        self.SponsorMeta = {};
      }
      qCat.resolve(self.SponsorMeta);
    },
    function(error){
      qCat.reject(error);
    })
    return qCat.promise;
  };

  self.set = function(CategoriesObj) {
    return FireFunc.set('destacados', CategoriesObj);
  };

  self.eliminar = function(CategoriesObj) {
    console.log(CategoriesObj);
    return firebase.database().ref('destacados/'+CategoriesObj+'/').remove();
  };

    // Hacemos Submit al nuevo Comercio, lo agregamos a la base de datos
    self.submitSponsor = function(SponsorMeta, ProductImages) {
      console.log("submit");
        var database = firebase.database();

        var funcion = firebase.database().ref('destacados/').push({
                            titulo: SponsorMeta.titulo,
                            descripcion: SponsorMeta.descripcion,
                            fechainicio: SponsorMeta.fechainicio,
                            fechafin: SponsorMeta.fechafin,
                            banner: ProductImages
          });
        return funcion;
    };

    // Hacemos Submit al nuevo Comercio, lo agregamos a la base de datos
    self.editSponsor = function(SponsorMeta, ProductImages,idSponsor) {
      console.log("submit");
        var database = firebase.database();

        var funcion = firebase.database().ref('destacados/'+idSponsor+'/').update({
                            titulo: SponsorMeta.titulo,
                            descripcion: SponsorMeta.descripcion,
                            fechainicio: SponsorMeta.fechainicio,
                            fechafin: SponsorMeta.fechafin,
                            banner: ProductImages
          });
        return funcion;
    };

  return self;
})

.factory('MultiMarcas', function($q, FireFunc) {

  var self = this;
  self.all = {};
  self.promociones = {};
  self.beneficios = {};

  self.get = function() {
    var qCat = $q.defer();
    FireFunc.onValue('categorias/multimarcas/comercios').then(function(result){
      if(result != null) {
        self.all = result;
      } else {
        self.all = {};
      }
      qCat.resolve(self.all);
    },
    function(error){
      qCat.reject(error);
    })
    return qCat.promise;
  };

  self.getBeneficios = function(shopping) {
    var qCat = $q.defer();
    FireFunc.onValue('categorias/multimarcas/comercios/'+shopping+'/beneficios').then(function(result){
      if(result != null) {
        self.beneficios = result;
      } else {
        self.beneficios = {};
      }
      qCat.resolve(self.beneficios);
    },
    function(error){
      qCat.reject(error);
    })
    return qCat.promise;
  };

  self.getPromociones = function(shoppping) {
    var qCat = $q.defer();
    FireFunc.onValue('categorias/multimarcas/comercios/'+shoppping+'/promociones').then(function(result){
      if(result != null) {
        self.promociones = result;
      } else {
        self.promociones = {};
      }
      qCat.resolve(self.promociones);
    },
    function(error){
      qCat.reject(error);
    })
    return qCat.promise;
  };

  self.set = function(CategoriesObj) {
    return FireFunc.set('categorias/multimarcas/comercios', CategoriesObj);
  };

  return self;
})

.factory('MultiSucursales', function($q, FireFunc) {

  var self = this;
  self.all = {};
  self.promociones = {};

  self.get = function(local) {
    var qCat = $q.defer();
    FireFunc.onValue('categorias/multimarcas/comercios/'+local+'/locales').then(function(result){
      if(result != null) {
        self.all = result;
      } else {
        self.all = {};
      }
      qCat.resolve(self.all);
    },
    function(error){
      qCat.reject(error);
    })
    return qCat.promise;
  };

  self.getPromociones = function(shoppping,local) {
    var qCat = $q.defer();
    FireFunc.onValue('categorias/multimarcas/comercios/'+shoppping+'/locales/'+ local +'/promociones').then(function(result){
      if(result != null) {
        self.promociones = result;
      } else {
        self.promociones = {};
      }
      qCat.resolve(self.promociones);
    },
    function(error){
      qCat.reject(error);
    })
    return qCat.promise;
  };

  self.set = function(CategoriesObj) {
    return FireFunc.set('categorias/multimarcas/comercios/locales', CategoriesObj);
  };

  return self;
})

.factory('Supermercados', function($q, FireFunc) {

  var self = this;
  self.all = {};
  self.promociones = {};
  self.beneficios = {};

  self.get = function() {
    var qCat = $q.defer();
    FireFunc.onValue('categorias/supermercados/comercios').then(function(result){
      if(result != null) {
        self.all = result;
      } else {
        self.all = {};
      }
      qCat.resolve(self.all);
    },
    function(error){
      qCat.reject(error);
    })
    return qCat.promise;
  };

  self.getBeneficios = function(shopping) {
    var qCat = $q.defer();
    FireFunc.onValue('categorias/supermercados/comercios/'+shopping+'/beneficios').then(function(result){
      if(result != null) {
        self.beneficios = result;
      } else {
        self.beneficios = {};
      }
      qCat.resolve(self.beneficios);
    },
    function(error){
      qCat.reject(error);
    })
    return qCat.promise;
  };

  self.getPromociones = function(shoppping) {
    var qCat = $q.defer();
    FireFunc.onValue('categorias/supermercados/comercios/'+shoppping+'/promociones').then(function(result){
      if(result != null) {
        self.promociones = result;
      } else {
        self.promociones = {};
      }
      qCat.resolve(self.promociones);
    },
    function(error){
      qCat.reject(error);
    })
    return qCat.promise;
  };

  self.set = function(CategoriesObj) {
    return FireFunc.set('categorias/supermercados/comercios', CategoriesObj);
  };

  return self;
})

.factory('SuperSucursales', function($q, FireFunc) {

  var self = this;
  self.all = {};
  self.promociones = {};

  self.get = function(local) {
    var qCat = $q.defer();
    FireFunc.onValue('categorias/supermercados/comercios/'+local+'/locales').then(function(result){
      if(result != null) {
        self.all = result;
      } else {
        self.all = {};
      }
      qCat.resolve(self.all);
    },
    function(error){
      qCat.reject(error);
    })
    return qCat.promise;
  };

  self.getPromociones = function(shoppping,local) {
    var qCat = $q.defer();
    FireFunc.onValue('categorias/supermercados/comercios/'+shoppping+'/locales/'+ local +'/promociones').then(function(result){
      if(result != null) {
        self.promociones = result;
      } else {
        self.promociones = {};
      }
      qCat.resolve(self.promociones);
    },
    function(error){
      qCat.reject(error);
    })
    return qCat.promise;
  };

  self.set = function(CategoriesObj) {
    return FireFunc.set('categorias/supermercados/comercios/locales', CategoriesObj);
  };

  return self;
})