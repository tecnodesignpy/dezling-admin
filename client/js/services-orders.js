angular.module('noodlio.services-orders', [])


.factory('UserService', function($q, FireFunc) {
  var self = this;


  // get user profile
  self.getUsuarios = function() {
    var childRef = "users/";
    return FireFunc.onValue(childRef);
  };



  return self;

});
