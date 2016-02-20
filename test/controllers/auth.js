/**
 * Created by Alexey Karasev on 20/02/16.
 */

var assert = require('assert');
var mongoose = require('mongoose');
require('../../app');



describe('Array', function() {
    describe('#indexOf()', function () {
        it('should return -1 when the value is not present', function () {
            assert.equal(-1, [1,2,3].indexOf(5));
            assert.equal(-1, [1,2,3].indexOf(0));
        });
    });
});
