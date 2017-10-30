angular.module('noodlio.services-auth', [])

.factory('Auth', function($q, FireFunc) {
    var self = this;

    self.AuthData = {};
    
    onAuth().then(function(AuthData){
      console.log(AuthData)
      self.AuthData = AuthData;
    })

    /**
     * E-mail Firebase Authentication
     * https://firebase.google.com/docs/auth/web/password-auth
     * v3
     */
    self.authWithEmail = function(userEmail, userPassword) {
        var qAuth = $q.defer();
        firebase.auth().signInWithEmailAndPassword(userEmail, userPassword)
        .then(function(AuthData){

          self.checkAdminRights(AuthData.uid).then(
              function(success){
                  console.log("Autenticacion Exitosa", AuthData);

                  self.AuthData = AuthData;
                  qAuth.resolve(AuthData);
              },
              function(error){
                  console.log("Login fallido!", error)

                  qAuth.reject(error);
              }
          );

        })
        .catch(function(error) {
            if(error.code == 'auth/network-request-failed') {
                error['message'] = "Oops... It seems that your browser is not supported. Please download Google Chrome or Safari and try again."
            };
            console.log(error);
            qAuth.reject(error);
        });
        return qAuth.promise;
    };

    // v3
    self.checkAdminRights = function(uid) {
        var qGet = $q.defer();
        var childRef = "admin";
        FireFunc.onValue(childRef).then(function(allowedUID){
          console.log(allowedUID);
          var EsAdmin =false;

          for (var index = 0; index < allowedUID.length; ++index) {

           var admin = allowedUID[index];
           console.log(admin);
           if(admin === uid && admin != null){
             console.log("SI ES ADMIN");
             EsAdmin = true;
             break;
            }
          }
          
          if(EsAdmin) {
              qGet.resolve(allowedUID);
          } else {
              qGet.reject("AUTH_NO_ACCESS");
          }
          
        },
        function(error){
          qGet.reject(error);
        })
        return qGet.promise;
    }


    /**
     * Monitor the authentication state
     * https://www.firebase.com/docs/web/guide/user-auth.html#section-monitoring-authentication
     */
    self.checkAuthState = function() {
        return onAuth();
    };


    /**
     * v3
     * unAuthenticate the user
     * independent of method (password, twitter, etc.)
     */
    self.unAuth = function() {
      var qSignOut = $q.defer();
      firebase.auth().signOut().then(function() {
        qSignOut.resolve();
      }, function(error) {
        qSignOut.reject(error);
      });
      return qSignOut.promise;
    };

    /**
     * v3
     * Monitor the current authentication state
     * returns on success:  AuthData
     * returns on fail:     AUTH_LOGGED_OUT
     */
      function onAuth() {
        var qCheck = $q.defer();
        firebase.auth().onAuthStateChanged(
          function(user) {
            if (user) {
              self.AuthData = user;//gv
              qCheck.resolve(user);
            } else {
              console.log("No esta logeado");
              qCheck.reject("AUTH_LOGGED_OUT");
            };
        });
        return qCheck.promise;
      };

    return self;
})
