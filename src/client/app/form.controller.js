(function() {
    'use strict';

    angular
        .module('statement')
        .controller('FormCtrl', FormCtrl);

    FormCtrl.$inject = ['ngNotify', '$scope', 'statementSrv'];

    /* @ngInject */
    function FormCtrl(ngNotify, $scope, statementSrv) {

        /*jshint validthis: true */
        var vm = this;
        vm.currentPage = 1;
        vm.itemsPerPage = 5;
        vm.maxSize = 5;
        vm.minDate = new Date();
        vm.remove = remove;
        vm.sent = sent;
        vm.submit = false;
        vm.sort = sort;
        vm.sortType = true;
        vm.statements = [];
        init();

        ////////////////

        function init() {   
        }

        function remove(key) {
            statementSrv.deleteElement(vm.statements, key);
        }

        function sent() {
            vm.submit = true;

            if($scope.appform.$error.required) {
                ngNotify.set(
                    "Пожалуйста, заполните все обязательные поля", 
                    {
                        type: 'error', position: 'top', duration: 5000
                    }
                );
            } else {
                vm.submit = false;
                vm.statements.push(vm.statement);
                vm.statement = {};
            }
        }

        function sort(type) {
            vm.sortType = !vm.sortType;

            if('date' === type) {
                vm.statements = statementSrv.sortingForDate(vm.statements, vm.sortType);
            }
        }
    }
})();
