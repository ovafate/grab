// popup class
var Popup = (function (){
	
	var _this 		= {};
	var	_background	= null;
	var _userId = null;
	
	_this.init = function (){
		
		console.log('init');
		
		_background = chrome.extension.getBackgroundPage().Background;
		
		// API callback receiver
		chrome.extension.onRequest.addListener(function(request) {
			
			if (!request.message) {
				
				// TODO : error
				
			} else {
				
				var message = request.message;
				var data = request.data;
				
				console.log(request.message);
				console.log(JSON.stringify(request.data));
				
				if (message === 'authenticate') {
					
					// check code
					if (data['code'] == 200) {
						
						$('.login').hide();
						$('.lists').show();
						_userId = data['_id'];
						setContent(data['user_grabs']);
						document.getElementById("user").innerText = data['id_str'] + '\'s GRAB';
						
					}
					
					// 600 popup
					if (data['code'] == 600) {
						
						document.getElementById('input_password').value = "";
						document.getElementById('input_password').setAttribute("placeholder", "암호 오류");
												
					}
					
					
				} else if (message === 'grab') { // add, delete, update callback - refresh
					
					setContent(data['user_grabs']);
					
				} else if (message === 'action') {
					
					console.log('action');
					
				} 
	        }			
		});
	};
	
	_this.authenticate = function(user) {
		
		console.log('authenticate with : ' + user);
		
		_background.authenticate(JSON.stringify(user));
	};
	
	_this.setUserId = function(userId) {
		_userId = userId;
	};
	
	_this.addGrab = function() {
		
		chrome.tabs.getSelected(null, function(tab) {
			
			var tablink = tab.url;
			
			var newGrab = {
				"url": tablink,
				"user_id": _userId,
				"title": "USER_TITLE",
				"tags":["USER_TAG1", "USER_TAG2"],
				"howToParse": "how to parse"
			};
			
			_background.addGrab(JSON.stringify(newGrab));
		});
	};
		
	function setContent(content) {
		
		console.log(content);
		
		var ul = document.getElementById("ul");
		ul.innerHTML = ''; // clear all
		
		var newButton = document.getElementById("new");
		newButton.style.display = "block";

		if (content.length === 0) {
			
			var li = document.createElement("li");
			li.setAttribute("class", "grab_cell");

			var cell_color = document.createElement("div");	
			cell_color.setAttribute("class", "cell_color");
				
			var grab_info = document.createElement("div");		
			grab_info.setAttribute("class", "grab_info");
			
			var title =  document.createElement("h4");
			title.setAttribute("class", "no_data");
			title.innerText = "데이터가 없습니다.";
			
			grab_info.appendChild(title);
			
			li.appendChild(cell_color);
			li.appendChild(grab_info);
			
			var ul = document.getElementById("ul");
			ul.appendChild(li);
			
		} else {
			
			content.forEach(function(each) {
				
// 				console.log(each);
				
				var li = document.createElement("li");
				li.setAttribute("class", "grab_cell");
				li.setAttribute("id", each['_id']); // added line
				
				var cell_color = document.createElement("div");	
				cell_color.setAttribute("class", "cell_color");
					
				var grab_info = document.createElement("div");		
				grab_info.setAttribute("class", "grab_info");
				
				var title =  document.createElement("h4");
				title.innerText = each['title'];
				
				var tags =  document.createElement("p");
				tags.innerText = JSON.stringify(each['alarms']);

				grab_info.appendChild(title);
				grab_info.appendChild(tags);
				
				li.appendChild(cell_color);
				li.appendChild(grab_info);
				
				
				li.addEventListener("click", function(e) {
// 					console.log(li.getAttribute("id"));
					
					var selectedGrab = {
						"user_id": _userId,
						"grab_id": li.getAttribute("id")
					};
					
					_background.deleteGrab(JSON.stringify(selectedGrab));
				});
				
				ul.appendChild(li);
			});
		}
	}
	
	return _this;
}());

var DOMAIN = "http://www.inbm.com";
var COOKIE_NAME = "info";

// init event
document.addEventListener('DOMContentLoaded', function() {

	console.log('DOMContentLoaded');
	
	new Popup.init(); 

	// TODO : check cookie 
	chrome.cookies.get({"url": DOMAIN, "name": COOKIE_NAME}, function(cookie) {
		
		console.log('cookie', cookie);
		
		if (cookie == null) {
			
			// show login
			$('.lists').hide();
			$('.login').show();
				
		} else {
			
			// show user grab
			$('.lists').show();
			$('.login').hide();
			
		    Popup.authenticate(JSON.parse(cookie.value));
			
		}
		
    });
    

	
    // message from iframe - login page callback
/* 시연용 임시 제거
    window.addEventListener('message', function(request) {
	    	    
	    var message = request.data.message;
	    
	    console.log('message : ' + message);
	    
	    if (message === 'not_connected') {
		    		    
	    } else if (message === 'login') {
		    
		    var id = request.data.id;
		    Popup.authenticate('facebook', id);
		    
		    var user = document.getElementById("user").innerText = request.data.name + '\'s GRAB';
	    }
	    
	}, false);
*/

	document.getElementById('new').addEventListener('click', function() {
		
		window.close();

		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			
			// message to content
			chrome.tabs.sendMessage(tabs[0].id, { pauseEvent: false });
		});
		
    });	

	document.getElementById('confirm').addEventListener('click', function() {
		
		var id = document.getElementById('input_id').value;
		var password = document.getElementById('input_password').value;		
		var sns_id = "";
		var login_from = "inbm";
		
		if (id == "") {
			
			document.getElementById('input_id').value = "";
			document.getElementById('input_id').setAttribute("placeholder", "id를 입력하세요.");

			return;
		}
		
		if (password == "") {
			
			document.getElementById('input_password').value = "";
			document.getElementById('input_password').setAttribute("placeholder", "password를 입력하세요.");
			
			return;
		}
		
		var value = {
		    "id_str":id,
		    "sns_id": sns_id,
			"password": password,
			"login_from": login_from
		};
		
		chrome.cookies.set({
			"name": COOKIE_NAME,
		    "url": DOMAIN,
		    "value": JSON.stringify(value)
		}, function (cookie) {
			
		    Popup.authenticate(value);
			
		});		
		
    });	
    
	document.getElementById('logout').addEventListener('click', function() {
		
		window.close();
		
		chrome.cookies.remove({"url": DOMAIN, "name": COOKIE_NAME}, function(deleted_cookie) {
			
		});		
    });	
    

});

