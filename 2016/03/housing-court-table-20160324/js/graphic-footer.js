;(function(){function Tablesort(el,options){if(!(this instanceof Tablesort))return new Tablesort(el,options);if(!el||el.tagName!=='TABLE')throw new Error('Element must be a table');this.init(el,options||{});}var sortOptions=[];var createEvent=function(name){var evt;if(!window.CustomEvent||typeof window.CustomEvent!=='function'){evt=document.createEvent('CustomEvent');evt.initCustomEvent(name,false,false,undefined);}else evt=new CustomEvent(name);return evt;};var getInnerText=function(el){return el.getAttribute('data-sort')||el.textContent||el.innerText||'';};var caseInsensitiveSort=function(a,b){a=a.toLowerCase();b=b.toLowerCase();if(a===b)return 0;if(a<b)return 1;return -1;};var stabilize=function(sort,antiStabilize){return function(a,b){var unstableResult=sort(a.td,b.td);if(unstableResult===0){if(antiStabilize)return b.index-a.index;return a.index-b.index;}return unstableResult;};};Tablesort.extend=function(name,pattern,sort){if(typeof pattern!=='function'||typeof sort!=='function')throw new Error('Pattern and sort must be a function');sortOptions.push({name:name,pattern:pattern,sort:sort});};Tablesort.prototype={init:function(el,options){var that=this,firstRow,defaultSort,i,cell;that.table=el;that.thead=false;that.options=options;if(el.rows&&el.rows.length>0)if(el.tHead&&el.tHead.rows.length>0){firstRow=el.tHead.rows[el.tHead.rows.length-1];that.thead=true;}else firstRow=el.rows[0];if(!firstRow)return;var onClick=function(){if(that.current&&that.current!==this){that.current.classList.remove('sort-up');that.current.classList.remove('sort-down');}that.current=this;that.sortTable(this);};for(i=0;i<firstRow.cells.length;i++){cell=firstRow.cells[i];if(!cell.classList.contains('no-sort')){cell.classList.add('sort-header');cell.tabindex=0;cell.addEventListener('click',onClick,false);if(cell.classList.contains('sort-default'))defaultSort=cell;}}if(defaultSort){that.current=defaultSort;that.sortTable(defaultSort);}},sortTable:function(header,update){var that=this,column=header.cellIndex,sortFunction=caseInsensitiveSort,item='',items=[],i=that.thead?0:1,sortDir,sortMethod=header.getAttribute('data-sort-method');that.table.dispatchEvent(createEvent('beforeSort'));if(update)sortDir=header.classList.contains('sort-up')?'sort-up':'sort-down';else{if(header.classList.contains('sort-up'))sortDir='sort-down';else if(header.classList.contains('sort-down'))sortDir='sort-up';else sortDir=that.options.descending?'sort-up':'sort-down';header.classList.remove(sortDir==='sort-down'?'sort-up':'sort-down');header.classList.add(sortDir);}if(that.table.rows.length<2)return;if(!sortMethod){while(items.length<3&&i<that.table.tBodies[0].rows.length){item=getInnerText(that.table.tBodies[0].rows[i].cells[column]);item=item.trim();if(item.length>0)items.push(item);i++;}if(!items)return;}for(i=0;i<sortOptions.length;i++){item=sortOptions[i];if(sortMethod){if(item.name===sortMethod){sortFunction=item.sort;break;}}else if(items.every(item.pattern)){sortFunction=item.sort;break;}}that.col=column;var newRows=[],noSorts={},j,totalRows=0,noSortsSoFar=0;for(i=0;i<that.table.tBodies.length;i++)for(j=0;j<that.table.tBodies[i].rows.length;j++){item=that.table.tBodies[i].rows[j];if(item.classList.contains('no-sort'))noSorts[totalRows]=item;else newRows.push({tr:item,td:getInnerText(item.cells[that.col]),index:totalRows});totalRows++;}if(sortDir==='sort-down'){newRows.sort(stabilize(sortFunction,true));newRows.reverse();}else newRows.sort(stabilize(sortFunction,false));for(i=0;i<totalRows;i++){if(noSorts[i]){item=noSorts[i];noSortsSoFar++;}else item=newRows[i-noSortsSoFar].tr;that.table.tBodies[0].appendChild(item);}that.table.dispatchEvent(createEvent('afterSort'));},refresh:function(){if(this.current!==undefined)this.sortTable(this.current,true);}};if(typeof module!=='undefined'&&module.exports)module.exports=Tablesort;else window.Tablesort=Tablesort;})();
(function(){var cleanNumber=function(i){return i.replace(/[^\-?0-9.]/g,'');},compareNumber=function(a,b){a=parseFloat(a);b=parseFloat(b);a=isNaN(a)?0:a;b=isNaN(b)?0:b;return a-b;};Tablesort.extend('number',function(item){return item.match(/^-?[£\x24Û¢´€]?\d+\s*([,\.]\d{0,2})/)||item.match(/^-?\d+\s*([,\.]\d{0,2})?[£\x24Û¢´€]/)||item.match(/^-?(\d)*-?([,\.]){0,1}-?(\d)+([E,e][\-+][\d]+)?%?$/);},function(a,b){a=cleanNumber(a);b=cleanNumber(b);return compareNumber(b,a);});}());
(function(factory){if(typeof define==='function'&&define.amd)define(factory);else if(typeof module!=='undefined'&&module.exports)module.exports=factory();else window.pym=factory.call(this);})(function(){var MESSAGE_DELIMITER='xPYMx';var lib={};var _getParameterByName=function(name){var regex=new RegExp("[\\?&]"+name.replace(/[\[]/,'\\[').replace(/[\]]/,'\\]')+'=([^&#]*)');var results=regex.exec(location.search);if(results===null)return '';return decodeURIComponent(results[1].replace(/\+/g," "));};var _isSafeMessage=function(e,settings){if(settings.xdomain!=='*')if(!e.origin.match(new RegExp(settings.xdomain+'$')))return;return true;};var _makeMessage=function(id,messageType,message){var bits=['pym',id,messageType,message];return bits.join(MESSAGE_DELIMITER);};var _makeMessageRegex=function(id){var bits=['pym',id,'(\\S+)','(.+)'];return new RegExp('^'+bits.join(MESSAGE_DELIMITER)+'$');};var _autoInit=function(){var elements=document.querySelectorAll('[data-pym-src]:not([data-pym-auto-initialized])');var length=elements.length;for(var idx=0;idx<length;++idx){var element=elements[idx];element.setAttribute('data-pym-auto-initialized','');if(element.id==='')element.id='pym-'+idx;var src=element.getAttribute('data-pym-src');var xdomain=element.getAttribute('data-pym-xdomain');var config={};if(xdomain)config.xdomain=xdomain;new lib.Parent(element.id,src,config);}};lib.Parent=function(id,url,config){this.id=id;this.url=url;this.el=document.getElementById(id);this.iframe=null;this.settings={xdomain:'*'};this.messageRegex=_makeMessageRegex(this.id);this.messageHandlers={};config=(config||{});this._constructIframe=function(){var width=this.el.offsetWidth.toString();this.iframe=document.createElement('iframe');var hash='';var hashIndex=this.url.indexOf('#');if(hashIndex>-1){hash=this.url.substring(hashIndex,this.url.length);this.url=this.url.substring(0,hashIndex);}if(this.url.indexOf('?')<0)this.url+='?';else this.url+='&';this.iframe.src=this.url+'initialWidth='+width+'&childId='+this.id+'&parentUrl='+encodeURIComponent(window.location.href)+hash;this.iframe.setAttribute('width','100%');this.iframe.setAttribute('scrolling','no');this.iframe.setAttribute('marginheight','0');this.iframe.setAttribute('frameborder','0');this.el.appendChild(this.iframe);window.addEventListener('resize',this._onResize);};this._onResize=function(){this.sendWidth();}.bind(this);this._fire=function(messageType,message){if(messageType in this.messageHandlers)for(var i=0;i<this.messageHandlers[messageType].length;i++)this.messageHandlers[messageType][i].call(this,message);};this.remove=function(){window.removeEventListener('message',this._processMessage);window.removeEventListener('resize',this._onResize);this.el.removeChild(this.iframe);};this._processMessage=function(e){if(!_isSafeMessage(e,this.settings))return;if(typeof e.data!=='string')return;var match=e.data.match(this.messageRegex);if(!match||match.length!==3)return false;var messageType=match[1];var message=match[2];this._fire(messageType,message);}.bind(this);this._onHeightMessage=function(message){var height=parseInt(message);this.iframe.setAttribute('height',height+'px');};this._onNavigateToMessage=function(message){document.location.href=message;};this.onMessage=function(messageType,callback){if(!(messageType in this.messageHandlers))this.messageHandlers[messageType]=[];this.messageHandlers[messageType].push(callback);};this.sendMessage=function(messageType,message){this.el.getElementsByTagName('iframe')[0].contentWindow.postMessage(_makeMessage(this.id,messageType,message),'*');};this.sendWidth=function(){var width=this.el.offsetWidth.toString();this.sendMessage('width',width);};for(var key in config)this.settings[key]=config[key];this.onMessage('height',this._onHeightMessage);this.onMessage('navigateTo',this._onNavigateToMessage);window.addEventListener('message',this._processMessage,false);this._constructIframe();return this;};lib.Child=function(config){this.parentWidth=null;this.id=null;this.parentUrl=null;this.settings={renderCallback:null,xdomain:'*',polling:0};this.messageRegex=null;this.messageHandlers={};config=(config||{});this.onMessage=function(messageType,callback){if(!(messageType in this.messageHandlers))this.messageHandlers[messageType]=[];this.messageHandlers[messageType].push(callback);};this._fire=function(messageType,message){if(messageType in this.messageHandlers)for(var i=0;i<this.messageHandlers[messageType].length;i++)this.messageHandlers[messageType][i].call(this,message);};this._processMessage=function(e){if(!_isSafeMessage(e,this.settings))return;if(typeof e.data!=='string')return;var match=e.data.match(this.messageRegex);if(!match||match.length!==3)return;var messageType=match[1];var message=match[2];this._fire(messageType,message);}.bind(this);this._onWidthMessage=function(message){var width=parseInt(message);if(width!==this.parentWidth){this.parentWidth=width;if(this.settings.renderCallback)this.settings.renderCallback(width);this.sendHeight();}};this.sendMessage=function(messageType,message){window.parent.postMessage(_makeMessage(this.id,messageType,message),'*');};this.sendHeight=function(){var height=document.getElementsByTagName('body')[0].offsetHeight.toString();this.sendMessage('height',height);}.bind(this);this.scrollParentTo=function(hash){this.sendMessage('navigateTo','#'+hash);};this.navigateParentTo=function(url){this.sendMessage('navigateTo',url);};this.id=_getParameterByName('childId')||config.id;this.messageRegex=new RegExp('^pym'+MESSAGE_DELIMITER+this.id+MESSAGE_DELIMITER+'(\\S+)'+MESSAGE_DELIMITER+'(.+)$');var width=parseInt(_getParameterByName('initialWidth'));this.parentUrl=_getParameterByName('parentUrl');this.onMessage('width',this._onWidthMessage);for(var key in config)this.settings[key]=config[key];window.addEventListener('message',this._processMessage,false);if(this.settings.renderCallback)this.settings.renderCallback(width);this.sendHeight();if(this.settings.polling)window.setInterval(this.sendHeight,this.settings.polling);return this;};_autoInit();return lib;});
var onWindowLoaded=function(){pymChild=new pym.Child({});pymChild.onMessage('on-screen',function(bucket){ANALYTICS.trackEvent('on-screen',bucket);});pymChild.onMessage('scroll-depth',function(data){ANALYTICS.trackEvent('scroll-depth',data.percent,data.seconds);});};window.onload=onWindowLoaded;