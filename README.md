# JQuery-Disallow
##License
The MIT License (MIT)

Copyright (c) 2015 J.Hilburn, Jacob Weigand

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Disallow Plugin ##
This is a JQuery plugin that manages the restrictions between form fields. If a specific field or option needs to be restricted because some other field was set to a certain value then this plugin will handle disabling and enabling the target field based on the value of the source field. 

This plugin allows/disallows the use of the target field every time the source field changes based on the criteria provided. This will also handle when there is multiple sources disabling a single target. Every target element maintains a stack of disallows and the target will not become enabled again until all the disallow sources are gone from the stack.  

### Version ###
This Documentation is for Disallow Version: 1.5.1

#### Version Convention ####
This plugin uses the following for its version numbers: "Major Release Number"."Minor Release number"."Bug Fix number"

### Location ###
The latest version of this plugin can be found at https://github.com/abnoba12/JQuery-Disallow

### Plugin Dependency ###
This plugin requires JQuery. This plugin has been tested with JQuery Version 1.7.1

### Limitations ###
This plugin only works on HTML form elements such as inputs. You cannot currently disable an entire div using this library. More types will be added as the need arises. The form elements must always have the type and name attribute defined.

####Supported input types####
```html
  <option>
  <input type="checkbox">
  <input type="text">
```

####Supported target types####
```html
  <option>
  <input type="checkbox">
  <input type="text">  
  <select>  
```

## Usage ##
###Enabling the plugin ###
```javascript
     $('#example').disallow(options);

     //There are two static functions that allow manually adding and removing of restrictions
     $.disallow.manualDisallow({ disallowName: "Name", target: "#disallowTarget", hide: false });
     $.disallow.manualAllow({ disallowName: "Name", target: "#disallowTarget"});
```

### Options ###

|Name | Type | Required/Optional | Default | Description|
|----|----|----|----|-------|
|condition | string | required | N/A | This is the condition that applies to the selector disallow is attached to. If this condition returns true then it will restrict the target. This field can take any statement that is valid for [http://api.jquery.com/is/ JQuery's .is() function]. Some useful statements: ":not(any is statement)", ":checked", ":selected", ":text[value#'']"|
|target | string | required | N/A | This is the HTML element(s) that you want to be disabled when the condition on the source is met. This uses the same syntax as standard selectors.|
|hide | Boolean | Optional | true | When the all conditions are met and we are going to disable a target html element. If hide is true then we will disable and remove the target element(s) from view on the page. If hide is set to false then we will only disable the element(s) and not remove it from view.|
|disallowedValue | variable | Optional | empty/unchecked | When the all conditions are met and we are going to disable a target html element. If disallowedValue is set then we will set the target's value to whatever is specified. When using this on checkboxes use true/false. If no value is set for disallowedVlue then the default behavior is to set the field to "" or unchecked.|

## Methods ##
There are two methods to manually disallow or allow a form element. These would be used if you want use a complex rule that falls outside the capabilities of this plugin, but you want to maintain the ability for this plugin to stack disallows on a target and so your manual rules will interlock with other rules.

### Manually Disallow ###
This will restrict the passed in disallow target. Make sure your "disallowName" is unique, because this can and will affect other disallow rules if they share a name.
```javascript
     $.disallow.manualDisallow({ disallowName: "Name", target: "#disallowTarget", hide: false });
```

### Manually Allow ###
This will remove the "disallowName" restriction from disallow target. This can also manually remove other disallow restrictions from a target if you know the name of the source that restricted it.
```javascript
     $.disallow.manualAllow({ disallowName: "Name", target: "#disallowTarget"});
```

### Unbind the library ###
If you want to remove this plugin from an element so it no longer fires when the source element meets it's condition then you can use this to unbind it's event. This will not change the target element's state. So if the target element was disabled because of a disallow event, then the target element will stay in that state after unbinding the source. The call ONLY removes the event listener for the specified source.
```javascript
     $(".shirtButton option[value='3']").disallowUnbind();
```

## Examples ##
```javascript

    //Western front and back disallow premium options
    $(".shirtFront option[value#'7'], .shirtBack option[value#'4']").disallow({ condition: ":selected", target: ".shirtPremiumOption", hide: false });    

    //Not having Premium options disallows floating interlining
    $(".shirtPremiumOption").disallow({ condition: ":not(:checked)", target: ".shirtInterlining option[value#'9']" });    

    //White and smoke snaps disallow contrast thread on buttons, button holes, premium options
    $(".shirtButton option[value#'3'], .shirtButton option[value#'4']").disallow({ condition: ":selected", target: ".shirtContrastThreadButton, .shirtContrastThreadButtonhole, .shirtPremiumOption", hide: false });
    //White and smoke snaps disallow French Miter (CU-3), French Round (CU-6), French Square (CU-9), Square Convertible Cuff (CU-10), Miter Convertible Cuff (CU-23), Round Convertible Cuff (CU-26), Reverse French Miter (CU-13)
    $(".shirtButton option[value#'3'], .shirtButton option[value#'4']").disallow({ condition: ":selected", target: ".shirtCuff option[value#'3'], .shirtCuff option[value#'6'], .shirtCuff option[value#'9'], .shirtCuff option[value#'10'], .shirtCuff option[value#'11'], .shirtCuff option[value#'12'], .shirtCuff option[value#'15']"});

    //Before you can select the contrast fabric you want you must select a placement
    $('.shirtContrastFabricPlacket, .shirtContrastFabricCollar, .shirtContrastFabricCuff').change(function () {
        if ($('.shirtContrastFabricPlacket').is(":checked") | $(".shirtContrastFabricCollar").val() |# "None" | $(".shirtContrastFabricCuff").val() |# "None") {
            $.disallow.manualAllow({disallowName: "shirtContrastFabricPlacement", target: ".shirtContrastFabricColorWhite, .shirtContrastFabricColor"});
        } else {
            $.disallow.manualDisallow({ disallowName: "shirtContrastFabricPlacement", target: ".shirtContrastFabricColorWhite, .shirtContrastFabricColor", hide: false });
        }
    });

    //Selecting a contrast fabric disallows the white contrast fabric checkbox
    $(".shirtContrastFabricColor").disallow({ condition: ":not(:text[value#''])", target: ".shirtContrastFabricColorWhite", hide: false });
```
