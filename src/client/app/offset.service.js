(function() {
    'use strict';

    angular
        .module('statement')
        .filter('offset', offset);

    /* @ngInject */
    function offset() {
        return function(input, start) {
            start = parseInt(start, 10);
            return input.slice(start);
        };
    }    
})();
