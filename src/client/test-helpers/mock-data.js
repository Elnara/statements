/* jshint -W079 */
var mockData = (function() {
    return {
        getMockCreateUser: getMockCreateUser,
        getMockUserParams: getMockUserParams
    };

    function getMockCreateUser() {
        return [
            {xtoken: 'seferfergter4344234rwefgerf', status: 'ok'}
        ];
    }

    function getMockUserParams() {
        var user = {
            name: 'testname', 
            email: 'test@test.ru', 
            password: '1'
        };

        return user;
    }    
})();