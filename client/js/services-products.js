angular.module('noodlio.services-products', [])

.factory('Products', function($q, ProductManagement, Utils, FireFunc) {
    var self = this;

    self.getIndexValues = function(productId){
        return FireFunc.onValue('products_tags/all/all');
    };
    /**
     * Retrieve products_index and fill it
     */
    self.filter = function(method, tag, sortNode, limitValue) {
        var qFilter = $q.defer();
        retrieveList(method, tag, sortNode, limitValue).then(
            function(ProductsList){
                //console.log(ProductsList)
                if(ProductsList != null) {
                    self.getProductMetaFromList(ProductsList).then(
                        function(ProductsMeta){
                            qFilter.resolve(ProductsMeta);
                        },
                        function(error){
                            qFilter.reject(error);
                        })
                } else {
                    qFilter.resolve(null);  //** put resolve instead of error
                }
            },
            function(error){
                console.log(error)
                qFilter.reject(error);
            }
        );
        return qFilter.promise;
    };

    /**
     * get sorted object
     */
    function retrieveList(method, tag, sortNode, limitValue) {
        var childRef = 'products_tags/' + method + '/' + tag;
        return FireFunc.onValueSort(childRef, sortNode, limitValue);
    };

    self.search = function(searchQuery, limitValue) {

        var searchWords = searchQuery.split(' ');
        var searchFields = ['categoryId', 'tag', 'words', 'userId'];

        var promises = {};

        for (var w=0; w< searchWords.length; w++) {
            for(var i=0; i< searchFields.length; i++) {

                var field   = searchFields[i];
                var word    = Utils.alphaNumericWide(searchWords[w]);

                if(word != '' && word != null && word != ' ') {
                    var promise = newSearch(field, word);
                    if(promise != null) {
                        promises[field + '-' + word] = promise;
                    };
                };


            }; // for i
        }; // w

        // fn new search
        function newSearch(field, word) {
            var qNew = $q.defer();
            self.filter(field, word, 'timestamp_creation', limitValue).then(
                function(ProductsMeta){
                    //console.log(field, ProductsMeta)
                    if(ProductsMeta != null) {
                        qNew.resolve(ProductsMeta);
                    } else {
                        qNew.resolve(null);
                    };
                },
                function(error){
                    // skip
                    if(error != null) {
                        console.log(error);
                        qNew.reject(error)
                    } else {
                        qNew.resolve(null);
                    }
                }
            );
            return qNew.promise;
        };

        /**
        function handleIter(){
            iter = iter + 1;
            if(iter >= nbIters){
                qSearch.resolve(SearchedProductsMeta);
            }
        };
        */

        //return qSearch.promise;
        return $q.all(promises);
    };


    /**
     * products_tags/categoryId
     * ** depreciated: replaced with CategoriesInfo
     */
    self.getBrowseCategories = function() {
        return FireFunc.onValue('products_tags/categoryId');
    };


    /**
     * products_meta
     */
    self.getProductMeta = function(productId) {
        var childRef = "categorias/centros_comerciales/comercios/" + productId;
        return FireFunc.onValue(childRef);
    };


    /**
     * products_meta
     */
    self.getPromoMeta = function(productId,promoId) {
        var childRef = "categorias/centros_comerciales/comercios/" + productId +"/promociones/" + promoId;
        return FireFunc.onValue(childRef);
    };

    /**
     * products_images/icon
     * CAN BE UPDATED WITH .storage()
     */
    self.getProductIcon = function(productId) {
        var childRef = "products_images/" + productId + '/icon';
        return FireFunc.onValue(childRef);
    };

    /**
     * products_images/icon
     */
    self.getProductThumbnail = function(productId) {
        var childRef = "products_images/" + productId + '/screenshot1';
        return FireFunc.onValue(childRef);
    };

    /**
     * products_images
     */
    self.getProductScreenshots = function(productId) {
        var childRef = "products_images/" + productId;
        return FireFunc.onValue(childRef);
    };

    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------

    self.ProductsThumbnails = {};

    self.loadThumbnails = function(ProductsMeta) {
        angular.forEach(ProductsMeta, function(value, productId){
            self.getProductThumbnail(productId).then(
                function(ProductThumbnail){
                  if(ProductThumbnail != null) {
                    self.ProductsThumbnails[productId] = ProductThumbnail;
                  }
                },
                function(error){
                    console.log(error);
                }
            )
        })
    };


    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    /**
     * Retrieve Product Meta of Featured
     * @params:     subNode
     * ******* rewrite to include it in products_tags/featured
     */
    self.getFeaturedProductMeta = function(subNode) {
        var qFea = $q.defer();
        var childRef = "featured/" + subNode;
        FireFunc.onValue(childRef).then(function(ProductList){
          // --
          if(ProductList != null) {
              self.getProductMetaFromList(ProductList).then(
                  function(ProductsMeta){
                      qFea.resolve(ProductsMeta);
                  },
                  function(error){
                      qFea.reject(error);
                  }
              )
          } else {
              qFea.resolve(null);
          }
          // --
        },
        function(error){
          qFea.reject(error);
        })
        return qFea.promise;
    };

    // list
    self.getFeaturedList = function(subNode) {
        var qFea = $q.defer();
        var childRef = "featured/" + subNode;
        FireFunc.onValue(childRef).then(function(ProductList){
          // --
          if(ProductList != null) {
              qFea.resolve(ProductList);
          } else {
              qFea.resolve(null);
          }
          // --
        },
        function(error){
          qFea.reject(error);
        })
        return qFea.promise;
    };

    self.updateFeaturedList = function(subNode, Featuredlist) {
        var childRef = "featured/" + subNode;
        return FireFunc.set(childRef, FeaturedList);
    };

    //@key: productId
     // rewrite to function
    self.getProductMetaFromList = function(ProductsList) {
        var promises = {};
        angular.forEach(ProductsList, function(indexValues, productId) {
            if(productId != undefined && productId != null) {
                var promise = getProductMetaPromise(indexValues, productId)
                if(promise != null) {
                    promises[productId]=promise;
                }
            }
        })
        // how about just return self.getProductMeta(productId)?
        function getProductMetaPromise(indexValues, productId) {
            var qGet = $q.defer();

            // if no index values, then retrieve first
            if(indexValues == true || indexValues == undefined || indexValues == null) {
                self.getIndexValues(productId).then(
                    function(newIndexValues){
                        proceedGet(newIndexValues);
                    },
                    function(error){
                        console.log(error)
                       qGet.reject(error);
                    }
                )
            } else {
                proceedGet(indexValues);
            };

            function proceedGet(latestIndexValues) {
                self.getProductMeta(productId).then(
                    function(ProductMeta){
                        // --> resolve
                        if(ProductMeta != null) {
                            qGet.resolve({
                                meta: ProductMeta,
                                index: latestIndexValues
                            });
                        } else {
                            qGet.resolve(null);
                        }
                    },
                    function(error){
                        qGet.reject(error);
                    }
                )
            };
            return qGet.promise;
        };
        return $q.all(promises);
    };

    // -- external
    self.submitProduct = function(ProductMeta, ProductImages, AuthData, IndexData) {
        return ProductManagement.submit(ProductMeta, ProductImages, AuthData, IndexData);
    };

    self.editProduct = function(ProductMeta, ProductImages, AuthData, IndexData, productId) {
        return ProductManagement.edit(ProductMeta, ProductImages, AuthData, IndexData, productId);
    };

    self.deleteProduct = function(productId, AuthData) {
        return ProductManagement.delete(productId, AuthData);
    };

    return self;
})
.factory('ProductManagement', function($q, $http, Utils, FireFunc) {
    var self = this;

    /**
     * Submit (with indexing)
     */
    self.submit = function(ProductMeta, ProductImages, AuthData, IndexData) {
        var qSubmit     = $q.defer();
        var productId   = generateProductId();

        // create the paths (object if fill, null if delete)
        var INDEX_VALUES = getINDEX_VALUES_NEW(ProductMeta, IndexData);
        var PATH_DATA = createPATH_DATA(ProductMeta, ProductImages, AuthData, productId, INDEX_VALUES);
        var NEW_PATHS = Object.keys(PATH_DATA);
        PATH_DATA["/products_tags/paths/all/" + productId] = NEW_PATHS;

        // synchronize
        FireFunc.update(PATH_DATA).then(function(){
          qSubmit.resolve(productId)
        },
        function(error){
          qSubmit.reject(error)
        })
        return qSubmit.promise;
    };



    /**
     * Edit (with indexing)
     */
    self.edit   = function(ProductMeta, ProductImages, AuthData, IndexData, productId) {
        var qEdit = $q.defer();

        // only when in edit or delete mode: get the latest paths and index values
        getEDIT_DATA(productId).then(
            function(EDIT_DATA){
                if(EDIT_DATA != null & EDIT_DATA != undefined
                && EDIT_DATA.hasOwnProperty('INDEX_VALUES') && EDIT_DATA.hasOwnProperty('OLD_PATHS')) {

                    var INDEX_VALUES    = EDIT_DATA.INDEX_VALUES;
                    var OLD_PATHS       = EDIT_DATA.OLD_PATHS;

                    // -->
                    proceedEditSubmission(INDEX_VALUES, OLD_PATHS)

                } else {
                    qEdit.reject("ERROR_EDIT_EDIT_DATA");
                } // ./ validate edit_data
            },
            function(error){
                qEdit.reject(error);
            }
        ); // ./ get edit data

        // ---------------------------------------------------------------------
        // fn edit multi-location update
        function proceedEditSubmission(INDEX_VALUES, OLD_PATHS) {

            // update index values with possible new
            if(INDEX_VALUES != null){
                INDEX_VALUES = getINDEX_VALUES_EDIT(ProductMeta, IndexData, INDEX_VALUES);
            };

            // create the path data and prepare new paths
            // @EDIT_MODE: check for overlap and handle accordingly (put null if no overlap)
            var NEW_PATH_DATA = createPATH_DATA(ProductMeta, ProductImages, AuthData, productId, INDEX_VALUES);
            var NEW_PATHS = Object.keys(NEW_PATH_DATA);
            NEW_PATH_DATA["/products_tags/paths/all/" + productId] = NEW_PATHS;
            NEW_PATH_DATA = checkOverlapPATH_DATA(NEW_PATHS, OLD_PATHS, NEW_PATH_DATA);
            
            console.log(NEW_PATH_DATA)

            // synchronize
            FireFunc.update(NEW_PATH_DATA).then(function(){
              qEdit.resolve("UPDATE_PRODUCTS_TAGS_SUCCESS")
            },
            function(error){
              qEdit.reject(error)
            })

        };

        return qEdit.promise;
    };


    /**
     * Delete
     */
    self.delete = function(productId, AuthData) {
        var qDelete     = $q.defer();

        // only when in edit or delete mode: get the latest paths and index values
        getEDIT_DATA(productId).then(
            function(EDIT_DATA){
                if(EDIT_DATA != null & EDIT_DATA != undefined
                && EDIT_DATA.hasOwnProperty('INDEX_VALUES') && EDIT_DATA.hasOwnProperty('OLD_PATHS')) {

                    // -->
                    var OLD_PATHS       = EDIT_DATA.OLD_PATHS;
                    proceedDeleteSubmission(OLD_PATHS);

                } else {
                    qDelete.reject("ERROR_EDIT_EDIT_DATA");
                } // ./ validate edit_data
            },
            function(error){
                console.log(error)
                qDelete.reject(error);
            }
        ); // ./ get edit data

        // ---------------------------------------------------------------------
        // fn proceed
        function proceedDeleteSubmission(OLD_PATHS) {

            // get the null paths
            var DELETE_PATH_DATA = getDELETE_PATH_DATA(OLD_PATHS, productId);

            // synchronize
            FireFunc.update(DELETE_PATH_DATA).then(function(){
              qDelete.resolve("UPDATE_PRODUCTS_TAGS_SUCCESS")
            },
            function(error){
              qDelete.reject(error)
            })
        };

        return qDelete.promise;
    }; // qdelete


    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------

    function getINDEX_VALUES_NEW(ProductMeta, IndexData) {
        var INDEX_VALUES = {
            timestamp_creation:     firebase.database.ServerValue.TIMESTAMP,             // meta
            timestamp_update:       firebase.database.ServerValue.TIMESTAMP,             // meta
            price:                  ProductMeta.price,                          // meta
            sales_count:            0,                                          // dynamic
            sales_value_total:      0,                                          // dynamic
            comments_count:         0,                                          // dynamic
            ratings_count:          0,                                          // dynamic
            ratings_avg:            0,                                          // dynamic
            ratings_overall:        0,                                          // dynamic
            inventory_nb_items:     IndexData.inventory_nb_items,               // dynamic
        };
        return INDEX_VALUES;
    };

    function getINDEX_VALUES_EDIT(ProductMeta, IndexData, INDEX_VALUES) {
        // timestamp_creation and dynamic field are not overriden
        INDEX_VALUES['timestamp_update']    = firebase.database.ServerValue.TIMESTAMP;   // override meta
        INDEX_VALUES['price']               = ProductMeta.price;                // override meta
        INDEX_VALUES['inventory_nb_items']  = IndexData.inventory_nb_items;     // override dynamic
        return INDEX_VALUES;
    };

    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------

    // fn get edit data
    function getEDIT_DATA(productId) {

        var qPath = $q.defer();

        var INDEX_VALUES    = {};
        var OLD_PATHS       = {};

        // get the latest INDEX_VALUES
        var childRef1 = "products_tags/all/all/" + productId;
        FireFunc.onValue(childRef1).then(function(INDEX_VALUES){

            // --
            var childRef2 = "products_tags/paths/all/" + productId;
            FireFunc.onValue(childRef2).then(function(OLD_PATHS){

                // ---
                qPath.resolve({
                    INDEX_VALUES: INDEX_VALUES,
                    OLD_PATHS: OLD_PATHS
                })
                // ---

            },
            function(error){
              qPath.reject(error)
            })
            // --

        },
        function(error){
          qPath.reject(error)
        })

        return qPath.promise;
    };

    // fn check overlap, set null
    function checkOverlapPATH_DATA(NEW_PATHS, OLD_PATHS, NEW_PATH_DATA) {
        var newInOld = false;
        console.log(OLD_PATHS);
        for (var o=0; o<OLD_PATHS.length; o++) {
            newInOld = false;
            for (var n=0; n<NEW_PATHS.length; n++) {
                if(NEW_PATHS[n] == OLD_PATHS[o]) {
                    newInOld = true;
                    break
                }
            } // loop over n
            if(!newInOld){
                NEW_PATH_DATA[OLD_PATHS[o]] = null;
            };
        }; //loop over o
        return NEW_PATH_DATA;
    };

    // fn set all paths to null
    function getDELETE_PATH_DATA(OLD_PATHS, productId) {
        var DELETE_PATH_DATA = {};
        for (var o=0; o<OLD_PATHS.length; o++) {
            DELETE_PATH_DATA[OLD_PATHS[o]] = null;
        }; //loop over o
        DELETE_PATH_DATA["/products_tags/paths/all/" + productId] = null;
        return DELETE_PATH_DATA;
    };

    // fn create path data
    function createPATH_DATA(ProductMeta, ProductImages, AuthData, productId, INDEX_VALUES){

        // standard
        var PATH_DATA = {};
        PATH_DATA["/products_tags/all/all/" + productId]                                    = INDEX_VALUES;
        PATH_DATA["/products_tags/userId/" + ProductMeta.userId + "/" + productId]          = INDEX_VALUES;
        PATH_DATA["/products_tags/categoryId/" + ProductMeta.categoryId + "/" + productId]  = INDEX_VALUES;

        // ** displayname and username are to be linked to userId

        // tags
        /*
        var tagsRaw = ProductMeta["tagsString"].split(',');
        var tag = null;
        for(var i=0; i<tagsRaw.length; i++) {
            tag = Utils.alphaNumericWide(tagsRaw[i]);
            if(tag != undefined && tag != "" && tag != null) {
                PATH_DATA["/products_tags/tag/" + tag + "/" + productId] = INDEX_VALUES;
            }
        };

        // words
        var titleRaw = ProductMeta["title"].split(/\W+/);
        var titleWord = null;
        for(var j=0; j<titleRaw.length; j++) {
            titleWord = Utils.alphaNumericWide(titleRaw[j]);
            if(titleWord != undefined && titleWord != "" && titleWord != null) {
                PATH_DATA["/products_tags/words/" + titleWord + "/" + productId] = INDEX_VALUES;
            }
        };
        */

        // meta and images
        PATH_DATA["/products_meta/" + productId]    = ProductMeta;
        PATH_DATA["/products_images/" + productId]  = ProductImages;


        return PATH_DATA;
    };

    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------

    function generateProductId() {
        var d = new Date();

        var wordString = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var letterPart = "";
        for (var i=0; i<3; i++) {
            letterPart = letterPart + wordString[Math.floor(26*Math.random())]
        };

        var fyear = d.getFullYear();
        var fmonth = d.getMonth()+1;
        var fday = d.getDate();
        var fhour = d.getHours();
        var fminute = d.getMinutes();

        fmonth = fmonth < 10 ? '0'+fmonth : fmonth;
        fday = fday < 10 ? '0'+fday : fday;
        fhour = fhour < 10 ? '0'+fhour : fhour;
        fminute = fminute < 10 ? '0'+fminute : fminute;

        var ftime = d.getTime();

        d = d.getTime();
        d = d.toString();

        return "P" + fyear + fmonth + fday + fhour + fminute + d.substr(d.length-3,d.length-1);
    };

    return self;
})
.factory("Indexing", function($q, Products, FireFunc){
    var self = this;

    /**
     * @changeType:     accepts:
     *                  - comment_new
     *                      updates properties:
     *                          - comments_count
     *                  - rating_new
     *                      optData: {'rating_value_new': $value}
     *                      updates properties:
     *                          - ratings_count
     *                          - ratings_avg
     *                          - ratings_overall
     *                  - sales_new
     *                      optData: {'sales_value_new': $value}
     *                      updates properties:
     *                          - sales_count
     *                          - sales_value_total
     *                          - inventory_count
     */
    self.updateDynamicIndex   = function(productId, changeType, optData) {
        var qEdit = $q.defer();

        // only when in edit or delete mode: get the latest paths and index values
        getEDIT_DATA(productId).then(
            function(EDIT_DATA){
                if(EDIT_DATA != null & EDIT_DATA != undefined
                && EDIT_DATA.hasOwnProperty('INDEX_VALUES') && EDIT_DATA.hasOwnProperty('OLD_PATHS')) {

                    var INDEX_VALUES    = EDIT_DATA.INDEX_VALUES;
                    var CURRENT_PATHS   = EDIT_DATA.OLD_PATHS;

                    // -->
                    proceedUpdate(INDEX_VALUES, CURRENT_PATHS)

                } else {
                    qEdit.reject("ERROR_EDIT_EDIT_DATA");
                } // ./ validate edit_data
            },
            function(error){
                qEdit.reject(error);
            }
        ); // ./ get edit data


        // fn edit multi-location update
        function proceedUpdate(INDEX_VALUES, CURRENT_PATHS) {

            // update with the latest index values
            INDEX_VALUES = updateIndexValues(INDEX_VALUES);

            // prepare the paths
            var NEW_PATH_DATA = createPATH_DATA_from_OLD_PATHS(CURRENT_PATHS, INDEX_VALUES, productId)
            var NEW_PATHS = Object.keys(NEW_PATH_DATA);
            NEW_PATH_DATA["/products_tags/paths/all/" + productId] = NEW_PATHS;

            // do not include meta paths in synchronization
            delete NEW_PATH_DATA["/products_meta/" + productId];
            delete NEW_PATH_DATA["/products_images/" + productId];

            // synchronize
            FireFunc.update(NEW_PATH_DATA).then(function(success){
              qEdit.resolve("UPDATE_PRODUCTS_TAGS_SUCCESS")
            },
            function(error){
              qEdit.reject(error)
            })
        };

        // fn update wherwe the magic happens
        function updateIndexValues(INDEX_VALUES) {
            switch(changeType){
                case 'comment_new':
                    //
                    INDEX_VALUES['comments_count']      = INDEX_VALUES['comments_count'] + 1;
                    break
                case 'rating_new':
                    //
                    INDEX_VALUES['ratings_overall']     = INDEX_VALUES['ratings_overall'] + optData.rating_value_new;
                    INDEX_VALUES['ratings_count']       = INDEX_VALUES['ratings_count'] + 1;
                    INDEX_VALUES['ratings_avg']         = INDEX_VALUES['ratings_overall']/INDEX_VALUES['ratings_count'];
                    break
                case 'sales_new':
                    //
                    INDEX_VALUES['sales_count']          = INDEX_VALUES['sales_count'] + 1;
                    INDEX_VALUES['sales_value_total']    = INDEX_VALUES['sales_value_total'] + optData.sales_value_new;
                    INDEX_VALUES['inventory_nb_items']   = INDEX_VALUES['inventory_nb_items'] -1;
                    break
            }
            return INDEX_VALUES;
        };

        return qEdit.promise;
    };


    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------

    // fn get edit data *** NOTE USED IN TWO FACTORIES (this file)
    function getEDIT_DATA(productId) {

        var qPath = $q.defer();

        var INDEX_VALUES    = {};
        var OLD_PATHS       = {};

        // -
        // get the latest INDEX_VALUES
        var childRef1 = "categorias/centros_comerciales/comercios/" + productId;
        FireFunc.onValue(childRef1).then(function(INDEX_VALUES){

            // --
            // get OLD_PATHS
            var childRef2 = "categorias/centros_comerciales/comercios/" + productId;
            FireFunc.onValue(childRef2).then(function(OLD_PATHS){

                // ---
                // RESOLVE
                qPath.resolve({
                    INDEX_VALUES: INDEX_VALUES,
                    OLD_PATHS: OLD_PATHS
                })
                // ---

            },
            function(error){
              qPath.reject(error)
            })
            // --

        },
        function(error){
          qPath.reject(error)
        })
        // -

        return qPath.promise;
    };

    function createPATH_DATA_from_OLD_PATHS(OLD_PATHS, INDEX_VALUES, productId){
        var PATH_DATA = {};
        for (var i=0; i<OLD_PATHS.length; i++) {
            PATH_DATA[OLD_PATHS[i]] = INDEX_VALUES;
        };
        return PATH_DATA;
    };

    return self;
})


/**
    CENTROS COMERCIALES - SHOPPINGS 
 */
.factory('CentrosService', function($q, ProductManagement, Utils, FireFunc, UserService) {
    var self = this;

    self.getIndexValues = function(productId){
        return FireFunc.onValue('products_tags/all/all');
    };
    /**
     * Retrieve products_index and fill it
     */
    self.filter = function(method, tag, sortNode, limitValue) {
        var qFilter = $q.defer();
        retrieveList(method, tag, sortNode, limitValue).then(
            function(ProductsList){
                //console.log(ProductsList)
                if(ProductsList != null) {
                    self.getProductMetaFromList(ProductsList).then(
                        function(ProductsMeta){
                            qFilter.resolve(ProductsMeta);
                        },
                        function(error){
                            qFilter.reject(error);
                        })
                } else {
                    qFilter.resolve(null);  //** put resolve instead of error
                }
            },
            function(error){
                console.log(error)
                qFilter.reject(error);
            }
        );
        return qFilter.promise;
    };

    /**
     * get sorted object
     */
    function retrieveList(method, tag, sortNode, limitValue) {
        var childRef = 'products_tags/' + method + '/' + tag;
        return FireFunc.onValueSort(childRef, sortNode, limitValue);
    };

    self.search = function(searchQuery, limitValue) {

        var searchWords = searchQuery.split(' ');
        var searchFields = ['categoryId', 'tag', 'words', 'userId'];

        var promises = {};

        for (var w=0; w< searchWords.length; w++) {
            for(var i=0; i< searchFields.length; i++) {

                var field   = searchFields[i];
                var word    = Utils.alphaNumericWide(searchWords[w]);

                if(word != '' && word != null && word != ' ') {
                    var promise = newSearch(field, word);
                    if(promise != null) {
                        promises[field + '-' + word] = promise;
                    };
                };


            }; // for i
        }; // w

        // fn new search
        function newSearch(field, word) {
            var qNew = $q.defer();
            self.filter(field, word, 'timestamp_creation', limitValue).then(
                function(ProductsMeta){
                    //console.log(field, ProductsMeta)
                    if(ProductsMeta != null) {
                        qNew.resolve(ProductsMeta);
                    } else {
                        qNew.resolve(null);
                    };
                },
                function(error){
                    // skip
                    if(error != null) {
                        console.log(error);
                        qNew.reject(error)
                    } else {
                        qNew.resolve(null);
                    }
                }
            );
            return qNew.promise;
        };

        /**
        function handleIter(){
            iter = iter + 1;
            if(iter >= nbIters){
                qSearch.resolve(SearchedProductsMeta);
            }
        };
        */

        //return qSearch.promise;
        return $q.all(promises);
    };


    /**
     * products_tags/categoryId
     * ** depreciated: replaced with CategoriesInfo
     */
    self.getBrowseCategories = function() {
        return FireFunc.onValue('products_tags/categoryId');
    };


    /**
     * products_meta
     */
    self.getProductMeta = function(productId) {
        var childRef = "categorias/centros_comerciales/comercios/" + productId;
        return FireFunc.onValue(childRef);
    };

    /**
     * products_images/icon
     * CAN BE UPDATED WITH .storage()
     */
    self.getProductIcon = function(productId) {
        var childRef = "products_images/" + productId + '/icon';
        return FireFunc.onValue(childRef);
    };

    /**
     * products_images/icon
     */
    self.getProductThumbnail = function(productId) {
        var childRef = "products_images/" + productId + '/screenshot1';
        return FireFunc.onValue(childRef);
    };

    /**
     * products_images
     */
    self.getProductScreenshots = function(productId) {
        var childRef = "categorias/centros_comerciales/comercios/" + productId +"/perfil/avatar";
        return FireFunc.onValue(childRef);
    };
    self.getIcono = function(productId) {
        var childRef = "categorias/centros_comerciales/comercios/" + productId +"/perfil/icono";
        return FireFunc.onValue(childRef);
    };
    self.getMapa = function(productId) {
        var childRef = "categorias/centros_comerciales/comercios/" + productId +"/perfil/mapa_complejo";
        return FireFunc.onValue(childRef);
    };
    self.getBanner1 = function(productId) {
        var childRef = "categorias/centros_comerciales/comercios/" + productId +"/perfil/banners_destacados/banner1";
        return FireFunc.onValue(childRef);
    };
    self.getBanner2 = function(productId) {
        var childRef = "categorias/centros_comerciales/comercios/" + productId +"/perfil/banners_destacados/banner2";
        return FireFunc.onValue(childRef);
    };
    self.getBanner3 = function(productId) {
        var childRef = "categorias/centros_comerciales/comercios/" + productId +"/perfil/banners_destacados/banner3";
        return FireFunc.onValue(childRef);
    };

    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------

    self.ProductsThumbnails = {};

    self.loadThumbnails = function(ProductsMeta) {
        angular.forEach(ProductsMeta, function(value, productId){
            self.getProductThumbnail(productId).then(
                function(ProductThumbnail){
                  if(ProductThumbnail != null) {
                    self.ProductsThumbnails[productId] = ProductThumbnail;
                  }
                },
                function(error){
                    console.log(error);
                }
            )
        })
    };


    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    /**
     * Retrieve Product Meta of Featured
     * @params:     subNode
     * ******* rewrite to include it in products_tags/featured
     */
    self.getFeaturedProductMeta = function(subNode) {
        var qFea = $q.defer();
        var childRef = "featured/" + subNode;
        FireFunc.onValue(childRef).then(function(ProductList){
          // --
          if(ProductList != null) {
              self.getProductMetaFromList(ProductList).then(
                  function(ProductsMeta){
                      qFea.resolve(ProductsMeta);
                  },
                  function(error){
                      qFea.reject(error);
                  }
              )
          } else {
              qFea.resolve(null);
          }
          // --
        },
        function(error){
          qFea.reject(error);
        })
        return qFea.promise;
    };

    // list
    self.getFeaturedList = function(subNode) {
        var qFea = $q.defer();
        var childRef = "featured/" + subNode;
        FireFunc.onValue(childRef).then(function(ProductList){
          // --
          if(ProductList != null) {
              qFea.resolve(ProductList);
          } else {
              qFea.resolve(null);
          }
          // --
        },
        function(error){
          qFea.reject(error);
        })
        return qFea.promise;
    };

    self.updateFeaturedList = function(subNode, Featuredlist) {
        var childRef = "featured/" + subNode;
        return FireFunc.set(childRef, FeaturedList);
    };

    //@key: productId
     // rewrite to function
    self.getProductMetaFromList = function(ProductsList) {
        var promises = {};
        angular.forEach(ProductsList, function(indexValues, productId) {
            if(productId != undefined && productId != null) {
                var promise = getProductMetaPromise(indexValues, productId)
                if(promise != null) {
                    promises[productId]=promise;
                }
            }
        })
        // how about just return self.getProductMeta(productId)?
        function getProductMetaPromise(indexValues, productId) {
            var qGet = $q.defer();

            // if no index values, then retrieve first
            if(indexValues == true || indexValues == undefined || indexValues == null) {
                self.getIndexValues(productId).then(
                    function(newIndexValues){
                        proceedGet(newIndexValues);
                    },
                    function(error){
                        console.log(error)
                       qGet.reject(error);
                    }
                )
            } else {
                proceedGet(indexValues);
            };

            function proceedGet(latestIndexValues) {
                self.getProductMeta(productId).then(
                    function(ProductMeta){
                        // --> resolve
                        if(ProductMeta != null) {
                            qGet.resolve({
                                meta: ProductMeta,
                                index: latestIndexValues
                            });
                        } else {
                            qGet.resolve(null);
                        }
                    },
                    function(error){
                        qGet.reject(error);
                    }
                )
            };
            return qGet.promise;
        };
        return $q.all(promises);
    };

    // Hacemos Submit al nuevo Comercio, lo agregamos a la base de datos
    self.submitProduct = function(ProductMeta, ProductImages, AuthData, banner1, banner2, banner3, icono, mapa_complejo) {
        var database = firebase.database();
        var slug = ProductMeta.slug;
        var datos = ProductMeta.perfil;

        var funcion = firebase.database().ref('categorias/centros_comerciales/comercios/' + slug ).set({
            estadisticas: {
                            cantidad_locales : 0,
                            checks: 0,
                            visitas:0,
                        },
            perfil :    {   
                            avatar: ProductImages || '',
                            icono: icono || '',
                            mapa_complejo:mapa_complejo || '',
                            banners_destacados:  {
                                            banner1: banner1 || '',
                                            banner2: banner2 || '',
                                            banner3: banner3 || '',
                                        },
                            email: datos.email || '',
                            nombre: datos.nombre || '',
                            numero_telefono: datos.numero_telefono || '',
                            direccion: datos.direccion || '',
                            pais: datos.pais || '',
                            ciudad: datos.ciudad || '',
                            descripcion: datos.descripcion || '',
                            horario: datos.horario || '',
                            mapa:    {
                                                latitud: datos.latitud || '0',
                                                longitud: datos.longitud || '0',
                                            },
                            online: datos.online || 'true',
                            destacado: datos.destacado || 'false',
                            puntos: datos.puntos || 'false',
                        },
          });
        return funcion;
    };

    self.editProduct = function(ProductMeta, ProductImages, AuthData, productId, banner1, banner2, banner3, icono, mapa_complejo) {
        var database = firebase.database();
        var slug = productId;
        console.log(productId);
        var datos = ProductMeta.perfil;
        console.log(datos);

        var funcion = firebase.database().ref('categorias/centros_comerciales/comercios/' + slug ).update({
            perfil :    {   
                            avatar: ProductImages || '',
                            icono: icono || '',
                            mapa_complejo:mapa_complejo || '',
                            banners_destacados:  {
                                            banner1: banner1 || '',
                                            banner2: banner2 || '',
                                            banner3: banner3 || '',
                                        }, 
                            email: datos.email || '',
                            nombre: datos.nombre || '',
                            numero_telefono: datos.numero_telefono || '',
                            direccion: datos.direccion || '',
                            pais: datos.pais || '',
                            ciudad: datos.ciudad || '',
                            descripcion: datos.descripcion || '',
                            horario: datos.horario || '',
                            mapa:    {
                                                latitud: datos.mapa.latitud || '0',
                                                longitud: datos.mapa.longitud || '0',
                                            },
                            online: datos.online || 'true',
                            destacado: datos.destacado || 'false',
                            puntos: datos.puntos || 'false',
                        },
          });
        return funcion;
    };


    // Hacemos Submit a la promocion
    self.submitPromocion = function(PromocionMeta, AuthData, slug) {
        var database = firebase.database();
        var datos = PromocionMeta;
        // Obtenemos el icono del comercio
        var childRef = "categorias/centros_comerciales/comercios/" + slug +"/perfil/icono";
        FireFunc.onValue(childRef).then(function(result){
          // --
          if(result != null) {
              var icono = result;
          } else {
              var icono = null;
          }
          // --
            // Notificamos al usuario en la bandeja de entrada
            if(PromocionMeta.notificaciones.mensajes == true ){
                console.log("Notificamos a los usuario que tienen como FAV");
                // Recorremos el array User
                UserService.getUsuarios().then(function(success){
                    console.log(success);
                    angular.forEach(success,function (detalle,key) {
                        if(detalle.hasOwnProperty(['favoritos'])){
                            if(detalle.favoritos.hasOwnProperty([slug])){
                                console.log("El usuario "+ key + " le tiene como Fav");
                                // Obtenemos el avatar del comercio
                                // Procedemos a colocar en su bandeja de entrada
                                firebase.database().ref('users/'+ key + '/notificaciones').push().set({
                                    detalle: {
                                                    titulo : datos.texto.titulo || '',
                                                    descripcion: datos.texto.descripcion || '',
                                            },
                                    fechainicio:datos.fechainicio || '',
                                    fechafin:datos.fechafin || '',
                                    estado:'nueva',
                                    icono:icono,
                                }); 
                            }
                        }
                    });
                });
            }
        });
        
        var ref = firebase.database().ref('categorias/centros_comerciales/comercios/' + slug);
        var id = ref.child('promociones');

        var funcion = id.push().set({
            texto: {
                            titulo : datos.texto.titulo || '',
                            descripcion: datos.texto.descripcion || '',
                            descripcion_larga: datos.texto.descripcion_larga || '',
                    },
            fechainicio:datos.fechainicio || '',
            fechafin:datos.fechafin || '',
            categoria:datos.categoria || '',
          });
        return funcion;
    };

    // Hacemos Submit a la promocion Editada
    self.editPromocion = function(PromocionMeta, AuthData, slug, promoId) {
        var datos = PromocionMeta;
        // Obtenemos el icono del comercio
        var childRef = "categorias/centros_comerciales/comercios/" + slug +"/perfil/icono";
        FireFunc.onValue(childRef).then(function(result){
            // --
            if(result != null) {
                var icono = result;
            } else {
                var icono = null;
            }
            // --
            // Notificamos al usuario en la bandeja de entrada
            if(PromocionMeta.notificaciones.mensajes == true ){
                // Recorremos el array User
                UserService.getUsuarios().then(function(success){
                    angular.forEach(success,function (detalle,key) {
                        if(detalle.hasOwnProperty(['favoritos'])){
                            if(detalle.favoritos.hasOwnProperty([slug])){
                                // Procedemos a colocar en su bandeja de entrada
                                firebase.database().ref('users/'+ key + '/notificaciones').push().set({
                                    detalle: {
                                                    titulo : datos.texto.titulo || '',
                                                    descripcion: datos.texto.descripcion || '',
                                            },
                                    fechainicio:datos.fechainicio || '',
                                    fechafin:datos.fechafin || '',
                                    estado:'nueva',
                                    icono:icono,
                                }); 
                            }
                        }
                    });
                });
            }
        });

        var funcion = firebase.database().ref('categorias/centros_comerciales/comercios/' + slug +'/promociones/'+promoId ).update({
            texto: {
                            titulo : datos.texto.titulo || '',
                            descripcion: datos.texto.descripcion || '',
                            descripcion_larga: datos.texto.descripcion_larga || '',
                    },
            fechainicio:datos.fechainicio || '',
            fechafin:datos.fechafin || '',
            categoria:datos.categoria || '',
          });
        return funcion;
    };
    self.deleteProduct = function(productId, AuthData) {
        return ProductManagement.delete(productId, AuthData);
    };

    self.eliminarComercio = function(slug) {
        return firebase.database().ref('categorias/centros_comerciales/comercios/'+slug).remove();
    };

    self.eliminarPromocion = function(comercio, promocion) {
        return firebase.database().ref('categorias/centros_comerciales/comercios/'+comercio+'/promociones/'+ promocion).remove();
    };

    self.eliminarImagen = function(ruta,update) {
        console.log(ruta);
        console.log(update);
        switch (update) {
                    case 'avatar':
                        return firebase.database().ref(ruta).update({avatar:''});
                        break
                    case 'icono':
                        return firebase.database().ref(ruta).update({icono:''});
                        break
                    case 'banner1':
                        return firebase.database().ref(ruta).update({banner1:''});
                        break
                    case 'banner2':
                        return firebase.database().ref(ruta).update({banner2:''});
                        break
                    case 'banner3':
                        return firebase.database().ref(ruta).update({banner3:''});
                        break
        }
    };

    return self;
})

.factory('CentrosLocalService', function($q, ProductManagement, Utils, FireFunc) {
    var self = this;

    /**
     * Retrieve products_index and fill it
     */
    self.filter = function(method, tag, sortNode, limitValue) {
        var qFilter = $q.defer();
        retrieveList(method, tag, sortNode, limitValue).then(
            function(ProductsList){
                //console.log(ProductsList)
                if(ProductsList != null) {
                    self.getProductMetaFromList(ProductsList).then(
                        function(ProductsMeta){
                            qFilter.resolve(ProductsMeta);
                        },
                        function(error){
                            qFilter.reject(error);
                        })
                } else {
                    qFilter.resolve(null);  //** put resolve instead of error
                }
            },
            function(error){
                console.log(error)
                qFilter.reject(error);
            }
        );
        return qFilter.promise;
    };

    /**
     * get sorted object
     */
    function retrieveList(method, tag, sortNode, limitValue) {
        var childRef = 'products_tags/' + method + '/' + tag;
        return FireFunc.onValueSort(childRef, sortNode, limitValue);
    };

    self.search = function(searchQuery, limitValue) {

        var searchWords = searchQuery.split(' ');
        var searchFields = ['categoryId', 'tag', 'words', 'userId'];

        var promises = {};

        for (var w=0; w< searchWords.length; w++) {
            for(var i=0; i< searchFields.length; i++) {

                var field   = searchFields[i];
                var word    = Utils.alphaNumericWide(searchWords[w]);

                if(word != '' && word != null && word != ' ') {
                    var promise = newSearch(field, word);
                    if(promise != null) {
                        promises[field + '-' + word] = promise;
                    };
                };


            }; // for i
        }; // w

        // fn new search
        function newSearch(field, word) {
            var qNew = $q.defer();
            self.filter(field, word, 'timestamp_creation', limitValue).then(
                function(ProductsMeta){
                    //console.log(field, ProductsMeta)
                    if(ProductsMeta != null) {
                        qNew.resolve(ProductsMeta);
                    } else {
                        qNew.resolve(null);
                    };
                },
                function(error){
                    // skip
                    if(error != null) {
                        console.log(error);
                        qNew.reject(error)
                    } else {
                        qNew.resolve(null);
                    }
                }
            );
            return qNew.promise;
        };

        /**
        function handleIter(){
            iter = iter + 1;
            if(iter >= nbIters){
                qSearch.resolve(SearchedProductsMeta);
            }
        };
        */

        //return qSearch.promise;
        return $q.all(promises);
    };


    /**
     * products_tags/categoryId
     * ** depreciated: replaced with CategoriesInfo
     */
    self.getBrowseCategories = function() {
        return FireFunc.onValue('products_tags/categoryId');
    };


    /**
     * products_meta
     */
    self.getProductMeta = function(comercio,productId) {
        var childRef = "categorias/centros_comerciales/comercios/" + comercio +"/locales/"+ productId;
        return FireFunc.onValue(childRef);
    };

    self.getPromoMeta = function(shopping, local, promoId) {
        var childRef = "categorias/centros_comerciales/comercios/" + shopping +"/locales/" + local + "/promociones/" + promoId;
        return FireFunc.onValue(childRef);
    };

    /**
     * products_images/icon
     * CAN BE UPDATED WITH .storage()
     */
    self.getProductIcon = function(productId) {
        var childRef = "products_images/" + productId + '/icon';
        return FireFunc.onValue(childRef);
    };

    /**
     * products_images/icon
     */
    self.getProductThumbnail = function(productId) {
        var childRef = "products_images/" + productId + '/screenshot1';
        return FireFunc.onValue(childRef);
    };

    /**
     * products_images
     */
    self.getProductScreenshots = function(comercio,local) {
        var childRef = 'categorias/centros_comerciales/comercios/' + comercio + '/locales/' + local + '/perfil/avatar';
        return FireFunc.onValue(childRef);
    };
    self.getIcono = function(comercio,local) {
        var childRef = "categorias/centros_comerciales/comercios/" + comercio + '/locales/' + local + "/perfil/icono";
        return FireFunc.onValue(childRef);
    };
    self.getBanner1 = function(comercio,local) {
        var childRef = "categorias/centros_comerciales/comercios/" + comercio + '/locales/' + local + "/perfil/banners_destacados/banner1";
        return FireFunc.onValue(childRef);
    };
    self.getBanner2 = function(comercio,local) {
        var childRef = "categorias/centros_comerciales/comercios/" + comercio + '/locales/' + local + "/perfil/banners_destacados/banner2";
        return FireFunc.onValue(childRef);
    };
    self.getBanner3 = function(comercio,local) {
        var childRef = "categorias/centros_comerciales/comercios/" + comercio + '/locales/' + local + "/perfil/banners_destacados/banner3";
        return FireFunc.onValue(childRef);
    };

    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------

    self.ProductsThumbnails = {};

    self.loadThumbnails = function(ProductsMeta) {
        angular.forEach(ProductsMeta, function(value, productId){
            self.getProductThumbnail(productId).then(
                function(ProductThumbnail){
                  if(ProductThumbnail != null) {
                    self.ProductsThumbnails[productId] = ProductThumbnail;
                  }
                },
                function(error){
                    console.log(error);
                }
            )
        })
    };


    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    /**
     * Retrieve Product Meta of Featured
     * @params:     subNode
     * ******* rewrite to include it in products_tags/featured
     */
    self.getFeaturedProductMeta = function(subNode) {
        var qFea = $q.defer();
        var childRef = "featured/" + subNode;
        FireFunc.onValue(childRef).then(function(ProductList){
          // --
          if(ProductList != null) {
              self.getProductMetaFromList(ProductList).then(
                  function(ProductsMeta){
                      qFea.resolve(ProductsMeta);
                  },
                  function(error){
                      qFea.reject(error);
                  }
              )
          } else {
              qFea.resolve(null);
          }
          // --
        },
        function(error){
          qFea.reject(error);
        })
        return qFea.promise;
    };

    // list
    self.getFeaturedList = function(subNode) {
        var qFea = $q.defer();
        var childRef = "featured/" + subNode;
        FireFunc.onValue(childRef).then(function(ProductList){
          // --
          if(ProductList != null) {
              qFea.resolve(ProductList);
          } else {
              qFea.resolve(null);
          }
          // --
        },
        function(error){
          qFea.reject(error);
        })
        return qFea.promise;
    };

    self.updateFeaturedList = function(subNode, Featuredlist) {
        var childRef = "featured/" + subNode;
        return FireFunc.set(childRef, FeaturedList);
    };

    //@key: productId
     // rewrite to function
    self.getProductMetaFromList = function(ProductsList) {
        var promises = {};
        angular.forEach(ProductsList, function(indexValues, productId) {
            if(productId != undefined && productId != null) {
                var promise = getProductMetaPromise(indexValues, productId)
                if(promise != null) {
                    promises[productId]=promise;
                }
            }
        })
        // how about just return self.getProductMeta(productId)?
        function getProductMetaPromise(indexValues, productId) {
            var qGet = $q.defer();

            // if no index values, then retrieve first
            if(indexValues == true || indexValues == undefined || indexValues == null) {
                self.getIndexValues(productId).then(
                    function(newIndexValues){
                        proceedGet(newIndexValues);
                    },
                    function(error){
                        console.log(error)
                       qGet.reject(error);
                    }
                )
            } else {
                proceedGet(indexValues);
            };

            function proceedGet(latestIndexValues) {
                self.getProductMeta(productId).then(
                    function(ProductMeta){
                        // --> resolve
                        if(ProductMeta != null) {
                            qGet.resolve({
                                meta: ProductMeta,
                                index: latestIndexValues
                            });
                        } else {
                            qGet.resolve(null);
                        }
                    },
                    function(error){
                        qGet.reject(error);
                    }
                )
            };
            return qGet.promise;
        };
        return $q.all(promises);
    };

    // Hacemos Submit al nuevo Comercio, lo agregamos a la base de datos
    self.submitProduct = function(ProductMeta, AuthData, comercio) {
        var database = firebase.database();
        var slug = ProductMeta.slug;
        var datos = ProductMeta.perfil;

        var funcion = firebase.database().ref('categorias/centros_comerciales/comercios/' + comercio + '/locales/' + slug ).set({
            estadisticas: {
                            checks: 0,
                            visitas:0,
                        },
            perfil :    {   
                            email: datos.email || '',
                            nombre: datos.nombre || '',
                            numero_telefono: datos.numero_telefono || '',
                            direccion: datos.direccion || '',
                            descripcion: datos.descripcion || '',
                            horario:    {
                                            lunes:  {
                                                        desde: datos.horario.lunes.desde || '',
                                                        hasta: datos.horario.lunes.hasta || ''
                                                     },
                                            martes:  {
                                                        desde: datos.horario.martes.desde || '',
                                                        hasta: datos.horario.martes.hasta || ''
                                                     },
                                            miercoles:  {
                                                        desde: datos.horario.miercoles.desde || '',
                                                        hasta: datos.horario.miercoles.hasta || ''
                                                     },
                                            jueves:  {
                                                        desde: datos.horario.jueves.desde || '',
                                                        hasta: datos.horario.jueves.hasta || ''
                                                     },
                                            viernes:  {
                                                        desde: datos.horario.viernes.desde || '',
                                                        hasta: datos.horario.viernes.hasta || ''
                                                     },
                                            sabado:  {
                                                        desde: datos.horario.sabado.desde || '',
                                                        hasta: datos.horario.sabado.hasta || ''
                                                     },
                                            domingo:  {
                                                        desde: datos.horario.domingo.desde || '',
                                                        hasta: datos.horario.domingo.hasta || ''
                                                     },
                                        },
                            local: datos.local || '',
                            piso: datos.piso || '',
                            mapa:    {
                                                latitud: datos.mapa.latitud || '',
                                                longitud: datos.mapa.longitud || '',
                                            },
                            online: datos.online || '',
                            destacado: datos.destacado || '',
                        },
          });
        return funcion;
    };

    self.editProduct = function(ProductMeta, Avatar, AuthData, comercio, productId, banner1, banner2, banner3, icono) {
        var database = firebase.database();
        var slug = productId;
        console.log(productId);
        var datos = ProductMeta.perfil;
        console.log(datos);

        var funcion = firebase.database().ref('categorias/centros_comerciales/comercios/' + comercio + '/locales/' + slug ).update({
            perfil :    {   
                            avatar: Avatar || '',
                            icono: icono || '',
                            banners_destacados:  {
                                            banner1: banner1 || '',
                                            banner2: banner2 || '',
                                            banner3: banner3 || '',
                                        },
                            email: datos.email || '',
                            nombre: datos.nombre || '',
                            numero_telefono: datos.numero_telefono || '',
                            direccion: datos.direccion || '',
                            descripcion: datos.descripcion || '',
                            horario:    {
                                            lunes:  {
                                                        desde: datos.horario.lunes.desde || '',
                                                        hasta: datos.horario.lunes.hasta || ''
                                                     },
                                            martes:  {
                                                        desde: datos.horario.martes.desde || '',
                                                        hasta: datos.horario.martes.hasta || ''
                                                     },
                                            miercoles:  {
                                                        desde: datos.horario.miercoles.desde || '',
                                                        hasta: datos.horario.miercoles.hasta || ''
                                                     },
                                            jueves:  {
                                                        desde: datos.horario.jueves.desde || '',
                                                        hasta: datos.horario.jueves.hasta || ''
                                                     },
                                            viernes:  {
                                                        desde: datos.horario.viernes.desde || '',
                                                        hasta: datos.horario.viernes.hasta || ''
                                                     },
                                            sabado:  {
                                                        desde: datos.horario.sabado.desde || '',
                                                        hasta: datos.horario.sabado.hasta || ''
                                                     },
                                            domingo:  {
                                                        desde: datos.horario.domingo.desde || '',
                                                        hasta: datos.horario.domingo.hasta || ''
                                                     },
                                        },
                            local: datos.local || '',
                            piso: datos.piso || '',
                            mapa:    {
                                                latitud: datos.mapa.latitud || '',
                                                longitud: datos.mapa.longitud || '',
                                            },
                            online: datos.online || '',
                            destacado: datos.destacado || '',
                        },
          });
        return funcion;
    };


    // Hacemos Submit a la promocion
    self.submitPromocion = function(PromocionMeta, AuthData, shopping, local) {
        var database = firebase.database();
        var datos = PromocionMeta;
        // Obtenemos el icono del comercio
        var childRef = "categorias/centros_comerciales/comercios/" + shopping +"/locales/"+local+"/perfil/icono";
        FireFunc.onValue(childRef).then(function(result){
          // --
          if(result != null) {
              var icono = result;
          } else {
              var icono = null;
          }
          // --
            // Notificamos al usuario en la bandeja de entrada
            if(PromocionMeta.notificaciones.mensajes == true ){
                console.log("Notificamos a los usuario que tienen como FAV");
                // Recorremos el array User
                UserService.getUsuarios().then(function(success){
                    console.log(success);
                    angular.forEach(success,function (detalle,key) {
                        if(detalle.hasOwnProperty(['favoritos'])){
                            if(detalle.favoritos.hasOwnProperty([local])){
                                console.log("El usuario "+ key + " le tiene como Fav");
                                // Obtenemos el avatar del comercio
                                // Procedemos a colocar en su bandeja de entrada
                                firebase.database().ref('users/'+ key + '/notificaciones').push().set({
                                    detalle: {
                                                    titulo : datos.texto.titulo || '',
                                                    descripcion: datos.texto.descripcion || '',
                                            },
                                    fechainicio:datos.fechainicio || '',
                                    fechafin:datos.fechafin || '',
                                    estado:'nueva',
                                    icono:icono,
                                }); 
                            }
                        }
                    });
                });
            }
        });
        
        var ref = firebase.database().ref('categorias/centros_comerciales/comercios/' + shopping +'/locales/' + local );
        var id = ref.child('promociones');

        var funcion = id.push().set({
            texto: {
                            titulo : datos.texto.titulo || '',
                            descripcion: datos.texto.descripcion || '',
                            descripcion_larga: datos.texto.descripcion_larga || '',
                    },
            fechainicio:datos.fechainicio || '',
            fechafin:datos.fechafin || '',
            categoria:datos.categoria || '',
          });
        return funcion;
    };


    // Hacemos Submit a la promocion Editada
    self.editPromocion = function(PromocionMeta, AuthData, shopping, local, promoId) {
        var datos = PromocionMeta;
        // Obtenemos el icono del comercio
        var childRef = "categorias/centros_comerciales/comercios/" + shopping +"/locales/"+local+"/perfil/icono";
        FireFunc.onValue(childRef).then(function(result){
          // --
          if(result != null) {
              var icono = result;
          } else {
              var icono = null;
          }
          // --
            // Notificamos al usuario en la bandeja de entrada
            if(PromocionMeta.notificaciones.mensajes == true ){
                console.log("Notificamos a los usuario que tienen como FAV");
                // Recorremos el array User
                UserService.getUsuarios().then(function(success){
                    console.log(success);
                    angular.forEach(success,function (detalle,key) {
                        if(detalle.hasOwnProperty(['favoritos'])){
                            if(detalle.favoritos.hasOwnProperty([local])){
                                console.log("El usuario "+ key + " le tiene como Fav");
                                // Obtenemos el avatar del comercio
                                // Procedemos a colocar en su bandeja de entrada
                                firebase.database().ref('users/'+ key + '/notificaciones').push().set({
                                    detalle: {
                                                    titulo : datos.texto.titulo || '',
                                                    descripcion: datos.texto.descripcion || '',
                                            },
                                    fechainicio:datos.fechainicio || '',
                                    fechafin:datos.fechafin || '',
                                    estado:'nueva',
                                    icono:icono,
                                }); 
                            }
                        }
                    });
                });
            }
        });

        var funcion = firebase.database().ref('categorias/centros_comerciales/comercios/' + shopping +'/locales/' + local + '/promociones/' + promoId ).update({
            texto: {
                            titulo : datos.texto.titulo || '',
                            descripcion: datos.texto.descripcion || '',
                            descripcion_larga: datos.texto.descripcion_larga || '',
                    },
            fechainicio:datos.fechainicio || '',
            fechafin:datos.fechafin || '',
            categoria:datos.categoria || '',
          });
        return funcion;
    };

    self.deleteProduct = function(productId, AuthData) {
        return ProductManagement.delete(productId, AuthData);
    };


    self.eliminarLocal = function(shopping, local) {
        console.log(shopping);
        return firebase.database().ref('categorias/centros_comerciales/comercios/'+shopping+'/locales/'+local).remove();
    };

    self.eliminarPromocion = function(comercio, local, promocion) {
        return firebase.database().ref('categorias/centros_comerciales/comercios/'+comercio+'/locales/'+local+'/promociones/'+ promocion).remove();
    };

    self.eliminarImagen = function(ruta,update) {
        console.log(ruta);
        console.log(update);
        switch (update) {
                    case 'avatar':
                        return firebase.database().ref(ruta).update({avatar:''});
                        break
                    case 'icono':
                        return firebase.database().ref(ruta).update({icono:''});
                        break
                    case 'banner1':
                        return firebase.database().ref(ruta).update({banner1:''});
                        break
                    case 'banner2':
                        return firebase.database().ref(ruta).update({banner2:''});
                        break
                    case 'banner3':
                        return firebase.database().ref(ruta).update({banner3:''});
                        break
        }
    };

    return self;
})

/*
    FIN CENTROS COMERCIALES - SHOPPINGS 
*/

/*
    MULTIMARCAS
*/
.factory('MultiMarcasService', function($q, ProductManagement, Utils, FireFunc) {
    var self = this;

    /**
     * Retrieve products_index and fill it
     */
    self.filter = function(method, tag, sortNode, limitValue) {
        var qFilter = $q.defer();
        retrieveList(method, tag, sortNode, limitValue).then(
            function(ProductsList){
                //console.log(ProductsList)
                if(ProductsList != null) {
                    self.getProductMetaFromList(ProductsList).then(
                        function(ProductsMeta){
                            qFilter.resolve(ProductsMeta);
                        },
                        function(error){
                            qFilter.reject(error);
                        })
                } else {
                    qFilter.resolve(null);  //** put resolve instead of error
                }
            },
            function(error){
                console.log(error)
                qFilter.reject(error);
            }
        );
        return qFilter.promise;
    };

    /**
     * get sorted object
     */
    function retrieveList(method, tag, sortNode, limitValue) {
        var childRef = 'products_tags/' + method + '/' + tag;
        return FireFunc.onValueSort(childRef, sortNode, limitValue);
    };

    self.search = function(searchQuery, limitValue) {

        var searchWords = searchQuery.split(' ');
        var searchFields = ['categoryId', 'tag', 'words', 'userId'];

        var promises = {};

        for (var w=0; w< searchWords.length; w++) {
            for(var i=0; i< searchFields.length; i++) {

                var field   = searchFields[i];
                var word    = Utils.alphaNumericWide(searchWords[w]);

                if(word != '' && word != null && word != ' ') {
                    var promise = newSearch(field, word);
                    if(promise != null) {
                        promises[field + '-' + word] = promise;
                    };
                };


            }; // for i
        }; // w

        // fn new search
        function newSearch(field, word) {
            var qNew = $q.defer();
            self.filter(field, word, 'timestamp_creation', limitValue).then(
                function(ProductsMeta){
                    //console.log(field, ProductsMeta)
                    if(ProductsMeta != null) {
                        qNew.resolve(ProductsMeta);
                    } else {
                        qNew.resolve(null);
                    };
                },
                function(error){
                    // skip
                    if(error != null) {
                        console.log(error);
                        qNew.reject(error)
                    } else {
                        qNew.resolve(null);
                    }
                }
            );
            return qNew.promise;
        };

        /**
        function handleIter(){
            iter = iter + 1;
            if(iter >= nbIters){
                qSearch.resolve(SearchedProductsMeta);
            }
        };
        */

        //return qSearch.promise;
        return $q.all(promises);
    };


    /**
     * products_tags/categoryId
     * ** depreciated: replaced with CategoriesInfo
     */
    self.getBrowseCategories = function() {
        return FireFunc.onValue('products_tags/categoryId');
    };


    /**
     * products_meta
     */
    self.getProductMeta = function(productId) {
        var childRef = "categorias/multimarcas/comercios/" + productId;
        return FireFunc.onValue(childRef);
    };
    
    self.getPromoMeta = function(productId,promoId) {
        var childRef = "categorias/multimarcas/comercios/" + productId +"/promociones/" + promoId;
        return FireFunc.onValue(childRef);
    };

    /**
     * products_images/icon
     * CAN BE UPDATED WITH .storage()
     */
    self.getProductIcon = function(productId) {
        var childRef = "products_images/" + productId + '/icon';
        return FireFunc.onValue(childRef);
    };

    /**
     * products_images/icon
     */
    self.getProductThumbnail = function(productId) {
        var childRef = "products_images/" + productId + '/screenshot1';
        return FireFunc.onValue(childRef);
    };

    /**
     * products_images
     */
    self.getProductScreenshots = function(productId) {
        var childRef = "categorias/multimarcas/comercios/" + productId +"/perfil/avatar";
        return FireFunc.onValue(childRef);
    };
    self.getIcono = function(productId) {
        var childRef = "categorias/multimarcas/comercios/" + productId +"/perfil/icono";
        return FireFunc.onValue(childRef);
    };
    self.getBanner1 = function(productId) {
        var childRef = "categorias/multimarcas/comercios/" + productId +"/perfil/banners_destacados/banner1";
        return FireFunc.onValue(childRef);
    };
    self.getBanner2 = function(productId) {
        var childRef = "categorias/multimarcas/comercios/" + productId +"/perfil/banners_destacados/banner2";
        return FireFunc.onValue(childRef);
    };
    self.getBanner3 = function(productId) {
        var childRef = "categorias/multimarcas/comercios/" + productId +"/perfil/banners_destacados/banner3";
        return FireFunc.onValue(childRef);
    };

    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------

    self.ProductsThumbnails = {};

    self.loadThumbnails = function(ProductsMeta) {
        angular.forEach(ProductsMeta, function(value, productId){
            self.getProductThumbnail(productId).then(
                function(ProductThumbnail){
                  if(ProductThumbnail != null) {
                    self.ProductsThumbnails[productId] = ProductThumbnail;
                  }
                },
                function(error){
                    console.log(error);
                }
            )
        })
    };


    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    /**
     * Retrieve Product Meta of Featured
     * @params:     subNode
     * ******* rewrite to include it in products_tags/featured
     */
    self.getFeaturedProductMeta = function(subNode) {
        var qFea = $q.defer();
        var childRef = "featured/" + subNode;
        FireFunc.onValue(childRef).then(function(ProductList){
          // --
          if(ProductList != null) {
              self.getProductMetaFromList(ProductList).then(
                  function(ProductsMeta){
                      qFea.resolve(ProductsMeta);
                  },
                  function(error){
                      qFea.reject(error);
                  }
              )
          } else {
              qFea.resolve(null);
          }
          // --
        },
        function(error){
          qFea.reject(error);
        })
        return qFea.promise;
    };

    // list
    self.getFeaturedList = function(subNode) {
        var qFea = $q.defer();
        var childRef = "featured/" + subNode;
        FireFunc.onValue(childRef).then(function(ProductList){
          // --
          if(ProductList != null) {
              qFea.resolve(ProductList);
          } else {
              qFea.resolve(null);
          }
          // --
        },
        function(error){
          qFea.reject(error);
        })
        return qFea.promise;
    };

    self.updateFeaturedList = function(subNode, Featuredlist) {
        var childRef = "featured/" + subNode;
        return FireFunc.set(childRef, FeaturedList);
    };

    //@key: productId
     // rewrite to function
    self.getProductMetaFromList = function(ProductsList) {
        var promises = {};
        angular.forEach(ProductsList, function(indexValues, productId) {
            if(productId != undefined && productId != null) {
                var promise = getProductMetaPromise(indexValues, productId)
                if(promise != null) {
                    promises[productId]=promise;
                }
            }
        })
        // how about just return self.getProductMeta(productId)?
        function getProductMetaPromise(indexValues, productId) {
            var qGet = $q.defer();

            // if no index values, then retrieve first
            if(indexValues == true || indexValues == undefined || indexValues == null) {
                self.getIndexValues(productId).then(
                    function(newIndexValues){
                        proceedGet(newIndexValues);
                    },
                    function(error){
                        console.log(error)
                       qGet.reject(error);
                    }
                )
            } else {
                proceedGet(indexValues);
            };

            function proceedGet(latestIndexValues) {
                self.getProductMeta(productId).then(
                    function(ProductMeta){
                        // --> resolve
                        if(ProductMeta != null) {
                            qGet.resolve({
                                meta: ProductMeta,
                                index: latestIndexValues
                            });
                        } else {
                            qGet.resolve(null);
                        }
                    },
                    function(error){
                        qGet.reject(error);
                    }
                )
            };
            return qGet.promise;
        };
        return $q.all(promises);
    };

    // Hacemos Submit al nuevo Comercio, lo agregamos a la base de datos
    self.submitProduct = function(ProductMeta, ProductImages, AuthData) {
        var database = firebase.database();
        var slug = ProductMeta.slug;
        var datos = ProductMeta.perfil;

        var funcion = firebase.database().ref('categorias/multimarcas/comercios/' + slug ).set({
            estadisticas: {
                            cantidad_locales : 0,
                            checks: 0,
                            visitas:0,
                        },
            perfil :    {   
                            email: datos.email || '',
                            nombre: datos.nombre || '',
                            numero_telefono: datos.numero_telefono || '',
                            descripcion: datos.descripcion || '',
                            online: datos.online || 'true',
                            destacado: datos.destacado || 'false',
                        },
          });
        return funcion;
    };

    self.editProduct = function(ProductMeta, ProductImages, AuthData, productId, banner1, banner2, banner3, icono) {
        var database = firebase.database();
        var slug = productId;
        console.log(productId);
        var datos = ProductMeta.perfil;
        console.log(datos);

        var funcion = firebase.database().ref('categorias/multimarcas/comercios/' + slug ).update({
            perfil :    {   
                            avatar: ProductImages || '',
                            icono: icono || '',
                            banners_destacados:  {
                                            banner1: banner1 || '',
                                            banner2: banner2 || '',
                                            banner3: banner3 || '',
                                        },
                            email: datos.email || '',
                            nombre: datos.nombre || '',
                            numero_telefono: datos.numero_telefono || '',
                            descripcion: datos.descripcion || '',
                            online: datos.online || 'true',
                            destacado: datos.destacado || 'false',
                        },
          });
        return funcion;
    };


    // Hacemos Submit a la promocion
    self.submitPromocion = function(PromocionMeta, AuthData, slug) {
        var database = firebase.database();
        var datos = PromocionMeta;
        // Obtenemos el icono del comercio
        var childRef = "categorias/multimarcas/comercios/" + slug +"/perfil/icono";
        FireFunc.onValue(childRef).then(function(result){
          // --
          if(result != null) {
              var icono = result;
          } else {
              var icono = null;
          }
          // --
            // Notificamos al usuario en la bandeja de entrada
            if(PromocionMeta.notificaciones.mensajes == true ){
                console.log("Notificamos a los usuario que tienen como FAV");
                // Recorremos el array User
                UserService.getUsuarios().then(function(success){
                    console.log(success);
                    angular.forEach(success,function (detalle,key) {
                        if(detalle.hasOwnProperty(['favoritos'])){
                            if(detalle.favoritos.hasOwnProperty([slug])){
                                console.log("El usuario "+ key + " le tiene como Fav");
                                // Obtenemos el avatar del comercio
                                // Procedemos a colocar en su bandeja de entrada
                                firebase.database().ref('users/'+ key + '/notificaciones').push().set({
                                    detalle: {
                                                    titulo : datos.texto.titulo || '',
                                                    descripcion: datos.texto.descripcion || '',
                                            },
                                    fechainicio:datos.fechainicio || '',
                                    fechafin:datos.fechafin || '',
                                    estado:'nueva',
                                    icono:icono,
                                }); 
                            }
                        }
                    });
                });
            }
        });
        
        var ref = firebase.database().ref('categorias/multimarcas/comercios/' + slug);
        var id = ref.child('promociones');

        var funcion = id.push().set({
            texto: {
                            titulo : datos.texto.titulo || '',
                            descripcion: datos.texto.descripcion || '',
                            descripcion_larga: datos.texto.descripcion_larga || '',
                    },
            fechainicio:datos.fechainicio || '',
            fechafin:datos.fechafin || '',
            categoria:datos.categoria || '',
          });
        return funcion;
    };


    // Hacemos Submit a la promocion Editada
    self.editPromocion = function(PromocionMeta, AuthData, slug, promoId) {
        var datos = PromocionMeta;
        // Obtenemos el icono del comercio
        var childRef = "categorias/multimarcas/comercios/" + slug +"/perfil/icono";
        FireFunc.onValue(childRef).then(function(result){
          // --
          if(result != null) {
              var icono = result;
          } else {
              var icono = null;
          }
          // --
            // Notificamos al usuario en la bandeja de entrada
            if(PromocionMeta.notificaciones.mensajes == true ){
                console.log("Notificamos a los usuario que tienen como FAV");
                // Recorremos el array User
                UserService.getUsuarios().then(function(success){
                    console.log(success);
                    angular.forEach(success,function (detalle,key) {
                        if(detalle.hasOwnProperty(['favoritos'])){
                            if(detalle.favoritos.hasOwnProperty([slug])){
                                console.log("El usuario "+ key + " le tiene como Fav");
                                // Obtenemos el avatar del comercio
                                // Procedemos a colocar en su bandeja de entrada
                                firebase.database().ref('users/'+ key + '/notificaciones').push().set({
                                    detalle: {
                                                    titulo : datos.texto.titulo || '',
                                                    descripcion: datos.texto.descripcion || '',
                                            },
                                    fechainicio:datos.fechainicio || '',
                                    fechafin:datos.fechafin || '',
                                    estado:'nueva',
                                    icono:icono,
                                }); 
                            }
                        }
                    });
                });
            }
        });

        var funcion = firebase.database().ref('categorias/multimarcas/comercios/' + slug +'/promociones/'+promoId ).update({
            texto: {
                            titulo : datos.texto.titulo || '',
                            descripcion: datos.texto.descripcion || '',
                            descripcion_larga: datos.texto.descripcion_larga || '',
                    },
            fechainicio:datos.fechainicio || '',
            fechafin:datos.fechafin || '',
            categoria:datos.categoria || '',
          });
        return funcion;
    };
    self.deleteProduct = function(productId, AuthData) {
        return ProductManagement.delete(productId, AuthData);
    };

    self.eliminarComercio = function(slug) {
        console.log(slug);
        return firebase.database().ref('categorias/multimarcas/comercios/'+slug).remove();
    };

    self.eliminarPromocion = function(comercio, promocion) {
        return firebase.database().ref('categorias/multimarcas/comercios/'+comercio+'/promociones/'+ promocion).remove();
    };


    self.eliminarImagen = function(ruta,update) {
        console.log(ruta);
        console.log(update);
        switch (update) {
                    case 'avatar':
                        return firebase.database().ref(ruta).update({avatar:''});
                        break
                    case 'icono':
                        return firebase.database().ref(ruta).update({icono:''});
                        break
                    case 'banner1':
                        return firebase.database().ref(ruta).update({banner1:''});
                        break
                    case 'banner2':
                        return firebase.database().ref(ruta).update({banner2:''});
                        break
                    case 'banner3':
                        return firebase.database().ref(ruta).update({banner3:''});
                        break
        }
    };

    return self;
})

.factory('MultiSucursalService', function($q, ProductManagement, Utils, FireFunc) {
    var self = this;

    /**
     * Retrieve products_index and fill it
     */
    self.filter = function(method, tag, sortNode, limitValue) {
        var qFilter = $q.defer();
        retrieveList(method, tag, sortNode, limitValue).then(
            function(ProductsList){
                //console.log(ProductsList)
                if(ProductsList != null) {
                    self.getProductMetaFromList(ProductsList).then(
                        function(ProductsMeta){
                            qFilter.resolve(ProductsMeta);
                        },
                        function(error){
                            qFilter.reject(error);
                        })
                } else {
                    qFilter.resolve(null);  //** put resolve instead of error
                }
            },
            function(error){
                console.log(error)
                qFilter.reject(error);
            }
        );
        return qFilter.promise;
    };

    /**
     * get sorted object
     */
    function retrieveList(method, tag, sortNode, limitValue) {
        var childRef = 'products_tags/' + method + '/' + tag;
        return FireFunc.onValueSort(childRef, sortNode, limitValue);
    };

    self.search = function(searchQuery, limitValue) {

        var searchWords = searchQuery.split(' ');
        var searchFields = ['categoryId', 'tag', 'words', 'userId'];

        var promises = {};

        for (var w=0; w< searchWords.length; w++) {
            for(var i=0; i< searchFields.length; i++) {

                var field   = searchFields[i];
                var word    = Utils.alphaNumericWide(searchWords[w]);

                if(word != '' && word != null && word != ' ') {
                    var promise = newSearch(field, word);
                    if(promise != null) {
                        promises[field + '-' + word] = promise;
                    };
                };


            }; // for i
        }; // w

        // fn new search
        function newSearch(field, word) {
            var qNew = $q.defer();
            self.filter(field, word, 'timestamp_creation', limitValue).then(
                function(ProductsMeta){
                    //console.log(field, ProductsMeta)
                    if(ProductsMeta != null) {
                        qNew.resolve(ProductsMeta);
                    } else {
                        qNew.resolve(null);
                    };
                },
                function(error){
                    // skip
                    if(error != null) {
                        console.log(error);
                        qNew.reject(error)
                    } else {
                        qNew.resolve(null);
                    }
                }
            );
            return qNew.promise;
        };

        /**
        function handleIter(){
            iter = iter + 1;
            if(iter >= nbIters){
                qSearch.resolve(SearchedProductsMeta);
            }
        };
        */

        //return qSearch.promise;
        return $q.all(promises);
    };


    /**
     * products_tags/categoryId
     * ** depreciated: replaced with CategoriesInfo
     */
    self.getBrowseCategories = function() {
        return FireFunc.onValue('products_tags/categoryId');
    };


    /**
     * products_meta
     */
    self.getProductMeta = function(comercio,productId) {
        var childRef = "categorias/multimarcas/comercios/" + comercio +"/locales/"+ productId;
        return FireFunc.onValue(childRef);
    };

    self.getPromoMeta = function(shopping, local, promoId) {
        var childRef = "categorias/multimarcas/comercios/" + shopping +"/locales/" + local + "/promociones/" + promoId;
        return FireFunc.onValue(childRef);
    };

    /**
     * products_images/icon
     * CAN BE UPDATED WITH .storage()
     */
    self.getProductIcon = function(productId) {
        var childRef = "products_images/" + productId + '/icon';
        return FireFunc.onValue(childRef);
    };

    /**
     * products_images/icon
     */
    self.getProductThumbnail = function(productId) {
        var childRef = "products_images/" + productId + '/screenshot1';
        return FireFunc.onValue(childRef);
    };

    /**
     * products_images
     */
    self.getProductScreenshots = function(comercio,local) {
        var childRef = 'categorias/multimarcas/comercios/' + comercio + '/locales/' + local + '/perfil/avatar';
        return FireFunc.onValue(childRef);
    };

    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------

    self.ProductsThumbnails = {};

    self.loadThumbnails = function(ProductsMeta) {
        angular.forEach(ProductsMeta, function(value, productId){
            self.getProductThumbnail(productId).then(
                function(ProductThumbnail){
                  if(ProductThumbnail != null) {
                    self.ProductsThumbnails[productId] = ProductThumbnail;
                  }
                },
                function(error){
                    console.log(error);
                }
            )
        })
    };


    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    /**
     * Retrieve Product Meta of Featured
     * @params:     subNode
     * ******* rewrite to include it in products_tags/featured
     */
    self.getFeaturedProductMeta = function(subNode) {
        var qFea = $q.defer();
        var childRef = "featured/" + subNode;
        FireFunc.onValue(childRef).then(function(ProductList){
          // --
          if(ProductList != null) {
              self.getProductMetaFromList(ProductList).then(
                  function(ProductsMeta){
                      qFea.resolve(ProductsMeta);
                  },
                  function(error){
                      qFea.reject(error);
                  }
              )
          } else {
              qFea.resolve(null);
          }
          // --
        },
        function(error){
          qFea.reject(error);
        })
        return qFea.promise;
    };

    // list
    self.getFeaturedList = function(subNode) {
        var qFea = $q.defer();
        var childRef = "featured/" + subNode;
        FireFunc.onValue(childRef).then(function(ProductList){
          // --
          if(ProductList != null) {
              qFea.resolve(ProductList);
          } else {
              qFea.resolve(null);
          }
          // --
        },
        function(error){
          qFea.reject(error);
        })
        return qFea.promise;
    };

    self.updateFeaturedList = function(subNode, Featuredlist) {
        var childRef = "featured/" + subNode;
        return FireFunc.set(childRef, FeaturedList);
    };

    //@key: productId
     // rewrite to function
    self.getProductMetaFromList = function(ProductsList) {
        var promises = {};
        angular.forEach(ProductsList, function(indexValues, productId) {
            if(productId != undefined && productId != null) {
                var promise = getProductMetaPromise(indexValues, productId)
                if(promise != null) {
                    promises[productId]=promise;
                }
            }
        })
        // how about just return self.getProductMeta(productId)?
        function getProductMetaPromise(indexValues, productId) {
            var qGet = $q.defer();

            // if no index values, then retrieve first
            if(indexValues == true || indexValues == undefined || indexValues == null) {
                self.getIndexValues(productId).then(
                    function(newIndexValues){
                        proceedGet(newIndexValues);
                    },
                    function(error){
                        console.log(error)
                       qGet.reject(error);
                    }
                )
            } else {
                proceedGet(indexValues);
            };

            function proceedGet(latestIndexValues) {
                self.getProductMeta(productId).then(
                    function(ProductMeta){
                        // --> resolve
                        if(ProductMeta != null) {
                            qGet.resolve({
                                meta: ProductMeta,
                                index: latestIndexValues
                            });
                        } else {
                            qGet.resolve(null);
                        }
                    },
                    function(error){
                        qGet.reject(error);
                    }
                )
            };
            return qGet.promise;
        };
        return $q.all(promises);
    };

    // Hacemos Submit al nuevo Comercio, lo agregamos a la base de datos
    self.submitProduct = function(ProductMeta, AuthData, comercio) {
        var database = firebase.database();
        var slug = ProductMeta.slug;
        var datos = ProductMeta.perfil;

        var funcion = firebase.database().ref('categorias/multimarcas/comercios/' + comercio + '/locales/' + slug ).set({
            estadisticas: {
                            checks: 0,
                            visitas:0,
                        },
            perfil :    {   
                            email: datos.email || '',
                            nombre: datos.nombre || '',
                            numero_telefono: datos.numero_telefono || '',
                            direccion: datos.direccion || '',
                            pais: datos.pais || '',
                            ciudad: datos.ciudad || '',
                            descripcion: datos.descripcion || '',
                            horario:    {
                                            lunes:  {
                                                        desde: datos.horario.lunes.desde || '',
                                                        hasta: datos.horario.lunes.hasta || ''
                                                     },
                                            martes:  {
                                                        desde: datos.horario.martes.desde || '',
                                                        hasta: datos.horario.martes.hasta || ''
                                                     },
                                            miercoles:  {
                                                        desde: datos.horario.miercoles.desde || '',
                                                        hasta: datos.horario.miercoles.hasta || ''
                                                     },
                                            jueves:  {
                                                        desde: datos.horario.jueves.desde || '',
                                                        hasta: datos.horario.jueves.hasta || ''
                                                     },
                                            viernes:  {
                                                        desde: datos.horario.viernes.desde || '',
                                                        hasta: datos.horario.viernes.hasta || ''
                                                     },
                                            sabado:  {
                                                        desde: datos.horario.sabado.desde || '',
                                                        hasta: datos.horario.sabado.hasta || ''
                                                     },
                                            domingo:  {
                                                        desde: datos.horario.domingo.desde || '',
                                                        hasta: datos.horario.domingo.hasta || ''
                                                     },
                                        },
                            mapa:    {
                                                latitud: datos.mapa.latitud || '',
                                                longitud: datos.mapa.longitud || '',
                                            },
                            online: datos.online || '',
                            destacado: datos.destacado || '',
                        },
          });
        return funcion;
    };

    self.editProduct = function(ProductMeta, AuthData, comercio, productId, banner1, banner2, banner3) {
        var database = firebase.database();
        var slug = productId;
        console.log(productId);
        var datos = ProductMeta.perfil;

        var funcion = firebase.database().ref('categorias/multimarcas/comercios/' + comercio + '/locales/' + slug ).update({
            perfil :    {   
                            banners_destacados:  {
                                            banner1: banner1 || '',
                                            banner2: banner2 || '',
                                            banner3: banner3 || '',
                                        },
                            email: datos.email || '',
                            nombre: datos.nombre || '',
                            numero_telefono: datos.numero_telefono || '',
                            direccion: datos.direccion || '',
                            pais: datos.pais || '',
                            ciudad: datos.ciudad || '',
                            descripcion: datos.descripcion || '',
                            horario:    {
                                            lunes:  {
                                                        desde: datos.horario.lunes.desde || '',
                                                        hasta: datos.horario.lunes.hasta || ''
                                                     },
                                            martes:  {
                                                        desde: datos.horario.martes.desde || '',
                                                        hasta: datos.horario.martes.hasta || ''
                                                     },
                                            miercoles:  {
                                                        desde: datos.horario.miercoles.desde || '',
                                                        hasta: datos.horario.miercoles.hasta || ''
                                                     },
                                            jueves:  {
                                                        desde: datos.horario.jueves.desde || '',
                                                        hasta: datos.horario.jueves.hasta || ''
                                                     },
                                            viernes:  {
                                                        desde: datos.horario.viernes.desde || '',
                                                        hasta: datos.horario.viernes.hasta || ''
                                                     },
                                            sabado:  {
                                                        desde: datos.horario.sabado.desde || '',
                                                        hasta: datos.horario.sabado.hasta || ''
                                                     },
                                            domingo:  {
                                                        desde: datos.horario.domingo.desde || '',
                                                        hasta: datos.horario.domingo.hasta || ''
                                                     },
                                        },
                            mapa:    {
                                                latitud: datos.mapa.latitud || '',
                                                longitud: datos.mapa.longitud || '',
                                            },
                            online: datos.online || '',
                            destacado: datos.destacado || '',
                        },
          });
        return funcion;
    };


    // Hacemos Submit a la promocion
    self.submitPromocion = function(PromocionMeta, AuthData, shopping, local) {
        var database = firebase.database();
        var datos = PromocionMeta;
        // Obtenemos el icono del comercio
        var childRef = "categorias/multimarcas/comercios/" + shopping +"/locales/"+local+"/perfil/icono";
        FireFunc.onValue(childRef).then(function(result){
          // --
          if(result != null) {
              var icono = result;
          } else {
              var icono = null;
          }
          // --
            // Notificamos al usuario en la bandeja de entrada
            if(PromocionMeta.notificaciones.mensajes == true ){
                console.log("Notificamos a los usuario que tienen como FAV");
                // Recorremos el array User
                UserService.getUsuarios().then(function(success){
                    console.log(success);
                    angular.forEach(success,function (detalle,key) {
                        if(detalle.hasOwnProperty(['favoritos'])){
                            if(detalle.favoritos.hasOwnProperty([local])){
                                console.log("El usuario "+ key + " le tiene como Fav");
                                // Obtenemos el avatar del comercio
                                // Procedemos a colocar en su bandeja de entrada
                                firebase.database().ref('users/'+ key + '/notificaciones').push().set({
                                    detalle: {
                                                    titulo : datos.texto.titulo || '',
                                                    descripcion: datos.texto.descripcion || '',
                                            },
                                    fechainicio:datos.fechainicio || '',
                                    fechafin:datos.fechafin || '',
                                    estado:'nueva',
                                    icono:icono,
                                }); 
                            }
                        }
                    });
                });
            }
        });
        
        var ref = firebase.database().ref('categorias/multimarcas/comercios/' + shopping +'/locales/' + local );
        var id = ref.child('promociones');

        var funcion = id.push().set({
            texto: {
                            titulo : datos.texto.titulo || '',
                            descripcion: datos.texto.descripcion || '',
                    },
            fechainicio:datos.fechainicio || '',
            fechafin:datos.fechafin || '',
            categoria:datos.categoria || '',
          });
        return funcion;
    };


    // Hacemos Submit a la promocion Editada
    self.editPromocion = function(PromocionMeta, AuthData, shopping, local, promoId) {
        var datos = PromocionMeta;
        // Obtenemos el icono del comercio
        var childRef = "categorias/multimarcas/comercios/" + shopping +"/locales/"+local+"/perfil/icono";
        FireFunc.onValue(childRef).then(function(result){
          // --
          if(result != null) {
              var icono = result;
          } else {
              var icono = null;
          }
          // --
            // Notificamos al usuario en la bandeja de entrada
            if(PromocionMeta.notificaciones.mensajes == true ){
                console.log("Notificamos a los usuario que tienen como FAV");
                // Recorremos el array User
                UserService.getUsuarios().then(function(success){
                    console.log(success);
                    angular.forEach(success,function (detalle,key) {
                        if(detalle.hasOwnProperty(['favoritos'])){
                            if(detalle.favoritos.hasOwnProperty([local])){
                                console.log("El usuario "+ key + " le tiene como Fav");
                                // Obtenemos el avatar del comercio
                                // Procedemos a colocar en su bandeja de entrada
                                firebase.database().ref('users/'+ key + '/notificaciones').push().set({
                                    detalle: {
                                                    titulo : datos.texto.titulo || '',
                                                    descripcion: datos.texto.descripcion || '',
                                            },
                                    fechainicio:datos.fechainicio || '',
                                    fechafin:datos.fechafin || '',
                                    estado:'nueva',
                                    icono:icono,
                                }); 
                            }
                        }
                    });
                });
            }
        });

        var funcion = firebase.database().ref('categorias/multimarcas/comercios/' + shopping +'/locales/' + local + '/promociones/' + promoId ).update({
            texto: {
                            titulo : datos.texto.titulo || '',
                            descripcion: datos.texto.descripcion || '',
                    },
            fechainicio:datos.fechainicio || '',
            fechafin:datos.fechafin || '',
            categoria:datos.categoria || '',
          });
        return funcion;
    };

    self.deleteProduct = function(productId, AuthData) {
        return ProductManagement.delete(productId, AuthData);
    };

    self.eliminarSucursal = function(multimarca, sucursal) {
        console.log(multimarca);
        return firebase.database().ref('categorias/multimarcas/comercios/'+multimarca+'/locales/'+sucursal).remove();
    };

    self.eliminarPromocion = function(comercio, local, promocion) {
        return firebase.database().ref('categorias/multimarcas/comercios/'+comercio+'/locales/'+local+'/promociones/'+ promocion).remove();
    };
    

    self.eliminarImagen = function(ruta,update) {
        console.log(ruta);
        console.log(update);
        switch (update) {
                    case 'banner1':
                        return firebase.database().ref(ruta).update({banner1:''});
                        break
                    case 'banner2':
                        return firebase.database().ref(ruta).update({banner2:''});
                        break
                    case 'banner3':
                        return firebase.database().ref(ruta).update({banner3:''});
                        break
        }
    };

    return self;
})

/*
    FIN MULTIMARCAS
*/

/*
    SUPERMERCADOS
*/
.factory('SupermercadosService', function($q, ProductManagement, Utils, FireFunc) {
    var self = this;

    /**
     * Retrieve products_index and fill it
     */
    self.filter = function(method, tag, sortNode, limitValue) {
        var qFilter = $q.defer();
        retrieveList(method, tag, sortNode, limitValue).then(
            function(ProductsList){
                //console.log(ProductsList)
                if(ProductsList != null) {
                    self.getProductMetaFromList(ProductsList).then(
                        function(ProductsMeta){
                            qFilter.resolve(ProductsMeta);
                        },
                        function(error){
                            qFilter.reject(error);
                        })
                } else {
                    qFilter.resolve(null);  //** put resolve instead of error
                }
            },
            function(error){
                console.log(error)
                qFilter.reject(error);
            }
        );
        return qFilter.promise;
    };

    /**
     * get sorted object
     */
    function retrieveList(method, tag, sortNode, limitValue) {
        var childRef = 'products_tags/' + method + '/' + tag;
        return FireFunc.onValueSort(childRef, sortNode, limitValue);
    };

    self.search = function(searchQuery, limitValue) {

        var searchWords = searchQuery.split(' ');
        var searchFields = ['categoryId', 'tag', 'words', 'userId'];

        var promises = {};

        for (var w=0; w< searchWords.length; w++) {
            for(var i=0; i< searchFields.length; i++) {

                var field   = searchFields[i];
                var word    = Utils.alphaNumericWide(searchWords[w]);

                if(word != '' && word != null && word != ' ') {
                    var promise = newSearch(field, word);
                    if(promise != null) {
                        promises[field + '-' + word] = promise;
                    };
                };


            }; // for i
        }; // w

        // fn new search
        function newSearch(field, word) {
            var qNew = $q.defer();
            self.filter(field, word, 'timestamp_creation', limitValue).then(
                function(ProductsMeta){
                    //console.log(field, ProductsMeta)
                    if(ProductsMeta != null) {
                        qNew.resolve(ProductsMeta);
                    } else {
                        qNew.resolve(null);
                    };
                },
                function(error){
                    // skip
                    if(error != null) {
                        console.log(error);
                        qNew.reject(error)
                    } else {
                        qNew.resolve(null);
                    }
                }
            );
            return qNew.promise;
        };

        /**
        function handleIter(){
            iter = iter + 1;
            if(iter >= nbIters){
                qSearch.resolve(SearchedProductsMeta);
            }
        };
        */

        //return qSearch.promise;
        return $q.all(promises);
    };


    /**
     * products_tags/categoryId
     * ** depreciated: replaced with CategoriesInfo
     */
    self.getBrowseCategories = function() {
        return FireFunc.onValue('products_tags/categoryId');
    };


    /**
     * products_meta
     */
    self.getProductMeta = function(productId) {
        var childRef = "categorias/supermercados/comercios/" + productId;
        return FireFunc.onValue(childRef);
    };
    
    self.getPromoMeta = function(productId,promoId) {
        var childRef = "categorias/supermercados/comercios/" + productId +"/promociones/" + promoId;
        return FireFunc.onValue(childRef);
    };

    /**
     * products_images/icon
     * CAN BE UPDATED WITH .storage()
     */
    self.getProductIcon = function(productId) {
        var childRef = "products_images/" + productId + '/icon';
        return FireFunc.onValue(childRef);
    };

    /**
     * products_images/icon
     */
    self.getProductThumbnail = function(productId) {
        var childRef = "products_images/" + productId + '/screenshot1';
        return FireFunc.onValue(childRef);
    };

    /**
     * products_images
     */
    self.getProductScreenshots = function(productId) {
        var childRef = "categorias/supermercados/comercios/" + productId +"/perfil/avatar";
        return FireFunc.onValue(childRef);
    };
    self.getIcono = function(productId) {
        var childRef = "categorias/supermercados/comercios/" + productId +"/perfil/icono";
        return FireFunc.onValue(childRef);
    };
    self.getBanner1 = function(productId) {
        var childRef = "categorias/supermercados/comercios/" + productId +"/perfil/banners_destacados/banner1";
        return FireFunc.onValue(childRef);
    };
    self.getBanner2 = function(productId) {
        var childRef = "categorias/supermercados/comercios/" + productId +"/perfil/banners_destacados/banner2";
        return FireFunc.onValue(childRef);
    };
    self.getBanner3 = function(productId) {
        var childRef = "categorias/supermercados/comercios/" + productId +"/perfil/banners_destacados/banner3";
        return FireFunc.onValue(childRef);
    };

    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------

    self.ProductsThumbnails = {};

    self.loadThumbnails = function(ProductsMeta) {
        angular.forEach(ProductsMeta, function(value, productId){
            self.getProductThumbnail(productId).then(
                function(ProductThumbnail){
                  if(ProductThumbnail != null) {
                    self.ProductsThumbnails[productId] = ProductThumbnail;
                  }
                },
                function(error){
                    console.log(error);
                }
            )
        })
    };


    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    /**
     * Retrieve Product Meta of Featured
     * @params:     subNode
     * ******* rewrite to include it in products_tags/featured
     */
    self.getFeaturedProductMeta = function(subNode) {
        var qFea = $q.defer();
        var childRef = "featured/" + subNode;
        FireFunc.onValue(childRef).then(function(ProductList){
          // --
          if(ProductList != null) {
              self.getProductMetaFromList(ProductList).then(
                  function(ProductsMeta){
                      qFea.resolve(ProductsMeta);
                  },
                  function(error){
                      qFea.reject(error);
                  }
              )
          } else {
              qFea.resolve(null);
          }
          // --
        },
        function(error){
          qFea.reject(error);
        })
        return qFea.promise;
    };

    // list
    self.getFeaturedList = function(subNode) {
        var qFea = $q.defer();
        var childRef = "featured/" + subNode;
        FireFunc.onValue(childRef).then(function(ProductList){
          // --
          if(ProductList != null) {
              qFea.resolve(ProductList);
          } else {
              qFea.resolve(null);
          }
          // --
        },
        function(error){
          qFea.reject(error);
        })
        return qFea.promise;
    };

    self.updateFeaturedList = function(subNode, Featuredlist) {
        var childRef = "featured/" + subNode;
        return FireFunc.set(childRef, FeaturedList);
    };

    //@key: productId
     // rewrite to function
    self.getProductMetaFromList = function(ProductsList) {
        var promises = {};
        angular.forEach(ProductsList, function(indexValues, productId) {
            if(productId != undefined && productId != null) {
                var promise = getProductMetaPromise(indexValues, productId)
                if(promise != null) {
                    promises[productId]=promise;
                }
            }
        })
        // how about just return self.getProductMeta(productId)?
        function getProductMetaPromise(indexValues, productId) {
            var qGet = $q.defer();

            // if no index values, then retrieve first
            if(indexValues == true || indexValues == undefined || indexValues == null) {
                self.getIndexValues(productId).then(
                    function(newIndexValues){
                        proceedGet(newIndexValues);
                    },
                    function(error){
                        console.log(error)
                       qGet.reject(error);
                    }
                )
            } else {
                proceedGet(indexValues);
            };

            function proceedGet(latestIndexValues) {
                self.getProductMeta(productId).then(
                    function(ProductMeta){
                        // --> resolve
                        if(ProductMeta != null) {
                            qGet.resolve({
                                meta: ProductMeta,
                                index: latestIndexValues
                            });
                        } else {
                            qGet.resolve(null);
                        }
                    },
                    function(error){
                        qGet.reject(error);
                    }
                )
            };
            return qGet.promise;
        };
        return $q.all(promises);
    };

    // Hacemos Submit al nuevo Comercio, lo agregamos a la base de datos
    self.submitProduct = function(ProductMeta, ProductImages, AuthData) {
        var database = firebase.database();
        var slug = ProductMeta.slug;
        var datos = ProductMeta.perfil;

        var funcion = firebase.database().ref('categorias/supermercados/comercios/' + slug ).set({
            estadisticas: {
                            cantidad_locales : 0,
                            checks: 0,
                            visitas:0,
                        },
            perfil :    {   
                            email: datos.email || '',
                            nombre: datos.nombre || '',
                            numero_telefono: datos.numero_telefono || '',
                            descripcion: datos.descripcion || '',
                            online: datos.online || 'true',
                            destacado: datos.destacado || 'false',
                        },
          });
        return funcion;
    };

    self.editProduct = function(ProductMeta, ProductImages, AuthData, productId, banner1, banner2, banner3, icono) {
        var database = firebase.database();
        var slug = productId;
        console.log(productId);
        var datos = ProductMeta.perfil;
        console.log(datos);

        var funcion = firebase.database().ref('categorias/supermercados/comercios/' + slug ).update({
            perfil :    {   
                            avatar: ProductImages || '',
                            icono: icono || '',
                            banners_destacados:  {
                                            banner1: banner1 || '',
                                            banner2: banner2 || '',
                                            banner3: banner3 || '',
                                        },
                            email: datos.email || '',
                            nombre: datos.nombre || '',
                            numero_telefono: datos.numero_telefono || '',
                            descripcion: datos.descripcion || '',
                            online: datos.online || 'true',
                            destacado: datos.destacado || 'false',
                        },
          });
        return funcion;
    };


    // Hacemos Submit a la promocion
    self.submitPromocion = function(PromocionMeta, AuthData, slug) {
        var database = firebase.database();
        var datos = PromocionMeta;
        // Obtenemos el icono del comercio
        var childRef = "categorias/supermercados/comercios/" + slug +"/perfil/icono";
        FireFunc.onValue(childRef).then(function(result){
          // --
          if(result != null) {
              var icono = result;
          } else {
              var icono = null;
          }
          // --
            // Notificamos al usuario en la bandeja de entrada
            if(PromocionMeta.notificaciones.mensajes == true ){
                console.log("Notificamos a los usuario que tienen como FAV");
                // Recorremos el array User
                UserService.getUsuarios().then(function(success){
                    console.log(success);
                    angular.forEach(success,function (detalle,key) {
                        if(detalle.hasOwnProperty(['favoritos'])){
                            if(detalle.favoritos.hasOwnProperty([slug])){
                                console.log("El usuario "+ key + " le tiene como Fav");
                                // Obtenemos el avatar del comercio
                                // Procedemos a colocar en su bandeja de entrada
                                firebase.database().ref('users/'+ key + '/notificaciones').push().set({
                                    detalle: {
                                                    titulo : datos.texto.titulo || '',
                                                    descripcion: datos.texto.descripcion || '',
                                            },
                                    fechainicio:datos.fechainicio || '',
                                    fechafin:datos.fechafin || '',
                                    estado:'nueva',
                                    icono:icono,
                                }); 
                            }
                        }
                    });
                });
            }
        });
        
        var ref = firebase.database().ref('categorias/supermercados/comercios/' + slug);
        var id = ref.child('promociones');

        var funcion = id.push().set({
            texto: {
                            titulo : datos.texto.titulo || '',
                            descripcion: datos.texto.descripcion || '',
                            descripcion_larga: datos.texto.descripcion_larga || '',
                    },
            fechainicio:datos.fechainicio || '',
            fechafin:datos.fechafin || '',
            categoria:datos.categoria || '',
          });
        return funcion;
    };


    // Hacemos Submit a la promocion Editada
    self.editPromocion = function(PromocionMeta, AuthData, slug, promoId) {
        var datos = PromocionMeta;
        // Obtenemos el icono del comercio
        var childRef = "categorias/supermercados/comercios/" + slug +"/perfil/icono";
        FireFunc.onValue(childRef).then(function(result){
          // --
          if(result != null) {
              var icono = result;
          } else {
              var icono = null;
          }
          // --
            // Notificamos al usuario en la bandeja de entrada
            if(PromocionMeta.notificaciones.mensajes == true ){
                console.log("Notificamos a los usuario que tienen como FAV");
                // Recorremos el array User
                UserService.getUsuarios().then(function(success){
                    console.log(success);
                    angular.forEach(success,function (detalle,key) {
                        if(detalle.hasOwnProperty(['favoritos'])){
                            if(detalle.favoritos.hasOwnProperty([slug])){
                                console.log("El usuario "+ key + " le tiene como Fav");
                                // Obtenemos el avatar del comercio
                                // Procedemos a colocar en su bandeja de entrada
                                firebase.database().ref('users/'+ key + '/notificaciones').push().set({
                                    detalle: {
                                                    titulo : datos.texto.titulo || '',
                                                    descripcion: datos.texto.descripcion || '',
                                            },
                                    fechainicio:datos.fechainicio || '',
                                    fechafin:datos.fechafin || '',
                                    estado:'nueva',
                                    icono:icono,
                                }); 
                            }
                        }
                    });
                });
            }
        });

        var funcion = firebase.database().ref('categorias/supermercados/comercios/' + slug +'/promociones/'+promoId ).update({
            texto: {
                            titulo : datos.texto.titulo || '',
                            descripcion: datos.texto.descripcion || '',
                            descripcion_larga: datos.texto.descripcion_larga || '',
                    },
            fechainicio:datos.fechainicio || '',
            fechafin:datos.fechafin || '',
            categoria:datos.categoria || '',
          });
        return funcion;
    };
    self.deleteProduct = function(productId, AuthData) {
        return ProductManagement.delete(productId, AuthData);
    };

    self.eliminarComercio = function(slug) {
        console.log(slug);
        return firebase.database().ref('categorias/supermercados/comercios/'+slug).remove();
    };

    self.eliminarPromocion = function(comercio, promocion) {
        return firebase.database().ref('categorias/supermercados/comercios/'+comercio+'/promociones/'+ promocion).remove();
    };
    

    self.eliminarImagen = function(ruta,update) {
        console.log(ruta);
        console.log(update);
        switch (update) {
                    case 'avatar':
                        return firebase.database().ref(ruta).update({avatar:''});
                        break
                    case 'icono':
                        return firebase.database().ref(ruta).update({icono:''});
                        break
                    case 'banner1':
                        return firebase.database().ref(ruta).update({banner1:''});
                        break
                    case 'banner2':
                        return firebase.database().ref(ruta).update({banner2:''});
                        break
                    case 'banner3':
                        return firebase.database().ref(ruta).update({banner3:''});
                        break
        }
    };

    return self;
})

.factory('SuperSucursalService', function($q, ProductManagement, Utils, FireFunc) {
    var self = this;

    /**
     * Retrieve products_index and fill it
     */
    self.filter = function(method, tag, sortNode, limitValue) {
        var qFilter = $q.defer();
        retrieveList(method, tag, sortNode, limitValue).then(
            function(ProductsList){
                //console.log(ProductsList)
                if(ProductsList != null) {
                    self.getProductMetaFromList(ProductsList).then(
                        function(ProductsMeta){
                            qFilter.resolve(ProductsMeta);
                        },
                        function(error){
                            qFilter.reject(error);
                        })
                } else {
                    qFilter.resolve(null);  //** put resolve instead of error
                }
            },
            function(error){
                console.log(error)
                qFilter.reject(error);
            }
        );
        return qFilter.promise;
    };

    /**
     * get sorted object
     */
    function retrieveList(method, tag, sortNode, limitValue) {
        var childRef = 'products_tags/' + method + '/' + tag;
        return FireFunc.onValueSort(childRef, sortNode, limitValue);
    };

    self.search = function(searchQuery, limitValue) {

        var searchWords = searchQuery.split(' ');
        var searchFields = ['categoryId', 'tag', 'words', 'userId'];

        var promises = {};

        for (var w=0; w< searchWords.length; w++) {
            for(var i=0; i< searchFields.length; i++) {

                var field   = searchFields[i];
                var word    = Utils.alphaNumericWide(searchWords[w]);

                if(word != '' && word != null && word != ' ') {
                    var promise = newSearch(field, word);
                    if(promise != null) {
                        promises[field + '-' + word] = promise;
                    };
                };


            }; // for i
        }; // w

        // fn new search
        function newSearch(field, word) {
            var qNew = $q.defer();
            self.filter(field, word, 'timestamp_creation', limitValue).then(
                function(ProductsMeta){
                    //console.log(field, ProductsMeta)
                    if(ProductsMeta != null) {
                        qNew.resolve(ProductsMeta);
                    } else {
                        qNew.resolve(null);
                    };
                },
                function(error){
                    // skip
                    if(error != null) {
                        console.log(error);
                        qNew.reject(error)
                    } else {
                        qNew.resolve(null);
                    }
                }
            );
            return qNew.promise;
        };

        /**
        function handleIter(){
            iter = iter + 1;
            if(iter >= nbIters){
                qSearch.resolve(SearchedProductsMeta);
            }
        };
        */

        //return qSearch.promise;
        return $q.all(promises);
    };


    /**
     * products_tags/categoryId
     * ** depreciated: replaced with CategoriesInfo
     */
    self.getBrowseCategories = function() {
        return FireFunc.onValue('products_tags/categoryId');
    };


    /**
     * products_meta
     */
    self.getProductMeta = function(comercio,productId) {
        var childRef = "categorias/supermercados/comercios/" + comercio +"/locales/"+ productId;
        return FireFunc.onValue(childRef);
    };

    self.getPromoMeta = function(shopping, local, promoId) {
        var childRef = "categorias/supermercados/comercios/" + shopping +"/locales/" + local + "/promociones/" + promoId;
        return FireFunc.onValue(childRef);
    };

    /**
     * products_images/icon
     * CAN BE UPDATED WITH .storage()
     */
    self.getProductIcon = function(productId) {
        var childRef = "products_images/" + productId + '/icon';
        return FireFunc.onValue(childRef);
    };

    /**
     * products_images/icon
     */
    self.getProductThumbnail = function(productId) {
        var childRef = "products_images/" + productId + '/screenshot1';
        return FireFunc.onValue(childRef);
    };

    /**
     * products_images
     */
    self.getProductScreenshots = function(comercio,local) {
        var childRef = 'categorias/supermercados/comercios/' + comercio + '/locales/' + local + '/perfil/avatar';
        return FireFunc.onValue(childRef);
    };

    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------

    self.ProductsThumbnails = {};

    self.loadThumbnails = function(ProductsMeta) {
        angular.forEach(ProductsMeta, function(value, productId){
            self.getProductThumbnail(productId).then(
                function(ProductThumbnail){
                  if(ProductThumbnail != null) {
                    self.ProductsThumbnails[productId] = ProductThumbnail;
                  }
                },
                function(error){
                    console.log(error);
                }
            )
        })
    };


    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    /**
     * Retrieve Product Meta of Featured
     * @params:     subNode
     * ******* rewrite to include it in products_tags/featured
     */
    self.getFeaturedProductMeta = function(subNode) {
        var qFea = $q.defer();
        var childRef = "featured/" + subNode;
        FireFunc.onValue(childRef).then(function(ProductList){
          // --
          if(ProductList != null) {
              self.getProductMetaFromList(ProductList).then(
                  function(ProductsMeta){
                      qFea.resolve(ProductsMeta);
                  },
                  function(error){
                      qFea.reject(error);
                  }
              )
          } else {
              qFea.resolve(null);
          }
          // --
        },
        function(error){
          qFea.reject(error);
        })
        return qFea.promise;
    };

    // list
    self.getFeaturedList = function(subNode) {
        var qFea = $q.defer();
        var childRef = "featured/" + subNode;
        FireFunc.onValue(childRef).then(function(ProductList){
          // --
          if(ProductList != null) {
              qFea.resolve(ProductList);
          } else {
              qFea.resolve(null);
          }
          // --
        },
        function(error){
          qFea.reject(error);
        })
        return qFea.promise;
    };

    self.updateFeaturedList = function(subNode, Featuredlist) {
        var childRef = "featured/" + subNode;
        return FireFunc.set(childRef, FeaturedList);
    };

    //@key: productId
     // rewrite to function
    self.getProductMetaFromList = function(ProductsList) {
        var promises = {};
        angular.forEach(ProductsList, function(indexValues, productId) {
            if(productId != undefined && productId != null) {
                var promise = getProductMetaPromise(indexValues, productId)
                if(promise != null) {
                    promises[productId]=promise;
                }
            }
        })
        // how about just return self.getProductMeta(productId)?
        function getProductMetaPromise(indexValues, productId) {
            var qGet = $q.defer();

            // if no index values, then retrieve first
            if(indexValues == true || indexValues == undefined || indexValues == null) {
                self.getIndexValues(productId).then(
                    function(newIndexValues){
                        proceedGet(newIndexValues);
                    },
                    function(error){
                        console.log(error)
                       qGet.reject(error);
                    }
                )
            } else {
                proceedGet(indexValues);
            };

            function proceedGet(latestIndexValues) {
                self.getProductMeta(productId).then(
                    function(ProductMeta){
                        // --> resolve
                        if(ProductMeta != null) {
                            qGet.resolve({
                                meta: ProductMeta,
                                index: latestIndexValues
                            });
                        } else {
                            qGet.resolve(null);
                        }
                    },
                    function(error){
                        qGet.reject(error);
                    }
                )
            };
            return qGet.promise;
        };
        return $q.all(promises);
    };

    // Hacemos Submit al nuevo Comercio, lo agregamos a la base de datos
    self.submitProduct = function(ProductMeta, AuthData, comercio) {
        var database = firebase.database();
        var slug = ProductMeta.slug;
        var datos = ProductMeta.perfil;

        var funcion = firebase.database().ref('categorias/supermercados/comercios/' + comercio + '/locales/' + slug ).set({
            estadisticas: {
                            checks: 0,
                            visitas:0,
                        },
            perfil :    {   
                            email: datos.email || '',
                            nombre: datos.nombre || '',
                            numero_telefono: datos.numero_telefono || '',
                            direccion: datos.direccion || '',
                            pais: datos.pais || '',
                            ciudad: datos.ciudad || '',
                            descripcion: datos.descripcion || '',
                            horario:    {
                                            lunes:  {
                                                        desde: datos.horario.lunes.desde || '',
                                                        hasta: datos.horario.lunes.hasta || ''
                                                     },
                                            martes:  {
                                                        desde: datos.horario.martes.desde || '',
                                                        hasta: datos.horario.martes.hasta || ''
                                                     },
                                            miercoles:  {
                                                        desde: datos.horario.miercoles.desde || '',
                                                        hasta: datos.horario.miercoles.hasta || ''
                                                     },
                                            jueves:  {
                                                        desde: datos.horario.jueves.desde || '',
                                                        hasta: datos.horario.jueves.hasta || ''
                                                     },
                                            viernes:  {
                                                        desde: datos.horario.viernes.desde || '',
                                                        hasta: datos.horario.viernes.hasta || ''
                                                     },
                                            sabado:  {
                                                        desde: datos.horario.sabado.desde || '',
                                                        hasta: datos.horario.sabado.hasta || ''
                                                     },
                                            domingo:  {
                                                        desde: datos.horario.domingo.desde || '',
                                                        hasta: datos.horario.domingo.hasta || ''
                                                     },
                                        },
                            mapa:    {
                                                latitud: datos.mapa.latitud || '',
                                                longitud: datos.mapa.longitud || '',
                                            },
                            online: datos.online || '',
                            destacado: datos.destacado || '',
                        },
          });
        return funcion;
    };

    self.editProduct = function(ProductMeta, AuthData, comercio, productId, banner1, banner2, banner3) {
        var database = firebase.database();
        var slug = productId;
        console.log(productId);
        var datos = ProductMeta.perfil;

        var funcion = firebase.database().ref('categorias/supermercados/comercios/' + comercio + '/locales/' + slug ).update({
            perfil :    {   
                            banners_destacados:  {
                                            banner1: banner1 || '',
                                            banner2: banner2 || '',
                                            banner3: banner3 || '',
                                        },
                            email: datos.email || '',
                            nombre: datos.nombre || '',
                            numero_telefono: datos.numero_telefono || '',
                            direccion: datos.direccion || '',
                            pais: datos.pais || '',
                            ciudad: datos.ciudad || '',
                            descripcion: datos.descripcion || '',
                            horario:    {
                                            lunes:  {
                                                        desde: datos.horario.lunes.desde || '',
                                                        hasta: datos.horario.lunes.hasta || ''
                                                     },
                                            martes:  {
                                                        desde: datos.horario.martes.desde || '',
                                                        hasta: datos.horario.martes.hasta || ''
                                                     },
                                            miercoles:  {
                                                        desde: datos.horario.miercoles.desde || '',
                                                        hasta: datos.horario.miercoles.hasta || ''
                                                     },
                                            jueves:  {
                                                        desde: datos.horario.jueves.desde || '',
                                                        hasta: datos.horario.jueves.hasta || ''
                                                     },
                                            viernes:  {
                                                        desde: datos.horario.viernes.desde || '',
                                                        hasta: datos.horario.viernes.hasta || ''
                                                     },
                                            sabado:  {
                                                        desde: datos.horario.sabado.desde || '',
                                                        hasta: datos.horario.sabado.hasta || ''
                                                     },
                                            domingo:  {
                                                        desde: datos.horario.domingo.desde || '',
                                                        hasta: datos.horario.domingo.hasta || ''
                                                     },
                                        },
                            mapa:    {
                                                latitud: datos.mapa.latitud || '',
                                                longitud: datos.mapa.longitud || '',
                                            },
                            online: datos.online || '',
                            destacado: datos.destacado || '',
                        },
          });
        return funcion;
    };


    // Hacemos Submit a la promocion
    self.submitPromocion = function(PromocionMeta, AuthData, shopping, local) {
        var database = firebase.database();
        var datos = PromocionMeta;
        // Obtenemos el icono del comercio
        var childRef = "categorias/multimarcas/comercios/" + shopping +"/locales/"+local+"/perfil/icono";
        FireFunc.onValue(childRef).then(function(result){
          // --
          if(result != null) {
              var icono = result;
          } else {
              var icono = null;
          }
          // --
            // Notificamos al usuario en la bandeja de entrada
            if(PromocionMeta.notificaciones.mensajes == true ){
                console.log("Notificamos a los usuario que tienen como FAV");
                // Recorremos el array User
                UserService.getUsuarios().then(function(success){
                    console.log(success);
                    angular.forEach(success,function (detalle,key) {
                        if(detalle.hasOwnProperty(['favoritos'])){
                            if(detalle.favoritos.hasOwnProperty([local])){
                                console.log("El usuario "+ key + " le tiene como Fav");
                                // Obtenemos el avatar del comercio
                                // Procedemos a colocar en su bandeja de entrada
                                firebase.database().ref('users/'+ key + '/notificaciones').push().set({
                                    detalle: {
                                                    titulo : datos.texto.titulo || '',
                                                    descripcion: datos.texto.descripcion || '',
                                            },
                                    fechainicio:datos.fechainicio || '',
                                    fechafin:datos.fechafin || '',
                                    estado:'nueva',
                                    icono:icono,
                                }); 
                            }
                        }
                    });
                });
            }
        });
        
        var ref = firebase.database().ref('categorias/supermercados/comercios/' + shopping +'/locales/' + local );
        var id = ref.child('promociones');

        var funcion = id.push().set({
            texto: {
                            titulo : datos.texto.titulo || '',
                            descripcion: datos.texto.descripcion || '',
                    },
            fechainicio:datos.fechainicio || '',
            fechafin:datos.fechafin || '',
            categoria:datos.categoria || '',
          });
        return funcion;
    };


    // Hacemos Submit a la promocion Editada
    self.editPromocion = function(PromocionMeta, AuthData, shopping, local, promoId) {
        var datos = PromocionMeta;
        // Obtenemos el icono del comercio
        var childRef = "categorias/multimarcas/comercios/" + shopping +"/locales/"+local+"/perfil/icono";
        FireFunc.onValue(childRef).then(function(result){
          // --
          if(result != null) {
              var icono = result;
          } else {
              var icono = null;
          }
          // --
            // Notificamos al usuario en la bandeja de entrada
            if(PromocionMeta.notificaciones.mensajes == true ){
                console.log("Notificamos a los usuario que tienen como FAV");
                // Recorremos el array User
                UserService.getUsuarios().then(function(success){
                    console.log(success);
                    angular.forEach(success,function (detalle,key) {
                        if(detalle.hasOwnProperty(['favoritos'])){
                            if(detalle.favoritos.hasOwnProperty([local])){
                                console.log("El usuario "+ key + " le tiene como Fav");
                                // Obtenemos el avatar del comercio
                                // Procedemos a colocar en su bandeja de entrada
                                firebase.database().ref('users/'+ key + '/notificaciones').push().set({
                                    detalle: {
                                                    titulo : datos.texto.titulo || '',
                                                    descripcion: datos.texto.descripcion || '',
                                            },
                                    fechainicio:datos.fechainicio || '',
                                    fechafin:datos.fechafin || '',
                                    estado:'nueva',
                                    icono:icono,
                                }); 
                            }
                        }
                    });
                });
            }
        });

        var funcion = firebase.database().ref('categorias/supermercados/comercios/' + shopping +'/locales/' + local + '/promociones/' + promoId ).update({
            texto: {
                        titulo : datos.texto.titulo || '',
                        descripcion: datos.texto.descripcion || '',
                    },
            fechainicio:datos.fechainicio || '',
            fechafin:datos.fechafin || '',
            categoria:datos.categoria || '',
          });
        return funcion;
    };

    self.deleteProduct = function(productId, AuthData) {
        return ProductManagement.delete(productId, AuthData);
    };

    self.eliminarSucursal = function(supermercado, sucursal) {
        console.log(supermercado);
        return firebase.database().ref('categorias/supermercados/comercios/'+supermercado+'/locales/'+sucursal).remove();
    };

    self.eliminarPromocion = function(comercio, local, promocion) {
        return firebase.database().ref('categorias/supermercados/comercios/'+comercio+'/locales/'+local+'/promociones/'+ promocion).remove();
    };
    

    self.eliminarImagen = function(ruta,update) {
        console.log(ruta);
        console.log(update);
        switch (update) {
                    case 'banner1':
                        return firebase.database().ref(ruta).update({banner1:''});
                        break
                    case 'banner2':
                        return firebase.database().ref(ruta).update({banner2:''});
                        break
                    case 'banner3':
                        return firebase.database().ref(ruta).update({banner3:''});
                        break
        }
    };

    return self;
})

/*
    FIN SUPERMERCADOS
*/