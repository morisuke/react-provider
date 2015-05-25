# React-provider

HTML上の要素をReact.jsのコンポーネントに置換します。  
Browserify + Babelifyの環境で動作確認済み。  
loose-modeを用いることでIE8でも動作可能です。

## 主要な機能
1. Component provider
2. this.props.children
3. data-props

### 1.Component provider

```js
var elementMap = {
  selector:  <Component />,
  selector2: <Component />...
}

provider(elementMap, wrapTagName = null);
```

selector(string)で指定した要素にコンポーネントが展開されます。  
指定されていたattributesはpropsに引き継がれます。  
IE8は未定義タグに対応していないため、wrapTagNameにdivやspanを渡して対応して下さい。  

#### 使用例

##### component.jsx
```js
import React from 'react';
class Component extends React.Component {
  render() {
    return (
        <div className={this.props.className}>
            {this.props.children}
        </div>
        );
  }
}
```

##### app.js
```js
var Component = require('./component.jsx');
var provider   = require('./react-provider');

provider({
  'component': <Component />,
  '[v-component=component]': <Component />
});
```

##### index.html (実行前)
```html
<body>

  <component class="wrapper">
    wrappertext
    <div v-component="component" class="inner">innertext</div>
  </component>
  
  <script src="./app.js" type="text/javascript">
</body>
```

##### index.html (実行後)
```html
<body>

    <component>
        <div class="wrapper" data-reactid=".0">
            wrappertext
            <component>
                <div class="inner" data-reactid=".1">innertext</div>
            </component>
        </div>
    </component>

    <script src="./app.js" type="text/javascript">
</body>
```

### 2.  this.props.children
変換対象要素の子要素がReactElementとして格納されます。  
jsx内に```{this.props.children}```と記述することで展開できます。

### 3. data-props属性
__data-props__を指定した要素はthis.props内に文字列として格納されます。  
__data-props-html__を指定した要素はthis.props.html内にReactElementとして格納されます。  

##### component.jsx
```js
import React from 'react';
class Component extends React.Component {
  render() {
    return (
        <section>
            {this.props.html.reactelement}
            {this.props.textelement}
        </section>
        );
  }
}
```

##### index.html (実行前)
```html
<body>

    <component class="wrapper">
        
        <div data-props="textelement">
            textnodeが格納されます
        </div>
        
         <div data-props-html="reactelement">
            <span class="style">htmlが格納されます</span>
        </div>
        
    </component>
  
  <script src="./app.js" type="text/javascript">
</body>
```

##### index.html (実行後)
```html
<body>

    <component>
        <span class="style">htmlが格納されます</span>
        textnodeが格納されます
    </component>

    <script src="./app.js" type="text/javascript">
</body>
```
