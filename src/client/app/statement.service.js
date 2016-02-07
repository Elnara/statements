(function() {
    'use strict';

    angular
        .module('statement')
        .factory('statementSrv', statementSrv);

    /* @ngInject */
    function statementSrv() {

        var service = {
            deleteElement: deleteElement,
            sortingForDate: sortingForDate
        };
        return service;

        ////////////////

        function deleteElement(arr, key) {
            arr.splice(key, 1);
        }

        function sortingForDate(arr, sortType) {
            return arr.sort(function(a,b){
                if(sortType) {
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                } else {
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
                }
            });
        }
    }
})();
