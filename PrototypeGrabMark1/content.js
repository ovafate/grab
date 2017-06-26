// Unique ID for the className.
var MOUSE_VISITED_CLASSNAME = 'crx_mouse_visited';
var MOUSE_CLICKED_CLASSNAME = 'crx_mouse_clicked';

// Previous dom, that we want to track, so we can remove the previous styling.
var prevDOM = null;

var isPause = true;

// Mouse listener for any move event on the current document.
document.addEventListener('mousemove', function (e) {

	if (!isPause) {
		var srcElement = e.srcElement;
		
		// Lets check if our underlying element is a DIV.
		if (srcElement.nodeName == 'DIV') {
		
			// For NPE checking, we check safely. We need to remove the class name
			// Since we will be styling the new one after.
			if (prevDOM != null) {
				prevDOM.classList.remove(MOUSE_VISITED_CLASSNAME);
				prevDOM.classList.remove(MOUSE_CLICKED_CLASSNAME);
			}
			
			// Add a visited class name to the element. So we can style it.
			srcElement.classList.add(MOUSE_VISITED_CLASSNAME);
			
			// The current element is now the previous. So we can remove the class
			// during the next iteration.
			prevDOM = srcElement;
		}
	}	
}, true);


// message from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
/*
    console.log(sender.tab ?"from a content script:" + sender.tab.url :"from the extension");
    if (request.greeting == "hello")
    	sendResponse({farewell: "goodbye"});
*/

	// 새로운 분석 - 결과 리스트 초기화
	resultLists = [];
	
	// TODO : overlay icon 삭제

		
	isPause = request.pauseEvent;
	
	// TODO : 안내 메시지 노출
	
});


var resultLists = [];
var DEFINE_LINES = 10;

function analyzeDomByJ(dom) {
	
	$(dom).children().each(function(idx, val){
		
// 		console.log(val);
		console.log($(this));		
		
		
		
		
	});
	
	
}

// 리스트 패턴 분석
function analyzeContent(dom) {
	
	// 선택한 영역의 자식들		
	var children = dom.childNodes;
	
	var nodeType1List = [];
	var tables = [];
	
	// 태그 dom 으로 분리 > #text 제거
	for (var i = 0; i < children.length; i++){
		
		var each = children[i];

		if (each.nodeType === 1 
			&& each.hasChildNodes() 
/*
			&& each.nodeName != 'SCRIPT' 
			&& each.nodeName != 'OPTION'
*/
			) {
			
			if (each.nodeName != 'TABLE') {
				tables.push(each);
			} 
			
			nodeType1List.push(each);
			
		} 
	}
	
	// 리스트 구분
	var list = [];
	nodeType1List.forEach(function(each){
		
		var isList = false;
		
		// 연속된 n개 이상의 동일 타입의 노드를 구분
		if (list.length == 0) {
			
			list.push(each);
			
		} else {
			
			var lastone = list[list.length-1];
			
			if (lastone.nodeType == each.nodeType 
				&& lastone.className == each.className ) 
			{ 
				
				// 비 노출 제외
				if (each.style.display != 'none' || each.style.display != 'hidden') {
					
					list.push(each);				
					
					// 리스트의 끝 예외처리
					if (each == nodeType1List[nodeType1List.length-1] && list.length >= DEFINE_LINES) {
						
						isList = true;
						
					}
				}
				
			} else {
				
				// list 검사				
				if (list.length >= DEFINE_LINES) { 
					
					isList = true;
					
				} else {
					
					list = [each];
					
				}
				
			}		
		}
		
		// resultLists 에 추가
		if (isList) {
			
			var result = {
				parent : dom,
				list : list	
			};
			
			resultLists.push(result);
			
			list = [];
			isList = false;
		}
		
		analyzeContent(each);
		
	});	
}


document.addEventListener('mousedown', function (e) {
	
	if (!isPause) {
		console.log('====================== start of analyze ======================');
		
		
		analyzeContent(prevDOM);		
		
// 		analyzeDomByJ($(prevDOM));
			
		console.log('====================== end of analyze ======================');
		
		var i = 0;
		
		var allOverlays = [];
		resultLists.forEach(function(result){
			
			i++;
// 			console.log(result['parent']);
			
			var parent = result['parent'];
			
//			console.log(parent.parentNode);
//			console.log(parent);
//			console.log($(parent).index());
			
			var rect = parent.getBoundingClientRect();

			var overlay = document.createElement("div");
			overlay.className = 'grab overlay';
			
			var top = rect.top + window.scrollY;
			
			overlay.style.top = top + "px";
			overlay.style.left = rect.left + "px";
			overlay.style.background = '#000';
			
			var anc = '<h1 style="font-size: 3em; color: white; margin-left:15px;">'+i+'</h1>';
			overlay.innerHTML = anc;
			
			allOverlays.push(overlay);
			
			overlay.addEventListener('mouseover', function(e){
				e.stopPropagation();
				$(parent).addClass("crx_mouse_visited");
			});
			
			overlay.addEventListener('mouseout', function(e){
				e.stopPropagation();
				$(parent).removeClass("crx_mouse_visited");
			});
						
			// overlay icon 클릭 이벤트를 통해 grab 리스트 선택
			overlay.addEventListener('click', function(e) {
				e.stopPropagation();		
				$(parent).removeClass("crx_mouse_visited");
				
				// DOM 위치 분석
				var parent_info = analyzeParents(parent); 
				
				// TODO : check dom has no id !
				
// 				var cell_info = analyzeCell(result['list'][0]);
				
// 				console.log(JSON.stringify(parent_info));
				
				var parse_info = {
					"parent_info": parent_info, 
					"parent_tag": parent.nodeName,
					"cell": result['list'][0].innerHTML,
					"pager": {
						
					}
				};
				
				console.log(JSON.stringify(parse_info));
								

				allOverlays.forEach(function(eachOverlay){
					eachOverlay.remove();
				});
								
				// load lightbox frame								
				chrome.runtime.sendMessage({
					action: "load-lightbox"
				}, 
				function(html) {
						
					var background = document.createElement('div');
					background.id = "lightbox_background";
					
					var lightbox = document.createElement('div');
					lightbox.id = "lightbox_extension";
					lightbox.innerHTML = html;

					background.appendChild(lightbox);
					document.body.appendChild(background);
					
					document.getElementById('input_url').value = document.location.href;
										
					addAND = function() {
						document.getElementById('and').appendChild(getAndCell());
					};

					addNOT = function() {
						document.getElementById('not').appendChild(getNotCell());
					};
					
					getAndCell = function() {
						
						var div = document.createElement("DIV");
						div.className += "cell";
						
						var input = getNewAndInput(div);
								
						var or = document.createTextNode("or");
						
						div.appendChild(input);
						div.appendChild(or);
						
						return div;
					};
					
					getNotCell = function() {
						
						var div = document.createElement("DIV");
						div.className += "cell";
						
						var input = getNewNotInput(div);
								
						var and = document.createTextNode("and");
						
						div.appendChild(input);
						div.appendChild(and);
						
						return div;
					};
					
					
					getNewAndInput = function (parent) {
						
						var input = document.createElement("INPUT");
						input.size = 10;
						input.addEventListener('input', function(e){
							
							if (input.value !== '') {
								
								var hasEmptyInput = false;
								
								var inputs = parent.getElementsByTagName('INPUT')
								
								for(var i = 0; i < inputs.length; i++) {
									if (inputs[i].value == '') {
										hasEmptyInput = true;
									}
								}
													
								if (!hasEmptyInput) {
									parent.appendChild(getNewAndInput(parent));
									
									parent.appendChild(document.createTextNode("or"));
								}
								
							} else {
								input.nextSibling.remove();
								input.remove();
							}
							
						});
				
						return input;
					}

					getNewNotInput = function (parent) {
						
						var input = document.createElement("INPUT");
						input.size = 10;
						input.addEventListener('input', function(e){
							
							if (input.value !== '') {
								
								var hasEmptyInput = false;
								
								var inputs = parent.getElementsByTagName('INPUT')
								
								for(var i = 0; i < inputs.length; i++) {
									if (inputs[i].value == '') {
										hasEmptyInput = true;
									}
								}
													
								if (!hasEmptyInput) {
									parent.appendChild(getNewNotInput(parent));
									
									parent.appendChild(document.createTextNode("and"));
								}
								
							} else {
								input.nextSibling.remove();
								input.remove();
							}
							
						});
				
						return input;
					}

					var add = document.getElementById('add_and');
					add.onclick = addAND;

					
					// 초기화
					addAND();
					addNOT();


					// button event
					closeLightbox = function() {
						var lb = document.getElementById('lightbox_background');
						lb.parentNode.removeChild( lb );
					};
	
					confirmData = function() {
						
						var ANDs = [];
						
						var ANDcells = document.getElementById('and').getElementsByTagName("DIV");
						
						for(var i = 0; i < ANDcells.length; i++){
							
							var keys = ANDcells[i].getElementsByTagName("INPUT");
							var set = [];
							for (var j = 0; j < keys.length; j++) {
								if (keys[j].value !== '')
									set.push(keys[j].value);
							}
							
							if (set.length !== 0)
								ANDs.push(set);
						}
						
						console.log('ANDs ', JSON.stringify(ANDs));

						var NOTs = [];
						
						var NOTcells = document.getElementById('not').getElementsByTagName("DIV");
						
						for(var i = 0; i < NOTcells.length; i++){
							
							var keys = NOTcells[i].getElementsByTagName("INPUT");
							for (var j = 0; j < keys.length; j++) {
								if (keys[j].value !== '')
									NOTs.push(keys[j].value);
							}
							
						}
						
						console.log('NOTs ', JSON.stringify(NOTs));
						
						// content > background
						chrome.runtime.sendMessage({
							action: "area-selected", 
							data: { 
								"parse_info": parse_info,
								"keywords": {
									"ANDs" : ANDs,
									"NOTs" : NOTs
								}
							} 
						});	
						
						
					var lb = document.getElementById('lightbox_background');
						lb.parentNode.removeChild( lb );
					};
					
					var confirm = document.getElementById('confirm');
					confirm.onclick = confirmData;
					
					var cancel = document.getElementById('cancel');
					cancel.onclick = closeLightbox;
					
				});	
								
								
								
								
/*
				// light box
				var background = document.createElement('div');
				background.id = "lightbox_background";
				
				var lightbox = document.createElement('div');
				lightbox.id = "lightbox_extension";
				lightbox.innerHTML = '<h1>Hello, world.</h1>';
				
				closeLightbox = function() {
					var lb = document.getElementById('lightbox_background');
					lb.parentNode.removeChild( lb );
				};

				confirmData = function() {
					
					// content > background
					chrome.runtime.sendMessage({
						action: "area-selected", 
						data: { 
							"parse_info": parse_info
						} 
					});	
					
					
					var lb = document.getElementById('lightbox_background');
					lb.parentNode.removeChild( lb );
				};
				
				
				var confirm = document.createElement('button');
				confirm.onclick = confirmData;
				confirm.textContent='OK';
				lightbox.appendChild(confirm);				
				
				var cancel = document.createElement('button');
				cancel.onclick = closeLightbox;
				cancel.textContent='Close';
				lightbox.appendChild(cancel);				
				
				document.body.appendChild(background);
				background.appendChild( lightbox );				
*/
								
				
				
				// inner function
				function analyzeParents(parentNode) {
									
					var hasId = false;
					var hasClass = false;
					if (parentNode.id != '') {
						hasId = true;
					};
					
/*
					if (parentNode.className != '') {
						hasClass = true;
					};
*/
					
					var parentObj = null;
					
					if (parentNode.parentNode != undefined || parentNode.parentNode != null) {
												
						parentObj = {
							
							"hasId": hasId,
							"id": parentNode.id,
							"nodeName": parentNode.nodeName,
/*
							"hasClass": hasClass,
							"class": parentNode.className,
*/
							"indexOfParentNode": $(parentNode).index(),
							"parentNode": analyzeParents(parentNode.parentNode)
						};
					}
					
					return parentObj;
				}
				
				function analyzeCell(cell) {
					
					var structure = null;
					
					return structure;
				}
			});
			
			document.getElementsByTagName("body")[0].appendChild(overlay);			
			
			result['list'].forEach(function(eachResult) {
			
// 				console.log(eachResult.innerHTML.replace(/(<([^>]+)>)/gi, ""));
// 				console.log(eachResult);
				
			});			
		});
	}
		
		
	
	if (prevDOM != null) {
		prevDOM.classList.remove(MOUSE_VISITED_CLASSNAME);
		prevDOM.classList.remove(MOUSE_CLICKED_CLASSNAME);
	}
	
	isPause = true;
	
	

/*
  var srcElement = e.srcElement;

  // Lets check if our underlying element is a DIV.
  if (srcElement.nodeName == 'DIV') {

    // For NPE checking, we check safely. We need to remove the class name
    // Since we will be styling the new one after.
    if (prevDOM != null) {
      prevDOM.classList.remove(MOUSE_VISITED_CLASSNAME);
    }

    // Add a visited class name to the element. So we can style it.
    srcElement.classList.add(MOUSE_CLICKED_CLASSNAME);

    // The current element is now the previous. So we can remove the class
    // during the next iteration.
    prevDOM = srcElement;
    
    chrome.extension.sendRequest({message: "event-name", data: 'mousedown'});
  }
*/
	
}, true);
