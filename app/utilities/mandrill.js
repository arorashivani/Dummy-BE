'use strict';
var logger=require('../utilities/logger.js');

var mandrill = require('mandrill-api/mandrill');
var conf = require('../../config/initializers/loadConfig');
var config = conf.configuration;  //get all the configuration options
var key = config.MANDRILL_KEY;
var mandrillClient = new mandrill.Mandrill(key);
var templates = config.templates;

var mailSender = function(message, template, callback){
    
    var response = validate(message, template);
    
    if(response.code === false)
    {
        callback(response);
        return;
    }
    message = constructMessage(message);

    sendMail(message, template, callback);
};

function constructMessage(message) {
    var messageJson = {
        'html': message.htmlBody ? message.htmlBody : '',        
        'text': message.textBody ? message.textBody : '',        
        'subject': message.subject ? message.subject : '',
        'from_email': message.from ? message.from : '',      
        'from_name': message.fromname ? message.fromname : '',   
        'to': [{
            'email': message.to,     
            'name': message.toName,  
            'type': 'to'
        }],
        'headers': {
            'Reply-To': message.replyTo ? message.replyTo : ''  
        },
        'important': message.importantFlag || false, 
        'track_opens': null,
        'track_clicks': null,
        'auto_text': null,
        'auto_html': null,
        'inline_css': null,
        'url_strip_qs': null,
        'preserve_recipients': null,
        'view_content_link': null,
        'bcc_address': message.bcc || null, 
        'tracking_domain': null,
        'signing_domain': null,
        'return_path_domain': null,
        'merge': true,
        'merge_language': 'handlebars',
        'global_merge_vars': [{
            'name': 'alink',
            'content': message.alink ? message.alink : ''
        },
        {
            'name': 'link',
            'content': message.link ? message.link : ''
        },
        {
            'name': 'username',
            'content': message.toName
        },
        {
            'name': 'reqDetails',
            'content': message.reqDetails ? new Array( message.reqDetails) : []
        },
        {
            'name': 'unsubscribeLink',
            'content': message.unsubscribeLink || ''
        }],
       
        'tags': [
           'password-resets'
        ],
       
        'google_analytics_domains': [
            'launch-sandbox.com'
        ],
        'google_analytics_campaign': 'message.from_email@example.com',
        'metadata': {
            'website': 'www.launch-sandbox.com'
        }

    };
    return messageJson;
}
function sendMail(message, template, callback){
    var async = false;
    var ipPool = 'Main Pool';
    var sendAt = new Date();
    
    var templateContent = '';
    if(template) {

        var templateName = templates[template];

        mandrillClient.messages.sendTemplate({'template_name': templateName,
            'template_content': templateContent, 'message': message, 
            'async': async, 'ip_pool': ipPool, 'send_at': sendAt},function(result) {
            logger.debug(result);
            callback(false);
        }, function(e) {
            // Mandrill returns the error as an object with name and message keys
            logger.debug('A mandrill error occurred: ' + e.name + ' - ' + e.message);
            callback(e);
        });
    }else{
        mandrillClient.messages.send({'message': message, 'async': async, 
            'ip_pool': ipPool, 'send_at': sendAt}, function(result) {
            logger.debug(result);
            callback(false);
        }, function(e) {
            // Mandrill returns the error as an object with name and message keys
            logger.debug('A mandrill error occurred: ' + e.name + ' - ' + e.message);
           callback(e);
    });
  }
}
function validate(message,template) {
    var response = {};
    response.code = false;
    response.name = '';
    response.message = '';
    if (!message.to || !message.toName) {
        response.name = 'error';
        response.message = 'to field or name of recepient is missing';
        return response;
    }
    if(!template && !message.htmlBody)
    {
        response.name = 'error';
        response.message = 'message body can not be empty when template is not defined';
        return response;   
    }
    if(template){
        //var templatesMap = templates;
        /*{
            'registration': 'registration-tpl',
            'forgotPassword': 'forgotpassword-tpl',
            'forgotSecurity': 'forgotsecurity-tpl',
            'testtemplate': 'testtemplate'
        };
        */
        var templatesArray = [];
        for ( key in templates)
        {
            templatesArray.push(key);   
        }
        if (templatesArray.indexOf(template) === -1) {
            response.name = 'error';
            response.message = 'template name is not known, please modify template name';
            return response;
        } else {
            response.code = true;
            return response;
       } 
    
    }
}

module.exports = mailSender;
