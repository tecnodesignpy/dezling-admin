angular.module('noodlio.controllers-settings-fees', [])


.controller('SettingsFeesCtrl', function($state, $anchorScroll, $location, Auth, Settings_Fees, Utils) {
    
    var settings        = this;
    settings.AuthData   = Auth.AuthData;
    
    settings.statusObj = {
        loading: true,
        newFee: "",
        newFeeValue: 0,
    };
    
    settings.SettingsFeesForm = {
        buyer: {},
        seller: {}
    };
    
    settings.initView = function() {
        $location.hash('page-top');
        $anchorScroll();
        
        load();
    };
    
    function load() {
        Settings_Fees.get().then(
            function(success){
                settings.statusObj['loading'] = false;
                if(Settings_Fees.all != null) {
                    settings.SettingsFeesForm = Settings_Fees.all;
                }
            },
            function(error){
                console.log(error);
                settings.statusObj['loading'] = false;
                settings.statusObj['generalmessage'] = "Something went wrong..."
            }
        );
    };
    
    settings.add = function() {
        var feeid = Utils.alphaNumeric(settings.statusObj.newFee);
        if(settings.statusObj.newFee) {
            settings.SettingsFeesForm['buyer'][feeid] = {
                title: settings.statusObj.newFee,
                value: settings.statusObj.newFeeValue,
            };
            set();
        }
    };
    
    settings.remove = function(key) {
        delete settings.SettingsFeesForm['buyer'][key];
        set();
    };
    
    settings.save = function() {
        set();
    };
    
    function set() {
        settings.statusObj['generalmessage'] = "Changing settings..."
        Settings_Fees.set(settings.SettingsFeesForm).then(
            function(success){
                settings.statusObj['generalmessage'] = "Success!";
            },
            function(error){
                settings.statusObj['generalmessage'] = "Something went wrong..."
                console.log(error);
            }
        )
    };
    
    
    settings.goTo = function(nextState) {
        $state.go(nextState)
    };
    

  
})