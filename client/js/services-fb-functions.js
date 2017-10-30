angular.module('noodlio.services-fb-functions', [])

/**
 * Generic Firebase Functions (get, set, push, remove, etc.) wrapped in promises
 */
.factory('FireFunc', function($q) {
  var self = this;

  // fn load
  // v3
  self.onValue = function(childRef) {
    var qGet = $q.defer();
    firebase.database().ref(childRef).on('value', function(snapshot) {
        qGet.resolve(snapshot.val());
    }, function(error){
        qGet.reject(error);
    });
    return qGet.promise;
  };

  // v3
  self.onValueSort = function(childRef, sortNode, limitValue) {
    var qGet = $q.defer();
    firebase.database().ref(childRef).orderByChild(sortNode).limitToLast(limitValue).on('value', function(snapshot) {
        qGet.resolve(snapshot.val());
    }, function(error){
        qGet.reject(error);
    });
    return qGet.promise;
  };

  // fn set
  // v3
  self.set = function(childRef, SetObject) {
    var qAdd = $q.defer();
    var updates = {};
    updates[childRef] = SetObject;
    firebase.database().ref().update(updates)
    .then(function(success){
        qAdd.resolve(success);
    }).catch(function(error){
        qAdd.reject(error);
    });
    return qAdd.promise;
  };

  // fn update
  // v3
  self.update = function(updates) {
    var qUpdate = $q.defer();
    firebase.database().ref().update(updates)
    .then(function(success){
        qUpdate.resolve(success);
    }).catch(function(error){
        qUpdate.reject(error);
    });
    return qUpdate.promise;
  };

  // fn remove
  // v3
  self.remove = function(childRef) {
    var qDel = $q.defer();
    var updates = {};
    updates[childRef] = null;
    firebase.database().ref().update(updates)
    .then(function(success){
        qDel.resolve("REMOVE_SUCCESS");
    }).catch(function(error){
        qDel.reject(error);
    });
    return qDel.promise;
  };

  return self;
})
