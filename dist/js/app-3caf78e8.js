(function() {
    'use strict';

    angular
        .module('statement', [
            'ngNotify',
            'ui.bootstrap'
        ]);
})();

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

(function() {
    'use strict';

    angular
        .module('statement')
        .directive('mtcCalendar', mtcCalendar);

    mtcCalendar.$inject = ['$document'];
    /* @ngInject */
    function mtcCalendar($document) {

        var directive = {
            restrict: 'EA',
            templateUrl: 'app/calendar.html',
            replace: true,
            transclude: true,
            scope: {
                date: '=',
                originalDate: '=',
                format: '@'
            },
            controller: CalendarCtrl,
            controllerAs: 'vm',
            bindToController: true,
            link: link          
        };
        return directive;

        function link(scope, element, attr){
            element.bind('click', function(e) {
                e.stopPropagation();
            });

            $document.bind('click', function() {
                scope.vm.isOpen = false;
                scope.$apply();
            });
        }  
        ////////////////
    }

    CalendarCtrl.$inject = ['dateFormat', '$filter', '$scope'];

    /* @ngInject */
    function CalendarCtrl(dateFormat, $filter, $scope) {
        var vm = this;
        vm.isOpen = false;
        vm.next = next;
        vm.previous = previous;
        vm.select = select;
        vm.openCalendar = openCalendar;
        vm.weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

        Number.prototype.toMonthName = toMonthName;

        init();
        ///////////////////////////////

        function getWeekDay(date) {
            date = date || new Date();
            var days = {
                0: {
                    num: 1,
                    title: 'Воскресенье'
                }, 
                1: {
                    num: 7,
                    title: 'Понедельник'
                }, 
                2: {
                    num: 6,
                    title: 'Вторник'
                }, 
                3: {
                    num: 5,
                    title: 'Среда'
                }, 
                4: {
                    num: 4,
                    title: 'Четверг'
                }, 
                5: {
                    num: 3,
                    title: 'Пятница'
                }, 
                6: {
                    num: 2,
                    title: 'Суббота'
                }
            };
            var day = date.getDay();

            return days[day];
        }

        function daysInMonth(month,year) {
            return new Date(year, month, 0).getDate();
        }

        function init() {           
        }

        function getCalendar() {
            vm.daysInMonth = daysInMonth(vm.month + 1, vm.year);

            vm.prevDaysInMonth = daysInMonth(vm.month, 
                vm.month - 2 >= 0 ? vm.year : vm.year - 1);

            vm.weeks = [];

            var day = 1,
                prevMonthDay = vm.prevDaysInMonth,
                dayOfWeek = getWeekDay(new Date(vm.year, vm.month, 1)),
                weeksCount = Math.ceil(vm.daysInMonth/7),
                nextMonthDay = 1;

            for (var i = 1; i <= weeksCount; i++) {
                vm.weeks[i] = {};

                for (var j = 7; j > 0; j--) {
                    if(1 === i && 7 !== dayOfWeek.num && 0 < j - dayOfWeek.num) {
                        vm.weeks[i][7 - j] = {
                            day: prevMonthDay - (j - dayOfWeek.num - 1),
                            month: (vm.month - 1) > 0 ?
                                vm.month - 1 :
                                11,
                            year: (vm.month - 1) < 0 ?
                                vm.year - 1 :
                                vm.year
                        };
                    } else if(day <= vm.daysInMonth) {
                        vm.weeks[i][7 - j] = {
                            day: day,
                            month: vm.month,
                            year: vm.year
                        };
                        day++;
                    } else {
                        vm.weeks[i][7 - j] = {
                            day: nextMonthDay,
                            month: vm.month+1 < 12 ?
                                vm.month+1 :
                                0,
                            year: vm.month+1 < 12 ?
                                vm.year :
                                vm.year + 1
                        };
                        nextMonthDay++;
                    }
                }
            }
        }

        function next() {
            vm.month = vm.month+1 < 12 ?
                vm.month + 1 :
                0;

            vm.year = 0 === vm.month   ?
                vm.year + 1 :
                vm.year;

            vm.monthName = vm.month.toMonthName();

            getCalendar();
        }

        function previous() { 
            vm.month = 0 <= (vm.month - 1) ?
                vm.month - 1 :
                11;

            vm.year = 11 === vm.month  ?
                vm.year - 1 :
                vm.year;

            vm.monthName = vm.month.toMonthName();

            getCalendar();
        }

        function select(day) {
            vm.originalDate = new Date(day.year, day.month, day.day);
            vm.date = $filter('date')(new Date(day.year, day.month, day.day), vm.format);

            vm.isOpen = false;
        }

        function openCalendar() {
            vm.isOpen=!vm.isOpen;

            vm.day = vm.date ?
                    vm.originalDate.getDate() :
                    new Date().getDate();

            vm.year = vm.date ?
                    vm.originalDate.getFullYear() :
                    new Date().getFullYear();

            vm.month = vm.date ?
                vm.originalDate.getMonth() :
                new Date().getMonth();

            vm.selected = {
                day: vm.day,
                month: vm.month,
                year: vm.year
            };

            getCalendar();

            vm.monthName = vm.month.toMonthName(); 
        }

        function toMonthName() {
            var month = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

            /*jshint validthis:true */
            return month[this];
        }
    }
})();

angular.module("statement").run(["$templateCache", function($templateCache) {$templateCache.put("app/calendar.html","<div class=calendar-wrapper><div class=input-group ng-click=vm.openCalendar()><input type=text class=\"form-control calendar-wrapper__input\" readonly ng-model=vm.date value> <span class=input-group-addon><span class=\"glyphicon glyphicon-calendar calendar-wrapper__icon\"></span></span></div><div class=calendar-wrapper__calendar ng-if=vm.isOpen><div class=calendar-wrapper__header><i class=\"glyphicon glyphicon-chevron-left calendar-wrapper__left\" ng-click=vm.previous()></i> <span class=calendar-wrapper__month>{{vm.monthName}} {{vm.year}}</span> <i class=\"glyphicon glyphicon-chevron-right calendar-wrapper__right\" ng-click=vm.next()></i></div><div class=calendar-wrapper__week-days><span class=calendar-wrapper__week-day ng-repeat=\"day in vm.weekDays\">{{day}}</span></div><div class=calendar-wrapper__week ng-repeat=\"week in vm.weeks\"><span class=calendar-wrapper__day ng-class=\"{\'today\': day.isToday, \'different-month\': vm.month!==day.month, \'selected\': day.day===vm.selected.day && day.month===vm.selected.month && day.year===vm.selected.year}\" ng-click=vm.select(day) ng-repeat=\"day in week\">{{day.day}}</span></div></div></div>");}]);