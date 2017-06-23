var MongoClient = require('mongodb').MongoClient;

module.exports = {
	connection: null,

	connect: function(dbname, callback){
		var self = this;

		var cacheConnection = function doCacheConnection(err, db){
			var sWho = "doCacheconnection";
			//console.log(sWho + "(): err = ", err );
			//console.log(sWho + "(): db = ", db );
			self.connection = db;
			callback(null);
		};

		MongoClient.connect(dbname, cacheConnection);
	},

	get: function(){
		return this.connection;
	},

	close: function(){
		if( this.connection ){
			this.connection.close();
			this.connection = null;
		}
	},
};
