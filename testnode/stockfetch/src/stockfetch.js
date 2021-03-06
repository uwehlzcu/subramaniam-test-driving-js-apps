var fs = require('fs');
var http = require('http');

var Stockfetch = function(){

	this.tickersCount = 0;

	this.http = http;

    // Populate this.price like a "hashtable":
	// { 'GOOG': 127.72, 'IBM': 146.33 }
	this.prices = {}; 

    // Populate this.error like so: { "GOOG": "D'oh!" }
	this.errors = {}; 

};

Stockfetch.prototype.readTickersFile = function(filename, onError){

	var self = this;

	var processResponse = 
		function(err, data){
			var sWho = "Stockfetch.readTickersFile.processReponse";
			if(err){	
				onError('Error reading file: ' + filename);
			}
			else{
				var tickers = self.parseTickers(data.toString()); 
				if( tickers.length == 0 ){ 
					var sMsg = `File ${filename} has invalid content`;
					console.log(sWho + "(): ERROR: \"" + sMsg + "\"..."); 
					onError( sMsg );
				}
				else {
					self.processTickers(tickers);
				}
			}
	};

	fs.readFile(filename, processResponse);

}; /* readTickersFile() */
 

Stockfetch.prototype.parseTickers = function(rawData){

	var isInRightFormat = function(str){
		return str.trim().length !== 0
			&& str.indexOf(' ') < 0
			&& str.toUpperCase() == str
	};

	return rawData.split('\n').filter(isInRightFormat);

}; /* parseTickers() */
 

Stockfetch.prototype.processTickers = function(tickersArray){

	var self = this;	

	self.tickersCount = tickersArray.length;

	tickersArray.forEach(function(ticker){
		self.getPrice(ticker);	
	});

};

Stockfetch.prototype.getPrice = function(symbol)
{
	var url = 'http://johndavidaynedjian.com/finance/' + symbol + '.csv';

	self = this;

	console.log("Stockfetch::getPrice(): Doin' HTTP GET of url = \"" + url + "\"...");

	self.http.get(
		url,
		// Return bind() of context object and argument to this.processResponse()...
		self.processResponse.bind(self, symbol)
	)
	.on('error', self.processHttpError.bind(self, symbol));
	

}; /* getPrice() */

Stockfetch.prototype.processResponse = function(symbol, response){
	var self = this;

	if( response.statusCode === 200 ){
		var data = '';

		response.on('data', function(chunk){ data += chunk; });

		response.on('end', function(){ self.parsePrice(symbol, data); });
	}
	else {
		
		self.processError( symbol, response.statusCode );
		
	}

};

// e.g., data = "close,day-range\n" +
//				"625.77002,625.67000-625.77002";
Stockfetch.prototype.parsePrice = function(symbol, data){

	var a_lines = data.split("\n");

	if( a_lines.length >= 2 ){
		var a_fields = a_lines[1].split(",");
		if( a_fields.length >= 1 ){
			var le_price = a_fields[0].trim();
			this.prices[symbol] = le_price;
		}
	}

	this.printReport();

}; /* parsePrice() */





// Delegates report printing to user-supplied reportCallback()... 
Stockfetch.prototype.printReport = function(){

	// Only call reportCallback() if all the responses have arrived...
	if(
		this.tickersCount === 
			Object.keys(this.prices).length + Object.keys(this.errors).length
	){
		//this.reportCallback(this.toArray(this.prices), this.toArray(this.errors));
		this.reportCallback(this.sortData(this.prices), this.sortData(this.errors));
	}
}; /* printReport() */


Stockfetch.prototype.sortData = function(dataToSort){

	// Converts single-key of dataToSort to
	// an array [key, dataToSort[key]]
	var singleKeyToArray = function(key){ 
		return [key, dataToSort[key]];
	};
	return Object.keys(dataToSort).sort().map(singleKeyToArray);
};

// Should be replaced with user-supplied reportCallback()...
// ...but this do-nothing callback will prevent any mishaps...
Stockfetch.prototype.reportCallback = function reportCallback(){
	//var sWho = "reportCallback";
	//console.log(sWho + "(): You should replace this with your own Stockfetch.prototype.reportCallback()...\n");
};

Stockfetch.prototype.processError = function(symbol, message){
	this.errors[symbol] = message;

	this.printReport();
};

Stockfetch.prototype.processHttpError = function(ticker, error){
	this.processError(ticker, error.code );
};

Stockfetch.prototype.getPriceForTickers = function(fileName, displayFn, errorFn){
	this.reportCallback = displayFn;
	this.readTickersFile(fileName, errorFn);
};

// ES6
//class Stockfetch {
//	readTickersFile(filename, onError){
//		// For now, just toss the error to pass the error test...
//		onError('Error reading file: ' + filename );
//	}
//}

module.exports = Stockfetch;
