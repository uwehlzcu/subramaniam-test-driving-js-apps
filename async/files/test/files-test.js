var expect = require('chai').expect;
var linesCount = require('../src/files');

describe('naively test server-side callback',
	function(){
		it('should return correct lines count for a valid file',
			function(){
				// Good try, but this will not actually work...
				var callback = function(count){
					// Negative line count: should be false!
					expect(count).to.be.eql(-2319);
				};

				linesCount('src/files.js', callback);
			});
});
	
