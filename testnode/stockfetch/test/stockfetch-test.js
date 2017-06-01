var expect = require('chai').expect;
var sinon = require('sinon');
var fs = require('fs');
var Stockfetch = require('../src/stockfetch');

describe('Stockfetch tests', function(){

	var stockfetch;
	var sandbox;

	beforeEach(function(){
		stockfetch = new Stockfetch();
		sandbox = sinon.sandbox.create();
	});

	afterEach(function(){
		sandbox.restore();
	});

	it('should pass this canary test',
		function(){
			expect(true).to.be.true;		
	});

	// Error Handler Test
	it('readTickersFile() should invoke error handler for invalid file',
		function invalidFileTest(done){

			var onError = function(err){
				expect(err).to.be.eql('Error reading file: InvalidFile.txt');
				done();
			};
		
			// Since reading a file is brittle operation,
			// stub out fs::readFile() function to send
			// an error to its callback. 
			// (Stubs are not real implementations, but may
			//  readily return canned responses when called.)
			sandbox.stub(fs, 'readFile',
				function(fileName, callback){
					callback(new Error('failed'));
			});

			stockfetch.readTickersFile('InvalidFile.txt', onError);
	});

	it('readTickersFile() should invoke processTickers() for valid file',
		function(done){
			/* Implement the readTickersFile() function in a way it uses
			* the parseTickers() and processTickers() functions
			* but without actually implementing those functions.
			*/
			var rawData = 
				'GOOG' + '\n' +
				'AAPL' + '\n' + 
				'ORCL' + '\n' + 
				'MSFT';

			var parsedData = ['GOOG', 'AAPL', 'ORCL', 'MSFT'];

			// Stub out stockfetch::parseTickers() to expect
			// the canned 'rawData' and, if and when it does receive
			// the canned 'rawData' as its argument, 
			// return the parsedData -- array of ticker symbols
			// as canned data.
			sandbox.stub(stockfetch, 'parseTickers')
				.withArgs(rawData).returns(parsedData);

			// Assert that the parameter received is
			// equal to the canned data that was
			// returned by the parseTickers() stub.
			sandbox.stub(stockfetch, 'processTickers',
				function(data){
					expect(data).to.be.eql(parsedData);
					// Signal completion of asynchronous callback...
					done();
				}
			);

			// Stub out fs::readFile() so it always
			// returns the canned rawData to the callback.
			sandbox.stub(fs, 'readFile', 
				function(fileName, callback){
					callback(null, rawData);
				}
			);

			// Happy path, so don't need to send
			// second argument, the onError callback...
			stockfetch.readTickersFile('tickers.txt');

	});

	it('readTickersFile() should return error if the given file is empty',
	function(done){

		// This test documents our design decision...if parseTickers()
		// returns no ticker symbols, then readTickerFile will
		// report an error.

		var onError = function(err){				
			expect(err).to.be.eql('File tickers.txt has invalid content');
			done();
		};

		// stockfetch::parseTickers() stub returns empty array
		// if input is an empty string...which documents
		// our design decition for parseTickers()...
		sandbox.stub(stockfetch, 'parseTickers').withArgs('').returns([]);

		// fs::readFile() stub simulate readFile reading an empty file...
		sandbox.stub(fs, 'readFile', function(fileName, callback){
			callback(null, '');
		});

		stockfetch.readTickersFile('tickers.txt', onError);

	});

	it('parseTickers() receives an end-of-line delimited string and returns a list of tickers',
      function positiveTestForParseTickers(){			

			var rawData = 
				'GOOG' + '\n' +
				'AAPL' + '\n' + 
				'ORCL' + '\n' + 
				'MSFT';

			var parsedData = ['GOOG', 'AAPL', 'ORCL', 'MSFT'];

			// Synchronous function with no dependencies = easy-peasy...
			expect(stockfetch.parseTickers(	rawData )).to.eql(parsedData);
	});

	it('parseTickers() returns an empty array if content is empty',
      function positiveTestForParseTickers(){			

			// Synchronous function with no dependencies = easy-peasy...
			expect(stockfetch.parseTickers(	"" )).to.be.eql([]);
	});

	it('parseTickers() returns an empty array if content is empty',
      function negativeTestForParseTickers(){			
			expect(stockfetch.parseTickers(	"" )).to.be.eql([]);
	});

	it('parseTickers() returns an empty array upon receiving white-space-only content',
      function negativeTestForParseTickers(){			
			expect(stockfetch.parseTickers(	" \n " )).to.be.eql([]);
	});

	it('parseTickers() handles content with unexpected format',
      function(){			
			var rawData = "AAPL   \n" + // reject due to extraneous whitespace
					  "Blah\n" + // reject because not ALL-CAPS...
					  "GOOG\n\n";

			expect(stockfetch.parseTickers(	rawData )).to.be.eql([ 'GOOG' ]);
	});

	it('processTickers() should call getPrice() for each ticker symbol',
	function (){
		// Interaction tests...

		// We mock stockfetch::getPrice() with expectation
		// that it will be called thrice, with arguments
		// 'MSFT', 'DIS', and 'IBM'...
		var stockFetchMock = sandbox.mock(stockfetch);
		stockFetchMock.expects('getPrice').withArgs('MSFT');
		stockFetchMock.expects('getPrice').withArgs('DIS');
		stockFetchMock.expects('getPrice').withArgs('IBM');

		// ...then verify processTickers() interacts with
		// getPrice() as expected...
		stockfetch.processTickers(['MSFT', 'DIS', 'IBM']);
		stockFetchMock.verify();
	});

	it('processTickers() should save tickers count',
		function(){
			// Using a return-nothing-in-particular
			// cardboard cutout stub for
			// sandbox::getPrice()...
			sandbox.stub(stockfetch, 'getPrice');		

			stockfetch.processTickers(['MSFT', 'DIS', 'IBM']);

			expect(stockfetch.tickersCount).to.be.eql(3);
	});

});
