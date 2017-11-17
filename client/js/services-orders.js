angular.module('noodlio.services-orders', [])


.factory('UserService', function($q, FireFunc) {
  var self = this;


  // get user profile
  self.getUsuarios = function() {
    var childRef = "users/";
    return FireFunc.onValue(childRef);
  };
  self.getUsuario = function(id) {
    var childRef = "users/"+id;
    return FireFunc.onValue(childRef);
  };
  self.getListas = function(id) {
    var childRef = "users/"+id+"/listado";
    return FireFunc.onValue(childRef);
  };
  self.getFavoritos = function(id) {
    var childRef = "users/"+id+"/favoritos";
    return FireFunc.onValue(childRef);
  };



  return self;

});
