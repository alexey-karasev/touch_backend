/**
 * Created by Alexey Karasev on 20/02/16.
 */


var app = require('../../app');
var request = require('supertest')(app);
var assert = require('chai').assert;
var mongoose = require('mongoose');
var User = mongoose.model('User');

describe('auth', function () {
    beforeEach(function (done) {
        mongoose.connection.db.dropCollection('users', function(err, result) {});
        //mongoose.connection.db.dropDatabase();
        User.remove({}, function (err, res) {
            done()
        });
    });

    describe('/register', function () {
        it('stores user credentials and password in db and issues a token back', function (done) {
            request
                .post('/register')
                .send({
                    email: 'nyasha@gmail.com',
                    name: 'lampovaya nyasha',
                    login: 'nyasha',
                    phone: '+71',
                    password: 'nya'
                })
                .end(function(err,res){
                    assert.isNull(err);
                    assert(res.status, 200);
                    done();
                })
        })
    })

})

describe('Array', function () {
    describe('#indexOf()', function () {
        it('should return -1 when the value is not present', function () {
            assert.equal(-1, [1, 2, 3].indexOf(5));
            assert.equal(-1, [1, 2, 3].indexOf(0));
        });
    });
});
