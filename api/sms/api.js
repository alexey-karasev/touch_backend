/**
 * Created by Alexey Karasev on 21/02/16.
 */

var env = require('../env');

function Sms() {

}

Sms.prototype.send = function(phone, text) {
    switch (env.name) {
        case 'development':
        case 'test':
            console.log('Sent sms ' + text + ' to phone ' + phone);
            break;
        case 'production':
            break;
        case 'staging':
            break;
    }
};

module.exports = new Sms();
