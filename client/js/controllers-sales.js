angular.module('noodlio.controllers-sales', [])


.controller('SalesCtrl', function($location, $anchorScroll, $stateParams, $state, 
    Auth, Utils, OrdersManager) {
        
    var sales               = this;
    sales.AuthData          = Auth.AuthData;
    sales.status            = {'loading': true};
    sales.ProductsMeta      = {}; //**
    sales.ProductsIcons     = {}; //**
    sales.SalesObj          = {}; //**

    sales.initView = function() {
        $location.hash('page-top');
        $anchorScroll();
        
        checkAuth();
        
    };
    
    function checkAuth() { // can be put in a resolve in app.js
            Auth.checkAuthState().then(
                function(loggedIn){
                    sales.AuthData = Auth.AuthData;
                    
                    // -->
                    loadLatestSales();
                },
                function(notLoggedIn) {
                    $state.go('admin.login')
                }
            )
    };
    
    // sales is here a synonym for orders
    function loadLatestSales() {
        if(sales.AuthData.hasOwnProperty('uid')){
          sales.status['loading'] = true;
          OrdersManager.getAllOrders().then(
            function(OrdersDataArray){
              sales.totalSales = OrdersManager.totalSales;
              sales.OrdersDataArray  = OrdersDataArray;
              sales.status['loading'] = false;
    
              if(sales.OrdersDataArray == null) {
                sales.status['no-orders'] = true;
                sales.status["generalmessage"] = "No sales yet";
              }
            },
            function(error){
              // handle your errors here
              sales.status["generalmessage"] = "Oops.. something went wrong :(";
              sales.status['loading'] = false;
              console.log(error);
            }
          );
        };
        
    };
    
    
    
    
    sales.formatTimestamp = function(timestamp) {
        return Utils.formatTimestamp(timestamp);
    };
    
    sales.goTo = function(nextState) {
        $state.go(nextState);  
    };
    
    sales.goToOrder = function(notUsed, orderId) {
      for(var i=0; i<sales.OrdersDataArray.length; i++) {
        if(sales.OrdersDataArray[i].key == orderId){
          $state.go('admin.sales-detail', {index: i, orderId: orderId});  
          break
        }
      }
    };
    
    
})

// detail
.controller('SalesDetailCtrl', function($state, $stateParams, Utils, OrdersManager) {
  var sdetail = this;

  sdetail.status = {
    loading: true
  };
    
  sdetail.initView = function() {
    if($stateParams.orderId != undefined && $stateParams.orderId != null && $stateParams.orderId != "" &&
       $stateParams.index != undefined && $stateParams.index != null && $stateParams.index != "") {
        if(OrdersManager.OrdersDataArray.length <= 0){
          $state.go('admin.sales');
        } else {
          sdetail.OrderData            = OrdersManager.OrdersDataArray[$stateParams.index];  //console.log(sdetail.OrderData)
          
          // hack to make it compatible with checkoutCartOverview (same code for consistency)
          sdetail.orderId              = $stateParams.orderId;
          sdetail.CachedTotal = sdetail.OrderData.value.CachedTotal;
          sdetail.CachedMeta = sdetail.OrderData.value.CachedMeta;
          sdetail.CachedList = sdetail.OrderData.value.CachedList;
          
          // -->
          getUserData(sdetail.OrderData.userId)
          
        }
    } else {
      $state.go('admin.sales');
    };
  };
  
  // load user address
  function getUserData(userId) {
    OrdersManager.getUserProfile(userId).then(
      function(UserData){
        if(UserData == null){
          sdetail.status['generalmessage'] = "User has not specified an address";
        } else {
          sdetail.UserData = UserData;
        }
        sdetail.status['loading'] = false;
      },
      function(error){
        sdetail.status['generalmessage'] = "Could not retrieve address of user";
        sdetail.status['loading'] = false;
      }
    )
  };

  // helper functions
  sdetail.formatTimestamp = function(timestamp) {
    return Utils.formatTimestamp(timestamp);
  };
  
  sdetail.goTo = function(nextState) {
    $state.go(nextState);  
  };
})



