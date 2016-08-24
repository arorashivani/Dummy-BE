var winston=require('winston');

var logger = new (winston.Logger)({
	transports: [
		//new (winston.transports.Console)({timestamp:true}),
		new (winston.transports.File)({filename: 'logs/logfile.log',timestamp:true})
	]
});


module.exports={
	info:function(value)
	{
		'use strict';  
		logger.info(value);
	},
	error:function(value)
	{
		'use strict';   
		logger.error(value);
	}, 
	debug:function(value){
		'use strict';   
		logger.debug(value);
	}
};
