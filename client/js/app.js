/**
 * Dezling App
 *
 * @version: v1.0
 * @date: 2017
 * @author: Abel Ledezma <ledezmatto@tecnodesign.com.py>
 * @website: www.tecnodesign.com.py
 *
*/

angular.module('noodlio', [
  'ui.router',
  'naif.base64',
  'btford.markdown',
  'noodlio.controllers-account',
  'noodlio.controllers-home',
  'noodlio.controllers-categories',
  'noodlio.controllers-settings-fees',
  'noodlio.controllers-items',
  'noodlio.controllers-sales',
  'noodlio.controllers-navbar',
  'noodlio.controllers-submit',
  'noodlio.services-auth',              // v3
  'noodlio.services-settings',          // v3
  'noodlio.services-products',          // v3 identical to ionic-app
  'noodlio.services-orders',            // v3
  'noodlio.services-utils',             // -
  'noodlio.services-fb-functions',    // v3
  'ui.bootstrap',
  'chart.js',
  ]
)

.config(function($stateProvider, $urlRouterProvider, $locationProvider) {

    $locationProvider.html5Mode(false);
    $locationProvider.hashPrefix('');
    $urlRouterProvider.otherwise('/admin/home');
    /*
      Chequeamos si el usuario esta autenticado
    */
    var authResolve = function (Auth) {
      return Auth.checkAuthState();
    };


    $stateProvider
    // Website
    /*
    .state('web', {
        url: '/',
        templateUrl: '/templates/web.html',

    })
    */
    // abstract state in the form of a navbar
    .state('admin', {
        url: '/admin',
        templateUrl: '/templates/navbar.html',
        abstract: true,
        controller:'NavBarCtrl as navbar'
    })

    // Panel de Control del Administrador, si no esta logeado le redireccion al login.
    .state('admin.home', {
        url: '/home',
        templateUrl: '/templates/home.html',
        controller:'HomeCtrl as home',

    })

    /*
            CENTRO COMERCIALES
    */
              /*  CATEGORIAS  */

                      // Visualiza los Centros Comerciales
                      .state('admin.categories-centros_comerciales', {
                          url: '/categories/centros_comerciales',
                          templateUrl: '/templates/shoppings/categories_centros.html',
                          controller:'CateCentrosComercialesCtrl as categories',
                          resolve: {authResolve: authResolve}
                      })
                      // Agrega o Edita un Centro Comercial, productId es el valor del slug de cada centro comercial
                      .state('admin.submitCentrosComerciales', {
                          url: '/submit/CentrosComerciales/:productId',
                          templateUrl: '/templates/shoppings/submit_centros.html',
                          controller:'SubmitCentros as submit',
                          resolve: {authResolve: authResolve}
                      })
                      // Visualiza las Promociones del Centro Comercial, le pasamos el slug del centro comercial en la variable :shopping
                      .state('admin.promocionesCentrosComerciales', {
                          url: '/categories/centros_comerciales/promociones/:shopping',
                          templateUrl: '/templates/shoppings/promociones_shopping.html',
                          controller:'CateCentrosComercialesCtrl as categories',
                          resolve: {authResolve: authResolve}
                      })
                      // Agrega o Edita una promocion del Centro Comercial, si le pasamos la variables promo, edita, sino, agrega uno nuevo
                      .state('admin.SubmitpromocionesCentrosComerciales', {
                          url: '/categories/centros_comerciales/promociones/:shopping/submit/:promo',
                          templateUrl: '/templates/shoppings/submit_centros_promociones.html',
                          controller:'SubmitCentros as submit',
                          resolve: {authResolve: authResolve}
                      })
                      // Visualiza los Beneficios del Centro Comercial, le pasamos el slug del centro comercial en la variable :shopping
                      .state('admin.BeneficiosCentrosComerciales', {
                          url: '/categories/centros_comerciales/beneficios/:shopping',
                          templateUrl: '/templates/shoppings/beneficios_shopping.html',
                          controller:'BeneficiosShopping',
                          resolve: {authResolve: authResolve}
                      })
                      // Agrega o Edita un beneficio del Centro Comercial, si le pasamos la variables beneficio, edita, sino, agrega uno nuevo
                      .state('admin.SubmitBeneficioCentrosComerciales', {
                          url: '/categories/centros_comerciales/beneficios/:shopping/submit/:beneficio',
                          templateUrl: '/templates/shoppings/submit_centros_beneficios.html',
                          controller:'BeneficiosShopping',
                          resolve: {authResolve: authResolve}
                      })
              /*  FIN CATEGORIAS  */

              /*  LOCALES   */

                    // Visualiza los Locales del Centro Comercial
                      // Ej.: Adidas del Shopping del Sol
                    .state('admin.Locales', {
                        url: '/CentrosComerciales/:CentroComercial/Locales',
                        templateUrl: '/templates/shoppings/centros_comerciales.html',
                        controller:'LocalesCentros as locales',
                        resolve: {authResolve: authResolve}
                    })
                    // Agrega o Edita un Local del Centro Comercial, la variable :localId es el slug del local al que se quiere acceder
                    .state('admin.submitCentrosComercialesLocales', {
                        url: '/CentrosComerciales/:CentroComercial/:localId',
                        templateUrl: '/templates/shoppings/submit_centros_locales.html',
                        controller:'SubmitCentrosLocales as submit',
                        resolve: {authResolve: authResolve}
                    })
                      // Visualiza las Promociones del local
                      .state('admin.promocionesCentrosComercialesLocales', {
                          url: '/CentrosComerciales/promociones/:shopping/:localId',
                          templateUrl: '/templates/shoppings/promociones_shopping_locales.html',
                          controller:'LocalesCentros as locales',
                          resolve: {authResolve: authResolve}
                      })
                      // Agrega o Edita una promocion del local
                      .state('admin.SubmitpromocionesCentrosComercialesLocales', {
                          url: '/CentrosComerciales/promociones/:shopping/:localId/submit/:promo',
                          templateUrl: '/templates/shoppings/submit_centros_promociones_locales.html',
                          controller:'SubmitCentrosLocales as submit',
                          resolve: {authResolve: authResolve}
                      })
                      // Visualiza los Beneficios del Centro Comercial, le pasamos el slug del centro comercial en la variable :shopping
                      .state('admin.BeneficiosCentrosComercialesLocales', {
                          url: '/categories/centros_comerciales/:shopping/local/:local/beneficios',
                          templateUrl: '/templates/shoppings/beneficios_shopping_locales.html',
                          controller:'BeneficiosShoppingLocales',
                          resolve: {authResolve: authResolve}
                      })
                      // Agrega o Edita un beneficio del Centro Comercial, si le pasamos la variables beneficio, edita, sino, agrega uno nuevo
                      .state('admin.SubmitBeneficioCentrosComercialesLocales', {
                          url: '/categories/centros_comerciales/:shopping/local/:local/beneficios/submit/:beneficio',
                          templateUrl: '/templates/shoppings/submit_centros_beneficios_locales.html',
                          controller:'BeneficiosShoppingLocales',
                          resolve: {authResolve: authResolve}
                      })

              /*  FIN LOCALES   */


    /*
            FIN CENTRO COMERCIALES
    */

    /*
            MULTIMARCAS
    */
              /*  CATEGORIAS  */

                      // Visualiza las Multimarcas
                      .state('admin.categories-multimarcas', {
                          url: '/categories/multimarcas',
                          templateUrl: '/templates/multimarcas/categories_multimarcas.html',
                          controller:'MultiMarcasCtrl',
                          resolve: {authResolve: authResolve}
                      })
                      // Agrega o Edita un Centro Comercial, productId es el valor del slug de cada centro comercial
                      .state('admin.submitMultimarcas', {
                          url: '/submit/multimarcas/:productId',
                          templateUrl: '/templates/multimarcas/submit_multimarcas.html',
                          controller:'SubmitMultiMarcas',
                          resolve: {authResolve: authResolve}
                      })
                      // Visualiza las Promociones del Centro Comercial, le pasamos el slug del centro comercial en la variable :shopping
                      .state('admin.promocionesMultimarcas', {
                          url: '/categories/multimarcas/promociones/:multimarca',
                          templateUrl: '/templates/multimarcas/promociones_multimarcas.html',
                          controller:'MultiMarcasCtrl',
                          resolve: {authResolve: authResolve}
                      })
                      // Agrega o Edita una promocion del Centro Comercial, si le pasamos la variables promo, edita, sino, agrega uno nuevo
                      .state('admin.SubmitpromocionesMultimarcas', {
                          url: '/categories/multimarcas/promociones/:shopping/submit/:promo',
                          templateUrl: '/templates/multimarcas/submit_multimarcas_promociones.html',
                          controller:'SubmitMultiMarcas',
                          resolve: {authResolve: authResolve}
                      })
                      // Visualiza los Beneficios del Centro Comercial, le pasamos el slug del centro comercial en la variable :shopping
                      .state('admin.BeneficiosMultimarcas', {
                          url: '/categories/multimarcas/beneficios/:shopping',
                          templateUrl: '/templates/multimarcas/beneficios_multimarcas.html',
                          controller:'BeneficiosMultimarcas',
                          resolve: {authResolve: authResolve}
                      })
                      // Agrega o Edita un beneficio del Centro Comercial, si le pasamos la variables beneficio, edita, sino, agrega uno nuevo
                      .state('admin.SubmitBeneficiosMultiMarcas', {
                          url: '/categories/multimarcas/beneficios/:shopping/submit/:beneficio',
                          templateUrl: '/templates/multimarcas/submit_multimarcas_beneficios.html',
                          controller:'BeneficiosMultimarcas',
                          resolve: {authResolve: authResolve}
                      })
              /*  FIN CATEGORIAS  */

              /*  LOCALES   */

                    // Visualiza los Locales del Centro Comercial
                      // Ej.: Adidas del Shopping del Sol
                    .state('admin.SucursalesMultimarcas', {
                        url: '/multimarcas/:CentroComercial/sucursales',
                        templateUrl: '/templates/multimarcas/sucursales_multimarcas.html',
                        controller:'SucursalesMultimarcas as locales',
                          resolve: {authResolve: authResolve}
                    })
                    // Agrega o Edita un Local del Centro Comercial, la variable :localId es el slug del local al que se quiere acceder
                    .state('admin.submitSucursalesMultimarcas', {
                        url: '/multimarcas/:CentroComercial/:localId',
                        templateUrl: '/templates/multimarcas/submit_multimarcas_sucursales.html',
                        controller:'SubmitMultimarcasSucursales as submit',
                          resolve: {authResolve: authResolve}
                    })
                      // Visualiza las Promociones del local
                      .state('admin.promocionesSucursalesMultimarcas', {
                          url: '/multimarcas/promociones/:shopping/:localId',
                          templateUrl: '/templates/multimarcas/promociones_multimarcas_sucursales.html',
                          controller:'SucursalesMultimarcas as locales',
                          resolve: {authResolve: authResolve}
                      })
                      // Agrega o Edita una promocion del local
                      .state('admin.SubmitpromocionesSucursalesMultimarcas', {
                          url: '/multimarcas/promociones/:shopping/:localId/submit/:promo',
                          templateUrl: '/templates/multimarcas/submit_multimarcas_promociones_sucursales.html',
                          controller:'SubmitMultimarcasSucursales as submit',
                          resolve: {authResolve: authResolve}
                      })
                      // Visualiza los Beneficios del Centro Comercial, le pasamos el slug del centro comercial en la variable :shopping
                      .state('admin.BeneficiosMultimarcasSucursales', {
                          url: '/categories/multimarcas/:shopping/local/:local/beneficios',
                          templateUrl: '/templates/shoppings/beneficios_multimarcas_sucursales.html',
                          controller:'BeneficiosShoppingLocales',
                          resolve: {authResolve: authResolve}
                      })
                      // Agrega o Edita un beneficio del Centro Comercial, si le pasamos la variables beneficio, edita, sino, agrega uno nuevo
                      .state('admin.SubmitBeneficioMultimarcasSucursales', {
                          url: '/categories/multimarcas/:shopping/local/:local/beneficios/submit/:beneficio',
                          templateUrl: '/templates/shoppings/submit_multimarcas_beneficios_sucursales.html',
                          controller:'BeneficiosShoppingLocales',
                          resolve: {authResolve: authResolve}
                      })

              /*  FIN LOCALES   */


    /*
            FIN MULTIMARCAS
    */

    /*
            SUPERMERCADOS
    */
              /*  CATEGORIAS  */
              
                      // Visualiza las Multimarcas
                      .state('admin.categories-supermercados', {
                          url: '/categories/supermercados',
                          templateUrl: '/templates/supermercados/categories_supermercados.html',
                          controller:'SupermercadosCtrl',
                          resolve: {authResolve: authResolve}
                      })
                      // Agrega o Edita un Centro Comercial, productId es el valor del slug de cada centro comercial
                      .state('admin.submitSupermercados', {
                          url: '/submit/supermercados/:productId',
                          templateUrl: '/templates/supermercados/submit_supermercados.html',
                          controller:'SubmitSupermercados',
                          resolve: {authResolve: authResolve}
                      })
                      // Visualiza las Promociones del Centro Comercial, le pasamos el slug del centro comercial en la variable :shopping
                      .state('admin.promocionesSupermercados', {
                          url: '/categories/supermercados/promociones/:multimarca',
                          templateUrl: '/templates/supermercados/promociones_supermercados.html',
                          controller:'SupermercadosCtrl',
                          resolve: {authResolve: authResolve}
                      })
                      // Agrega o Edita una promocion del Centro Comercial, si le pasamos la variables promo, edita, sino, agrega uno nuevo
                      .state('admin.SubmitpromocionesSupermercados', {
                          url: '/categories/supermercados/promociones/:shopping/submit/:promo',
                          templateUrl: '/templates/supermercados/submit_supermercados_promociones.html',
                          controller:'SubmitSupermercados',
                          resolve: {authResolve: authResolve}
                      })
                      // Visualiza los Beneficios del Centro Comercial, le pasamos el slug del centro comercial en la variable :shopping
                      .state('admin.BeneficiosSupermercados', {
                          url: '/categories/supermercados/beneficios/:shopping',
                          templateUrl: '/templates/shoppings/beneficios_supermercados.html',
                          controller:'BeneficiosMultimarcas',
                          resolve: {authResolve: authResolve}
                      })
                      // Agrega o Edita un beneficio del Centro Comercial, si le pasamos la variables beneficio, edita, sino, agrega uno nuevo
                      .state('admin.SubmitBeneficiosSupermercados', {
                          url: '/categories/supermercados/beneficios/:shopping/submit/:beneficio',
                          templateUrl: '/templates/shoppings/submit_supermercados_beneficios.html',
                          controller:'SubmitBeneficiosMultiMarcas',
                          resolve: {authResolve: authResolve}
                      })
              
              /*  FIN CATEGORIAS  */

              /*  SUCURSALES   */
              
                    // Visualiza los Locales del Centro Comercial
                      // Ej.: Adidas del Shopping del Sol
                    .state('admin.SucursalesSupermercados', {
                        url: '/supermercados/:CentroComercial/sucursales',
                        templateUrl: '/templates/supermercados/sucursales_supermercados.html',
                        controller:'SucursalesSupermercados as locales',
                          resolve: {authResolve: authResolve}
                    })
                    // Agrega o Edita un Local del Centro Comercial, la variable :localId es el slug del local al que se quiere acceder
                    .state('admin.submitSucursalesSupermercados', {
                        url: '/supermercados/:CentroComercial/:localId',
                        templateUrl: '/templates/supermercados/submit_supermercados_sucursales.html',
                        controller:'SubmitSupermercadosSucursales as submit',
                          resolve: {authResolve: authResolve}
                    })
                      // Visualiza las Promociones del local
                      .state('admin.promocionesSucursalesSupermercados', {
                          url: '/supermercados/promociones/:shopping/:localId',
                          templateUrl: '/templates/supermercados/promociones_supermercados_sucursales.html',
                          controller:'SucursalesSupermercados as locales',
                          resolve: {authResolve: authResolve}
                      })
                      // Agrega o Edita una promocion del local
                      .state('admin.SubmitpromocionesSucursalesSupermercados', {
                          url: '/supermercados/promociones/:shopping/:localId/submit/:promo',
                          templateUrl: '/templates/supermercados/submit_supermercados_promociones_sucursales.html',
                          controller:'SubmitSupermercadosSucursales as submit',
                          resolve: {authResolve: authResolve}
                      })
              
              /*  FIN SUCURSALES   */


    /*
            FIN SUPERMERCADOS
    */

    /*
            SPONSOR
    */
                    //Visualiza el listado de Sponsor
                    .state('admin.sponsor', {
                        url: '/sponsor',
                        templateUrl: '/templates/sponsor/listado_sponsor.html',
                        controller:'SponsorCtrl'
                    })
                    //Agrega o Edita Sponsor
                    .state('admin.submit_sponsor', {
                        url: '/sponsor/submit/:IdSponsor',
                        templateUrl: '/templates/sponsor/submit_sponsor.html',
                        controller:'SponsorCtrl'
                    })


    
    /*
            FIN SPONSOR
    */

    /*
            DESTACADOS
    */
                    //Visualiza el listado de Destacados
                    .state('admin.destacados', {
                        url: '/destacados',
                        templateUrl: '/templates/destacados/listado_destacado.html',
                        controller:'DestacadosCtrl'
                    })
                    //Agrega o Edita Destacados
                    .state('admin.submit_destacado', {
                        url: '/destacados/submit/:IdSponsor',
                        templateUrl: '/templates/destacados/submit_destacado.html',
                        controller:'DestacadosCtrl'
                    })


    
    /*
            FIN DESTACADOS
    */
    .state('admin.settings-fees', {
        url: '/settings/fees',
        templateUrl: '/templates/settings-fees.html',
        controller:'SettingsFeesCtrl as settings',
    })

    // Login del Administrador
    .state('admin.login', {
        url: '/login',
        templateUrl: '/templates/login.html',
        controller:'AccountCtrl as account',
    })

    .state('admin.items', {
        url: '/items',
        templateUrl: '/templates/items.html',
        controller:'ItemsCtrl as items',
    })

    .state('admin.usuarios', {
        url: '/usuarios',
        templateUrl: '/templates/usuarios.html',
        controller:'UsuariosCtrl',
    })

    .state('admin.sales', {
        url: '/sales',
        templateUrl: '/templates/sales.html',
        controller:'SalesCtrl as sales',
    })
    .state('admin.sales-detail', {
        url: '/sales/:index/:orderId',
        templateUrl: '/templates/sales-detail.html',
        controller:'SalesDetailCtrl as sdetail',
    })

    .state('admin.submit', {
        url: '/submit/:productId',
        templateUrl: '/templates/submit.html',
        controller:'SubmitCtrl as submit',
    })


})



.directive('itemCols', function() {
  return {
    templateUrl: 'templates/directives/item-cols.html'
  };
})

.directive('locales', function() {
  return {
    templateUrl: 'templates/directives/locales_centros.html'
  };
})

.directive('attributeSettings', function() {
  return {
    templateUrl: 'templates/directives/attribute-settings.html'
  };
})

.directive('checkoutCartOverview', function() {
  return {
    templateUrl: 'templates/directives/checkout-cart-overview.html'
  };
})
