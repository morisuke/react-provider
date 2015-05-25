var closingTags = ["area", "base", "br", "col", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"];
var React       = require('react');
var Tools       = require('react-tools');
var _           = require('lodash');

var provider = function(elementMap, wrapTagName) {
	
	var collection = [];
	_(elementMap).map(function(jsx, selector){
		
		_(document.querySelectorAll(selector)).map(function(node){
			
			var origin = node;
			var depth  = 0;

			while (node.parentNode !== null) {
				++depth;
				node = node.parentNode;
			}
			
			collection.push({depth: depth, node:origin, jsx: jsx});

		}).commit();

	}).commit();

	_(collection).sortBy('depth').map(function(convert) {
		transform(convert.jsx, convert.node, wrapTagName);
	}).commit();
}


var transform = function(jsx, node, wrapTagName) {

		if (! wrapTagName) {
			wrapTagName = camelToSnake(jsx.type.name);
		}

		var props  = collectionProps(node);
		var clone  = React.cloneElement(jsx, props);

		var wTagName   = node.attributes.getNamedItem('data-tagName');
		var wClassName = node.attributes.getNamedItem('data-className');
		var wrap       = document.createElement(wTagName ? wTagName.value : 'div');
		wrap.className = wClassName ? wClassName.value : '';
		
		node.parentNode.insertBefore(wrap, node);
		wrap.appendChild(node);
		React.render(clone, node.parentNode);
}


var collectionProps = function(node) {
	
	// main properties
	var props = _(node.attributes).transform(function(result, attr){
		var name  = attr.name;
		if      (name === 'class')    name = 'className';
		else if (name === 'for')      name = 'htmlFor';
		else if (name === 'value')    name = 'defaultValue';
		else if (name === 'checked')  name = 'defaultChecked';
		else if (name === 'selected') name = 'defaultSelected';
		result[name] = attr.value;
		return result;
	})
	.value();
	
	if (isIE8()) {
		// selectbox
		if (node.tagName === 'select') {
			props.defaultSelected = node.selected;
		}
		
		// radiobutton, checkbox 
		if (node.tagName.toLowerCase() === 'input' && (node.type === 'radio' || node.type === 'checked')){
			props.defaultChecked = node.checked;
		}
	}

	// children nodes
	props.children = convertVirtualDomArray(node.childNodes)
	
	// Tag to Property convert
	_(node.querySelectorAll('[data-props]')).map(function(child){
		props[child.attributes.getNamedItem('data-props').value] = innerHTML(child).replace(/(^\s+)|(\s+$)/g, "");
		child.parentNode.removeChild(child);
	}).commit();

	// Tag to ReactElement convert
	var nodeKey  = 0;
	var elements = null;
	props.html   = {};
	_(node.querySelectorAll('[data-props-html]')).map(function(child){
		elements = convertVirtualDomArray(child.childNodes, nodeKey);
		nodeKey += elements.length;
		props.html[child.attributes.getNamedItem('data-props-html').value] = elements;
		child.parentNode.removeChild(child);
	}).commit();

	return props;
}


var convertVirtualDomArray = function(nodelist, nodeKey) {
	
	var virtualDomList = [];
	nodeKey = nodeKey || 0;

	_(nodelist).map(function(node){

		if (node.nodeType === 8) {
			return true;
		}
		
		if (node.nodeType === 3) {
			var textnode = (node.textContent || node.innerText) || node.nodeValue;
			if (textnode) {
				virtualDomList.push(textnode.replace(/(^\s+)|(\s+$)/g, ""));
			}
			return true;
		}

		node.setAttribute('key', nodeKey);
		virtualDomList.push(convertVirtualDom(node));
		nodeKey++;
	
	}).commit();

	return virtualDomList;
}


var convertVirtualDom = function(node) {
	
	var html = null;
	html = outerHTML(node).replace(/(^\s+)|(\s+$)/g, "");
	html = replaceAttribute(html, 'class',    'className');
	html = replaceAttribute(html, 'for',      'htmlFor');
	html = replaceAttribute(html, 'value',    'defaultValue');
	html = replaceAttribute(html, 'checked',  'defaultChecked');
	html = replaceAttribute(html, 'selected', 'defaultSelected');
	html = html
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/{/g, '&#123;')
		.replace(/}/g, '&#125;')
		.replace(/<br>/g, '<br />');

	_(closingTags).map(function(tag){
		var regs  = new RegExp("<" + tag + "([^>]*[^/])>", "g");
		html = html.replace(regs, '<' + tag + ' $1 />');
	}).commit();

	return eval(Tools.transform(html));
}


var innerHTML = function(node) {
	
	if (window.navigator.appVersion.toLowerCase().indexOf("msie 8.") < 0) {
		return node.innerHTML;
	}
	
	// classがひとつの場合、ダブルクォートが消える
	node.className = [node.className, node.className].join(' ');
	_(node.querySelectorAll('[class]')).map(function(child){
		child.className = [child.className, child.className].join(' ');
	}).commit();

    var zz = node.innerHTML ? String(node.innerHTML) : node
       ,z  = zz.match(/(<.+[^>])/g);
	
	return convertNearHtmlToHtml(zz, z);
}


var outerHTML = function(node) {
	if (! isIE8()) {
		return node.outerHTML;
	}
	
	// classがひとつの場合、ダブルクォートが消える
	node.className = [node.className, node.className].join(' ');
	_(node.querySelectorAll('[class]')).map(function(child){
		child.className = [child.className, child.className].join(' ');
	}).commit();

    var zz = node.outerHTML ? String(node.outerHTML) : node
       ,z  = zz.match(/(<.+[^>])/g);    
	
	return convertNearHtmlToHtml(zz, z);
}


var convertNearHtmlToHtml = function(zz, z) {
    
	if (z) {
     for ( var i=0;i<z.length;(i=i+1) ){
      var y
         ,zSaved = z[i]
         ,attrRE = /\=[a-zA-Z\.\:\[\]_\(\)\&\$\%#\@\!0-9\/]+[?\s+|?>]/g
      ;

      z[i] = z[i]
              .replace(/([<|<\/].+?\w+).+[^>]/,
                 function(a){return a.toLowerCase();
               });
      y = z[i].match(attrRE);

      if (y){
        var j   = 0
           ,len = y.length
        while(j<len){
          var replaceRE = 
               /(\=)([a-zA-Z\.\:\[\]_\(\)\&\$\%#\@\!0-9\/]+)?([\s+|?>])/g
             ,replacer  = function(){
                  var args = Array.prototype.slice.call(arguments);
                  return '="'+ args[2] +'"'+ args[3];
                };
          z[i] = z[i].replace(y[j],y[j].replace(replaceRE,replacer));
          j+=1;
        }
       }
       zz = zz.replace(zSaved,z[i]);
     }
   }
  return zz;
}


var replaceAttribute = function(string, needle, replace) {
	return string.split(needle + '=').join(replace + '=')
}


var camelToSnake = function(v) {
	
	if (! v) return v;

    var upperChars = v.match(/([A-Z])/g);
    if (! upperChars) {
        return v;
    }
 
    var str = v.toString();
    for (var i = 0, n = upperChars.length; i < n; i++) {
        str = str.replace(new RegExp(upperChars[i]), '-' + upperChars[i].toLowerCase());
    }
 
    if (str.slice(0, 1) === '-') {
        str = str.slice(1);
    }
 
    return str;
};

var isIE8 = function() {
	return (window.navigator.appVersion.toLowerCase().indexOf("msie 8.") !== -1);
}


module.exports = provider;
