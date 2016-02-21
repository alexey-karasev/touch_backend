/**
 * Created by Alexey Karasev on 21/02/16.
 */

var env = require('../env');

function Sms() {

}

Sms.prototype.send = function(phone, text, done) {
    switch (env.name) {
        case 'development':
        case 'test':
            console.log('Sent sms ' + text + ' to phone ' + phone);
            done();
            break;
        case 'production':
            done();
            break;
        case 'staging':
            done();
            break;
    }
};

module.exports = new Sms();
