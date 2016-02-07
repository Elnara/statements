(function() {
    'use strict';

    angular
        .module('statement')
        .factory('dateFormat', dateFormat);

    /* @ngInject */
    function dateFormat() {

        var service = {
            getDate: getDate
        };
        return service;

        ////////////////

        function getDate(value) {
            if (!(value instanceof Date) || isNaN(value.valueOf())) {
                value = new Date(+value);
            } 
            var yyyy = value.getFullYear().toString();
            var mm = (value.getMonth() + 1).toString();
            var dd = value.getDate().toString();
            return yyyy + '-'+ (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]);
        }
    }
})();
