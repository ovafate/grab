var Background = (function (){
	
	var _this 		= {};
	var _userId = null;
			
	_this.init = function (){
				
	};
	
	_this.authenticate = function ( param ) {
		
		console.log('authenticate param : ' + JSON.stringify(param));
				
		$.post( "http://inbm002.cafe24.com:8085/scraper/api/user/authenticate" , { "item": param } ).done(function(data) {
			
			console.log('authenticate callback : ' + JSON.stringify(data));
			
			_userId = data['_id'];
			chrome.extension.sendRequest({message: "authenticate", data: data});
		});
	};

	_this.addGrab = function ( param ) {
		
		console.log('addGrab param : ' + JSON.stringify(param));
				
		$.post( "http://inbm002.cafe24.com:8085/scraper/api/grab/add" , { "item": param } ).done(function(data) {
			
			console.log('addGrab callback : ' + JSON.stringify(data));
			chrome.extension.sendRequest({message: "grab", data: data});
		});
	};

	_this.deleteGrab = function ( param ) {
		
		console.log('deleteGrab param : ' + JSON.stringify(param));
				
		$.post( "http://inbm002.cafe24.com:8085/scraper/api/grab/delete" , { "item": param } ).done(function(data) {
			
			console.log('deleteGrab callback : ' + JSON.stringify(data));
			chrome.extension.sendRequest({message: "grab", data: data});
		});
	};
	
	_this.getUserId = function() {
		return _userId;
	}
	
	return _this;
}());

window.addEventListener("load", function() { 
	
	Background.init(); 
	
	chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
		
		if (request.action === 'area-selected') {
			
			chrome.tabs.getSelected(null, function(tab) {
				
				var url = tab.url;
				var title = request.data['grab_title'];
				var tags = request.data['grab_tags'];
				var keywords = request.data['keywords'];
				
				var newGrab = {
					"url": url,
					"user_id": Background.getUserId(),
					"title": tab.title,
					"tags": tags,
					"keywords": keywords,
					"parse_info": request.data['parse_info'],
					"parent_tag": request.data['parent_tag']
				};
				
				console.log('newGrab ', JSON.stringify(newGrab));
				
				Background.addGrab(JSON.stringify(newGrab));
			});
		}
		
		if (request.action === 'load-lightbox') {
			
			$.ajax({
	            url: chrome.extension.getURL("/lightbox_v2.html"),
	            dataType: "html",
	            success: sendResponse
			});
			
			return true;
		}
		
	});
	
}, false);