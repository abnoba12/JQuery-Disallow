//The MIT License (MIT)

//Copyright (c) 2015 J.Hilburn, Jacob Weigand

//Permission is hereby granted, free of charge, to any person obtaining a copy
//of this software and associated documentation files (the "Software"), to deal
//in the Software without restriction, including without limitation the rights
//to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//copies of the Software, and to permit persons to whom the Software is
//furnished to do so, subject to the following conditions:

//The above copyright notice and this permission notice shall be included in
//all copies or substantial portions of the Software.

//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//THE SOFTWARE.

//Written By: Jacob Weigand
//Last updated: 08-10-2015
//Version: 1.5.1
//Documentation: https://github.com/abnoba12/JQuery-Disallow/blob/master/README.md

(function ($) {    
    $.fn.disallow = function (variables) {
        var selector = this;
        selector.each(function (index) {
            //determine if we are using passed in variables or data attributes
            var condition = _getCondition(variables);
            var target = _getTarget(variables);
            var hide = _getHide(variables);
            var disallowedValue = _getDisallowedValue(variables);
            var source = $(this);
            var sourceName = _getSourceName(source);

            //Determine the html element type or our source element
            switch (source.prop('tagName')) {
                case "OPTION":
                    source.parent().on("change.disallow" + sourceName, function () {
                        //Condition is met so disallow our target
                        if (source.is(condition)) {
                            _disallowTargets(source, target, hide, disallowedValue);
                        } else {
                            _allowTargets(source, target);
                        }
                    }).trigger("change");
                    break;
                case "INPUT":
                    //Determine the type of input
                    switch (source.attr("type").toLowerCase()) {
                        case "checkbox":
                            source.on("change.disallow", function () {
                                //Condition is met so disallow our target
                                if (source.is(condition)) {
                                    _disallowTargets(source, target, hide, disallowedValue);
                                } else {
                                    _allowTargets(source, target);
                                }
                            }).trigger("change");
                            break;
                        case "text":
                            source.on("input.disallow", function () {
                                //Condition is met so disallow our target
                                if (source.is(condition)) {
                                    _disallowTargets(source, target, hide, disallowedValue);
                                } else {
                                    _allowTargets(source, target);
                                }
                            }).trigger("input");
                            break;
                        default:
                            console.error(target.prop('tagName') + " is unknown target input type for the disallow library");
                    }
                    break;
                default:
                    console.error(source.prop('tagName') + " is unknown source type for the disallow library");
            }
        });

        //When a form element is disabled it submits a null value. 
        //To prevent this I enable all elements that were disabled by disallow plugin on form submission. 
        //This way the values get submitted instead of null values.
        if ($("form.data-disallow").length === 0) {
            $("form").addClass("data-disallow");
            $("form.data-disallow").on("submit.disallow", function (event) {
                $("form.data-disallow [data-disallow-from][disabled]").removeAttr('disabled');
            });
        }
        return this;
    };

    //Unbind the disallow plugin from desired element. 
    //This unbinds all events that fire from this specific selector.
    //You can unbind individual select options.
    //Unbinding an element doesn't remove its enabled/disabled state. The element is left in its current state at the time of unbinding. 
    $.fn.disallowUnbind = function () {
        this.each(function (index) {
            var source = $(this);
            var sourceName = _getSourceName(source);

            //Determine the html element type or our source element
            switch (source.prop('tagName')) {
                case "OPTION":
                    source.parent().off("change.disallow" + sourceName);
                    break;
                case "INPUT":
                    //Determine the type of input
                    switch (source.attr("type").toLowerCase()) {
                        case "checkbox":
                            source.off("change.disallow");
                            break;
                        case "text":
                            source.off("input.disallow");
                            break;
                        default:
                            console.error(source.prop('tagName') + " is unknown target type for the disallow library");
                    }
                    break;
                default:
                    console.error(source.prop('tagName') + " is unknown type for the disallow library");
            }
        });
    };

    //-- START -- Static methods
    $.disallow = {};

    //Call this to disallow a field
    $.disallow.manualDisallow = function (variables){
        var source = $("<input type=\"text\" name=\"" + variables.disallowName + "\"></input>");
        var hide = _getHide(variables);
        var disallowedValue = _getDisallowedValue(variables);
        _disallowTargets(source, $(variables.target), hide, disallowedValue);
    }

    //Call this to allow a field
    $.disallow.manualAllow = function (variables) {
        var source = $("<input type=\"text\" name=\"" + variables.disallowName + "\"></input>");
        _allowTargets(source, $(variables.target));
    }
    //-- END -- Static methods

    //-- START -- reusable functions
    //Enable targets
    function _allowTargets(source, target) {
        var sourceName = _getSourceName(source);
        target.each(function () {
            var singleTarget = $(this);
            var currentDisallows = singleTarget.attr("data-disallow-from");
            var currentDisallowsArray = Array();

            //Check to see if this source element disallowed this singleTarget element
            if (typeof currentDisallows !== typeof undefined && currentDisallows !== false) {
                currentDisallowsArray = currentDisallows.split(',');
                //The source did disallow this singleTarget
                if ($.inArray(sourceName, currentDisallowsArray) !== -1) {
                    _removeDisallowLabel(source, singleTarget);
                    
					//All disallow rules are gone from this element so we can now enable it again.
                    if (!_hasDisallows(singleTarget)) {
                        singleTarget.removeAttr('disabled');
                        singleTarget.show();
						
                        //If this is a select and all options were previously disallowed then we want 
                        //to set the first enabled option as selected
                        if (singleTarget.prop('tagName') == "OPTION" && singleTarget.parent().attr("data-disallow-all-disabled") == "true") {
                            var NondisabledOptions = singleTarget.parent().find("option:enabled");
                            if (NondisabledOptions.length > 0) {
                                singleTarget.parent().removeAttr("data-disallow-all-disabled");
                                NondisabledOptions.first().attr('selected', true).trigger("click").trigger("change");
                            }
                        }
                    }
                    singleTarget.trigger("change");
                }
            }
        });
    }
    
    //Disallow targets
    function _disallowTargets(source, target, hide, disallowedValue) {
        target.each(function () {
            var singleTarget = $(this);
            //Determine the html elment type or our singleTarget element
            switch (singleTarget.prop('tagName')) {
                case "SELECT":
                    _disableSelect(singleTarget, disallowedValue);
                    break;
                case "OPTION":
                    _disableSelectOption(singleTarget);
                    break;
                case "INPUT":
                    _disableInput(singleTarget, disallowedValue);
                    singleTarget.trigger("input");
                    break;
                default:
                    console.error(singleTarget.prop('tagName') + " is unknown singleTarget type for the disallow library");
            }
            if (hide) {
                singleTarget.hide();
            }
            _addDisallowLabel(source, singleTarget);
            singleTarget.trigger("change");
        });
    }

    //Disable entire select list
    function _disableSelect(element, disallowedValue) {
        //set the select list's value to the disallowed value if it is set, otherwise set it to empty
        if (typeof disallowedValue !== "undefined") {
            element.val(disallowedValue);
        } else {
            element.val("");
        }
		element.attr('disabled', 'disabled');
    }
    
    //Disable a select list option
    function _disableSelectOption(selectOption) {
        //If our target was currently selected when the condition was met, move the selection to the first in the dropdown
        if (selectOption.is(":selected")) {
            selectOption.attr('selected', false).attr('disabled', 'disabled');

            //If all options are disabled then set the dropdown value to blank
            //otherwise set the dropdown to the first enabled option.
            var NondisabledOptions = selectOption.parent().find("option:enabled");
            if (NondisabledOptions.length == 0) {
                selectOption.parent().attr("data-disallow-all-disabled", "true").val("");
            } else {
                NondisabledOptions.first().attr('selected', true).trigger("click").trigger("change");
            }
        } else {
            selectOption.attr('disabled', 'disabled');
        }
    }

    //Disable input
    function _disableInput(inputElement, disallowedValue) {
        //Determine the input type or our inputElement element
        //then remove any user entered data
        switch (inputElement.attr("type").toLowerCase()) {
            case "checkbox":
                if (typeof disallowedValue !== "undefined") {
                    inputElement.prop('checked', disallowedValue);
                } else {
                    inputElement.prop('checked', false);
                }                
                break;
            case "text":
                if (typeof disallowedValue !== "undefined") {
                    inputElement.val(disallowedValue);
                } else {
                    inputElement.val("");
                }
                break;
        }
        inputElement.attr("disabled", true);
    }

    //Add a data attribute to list What elements are causing this element to me disallowed
    function _addDisallowLabel(source, target) {
        var currentDisallows = target.attr("data-disallow-from");
        var currentDisallowsArray = Array();
        var sourceName = _getSourceName(source);

        if (typeof currentDisallows !== typeof undefined && currentDisallows !== false) {
            currentDisallowsArray = currentDisallows.split(',');

            //If this rule already exists then don't add it again
            if ($.inArray(sourceName, currentDisallowsArray) < 0) {
                currentDisallowsArray.push(sourceName);
            }
        } else {
            currentDisallowsArray.push(sourceName);
        }
        target.attr("data-disallow-from", currentDisallowsArray.join(","));
    }

    //Removed the source element from the list of data elements causing an target element from being disallowed 
    function _removeDisallowLabel(source, target) {
        var currentDisallows = target.attr("data-disallow-from");
        var currentDisallowsArray = Array();
        var sourceName = _getSourceName(source);
        
        if (typeof currentDisallows !== typeof undefined && currentDisallows !== false) {
            currentDisallowsArray = currentDisallows.split(',');
            currentDisallowsArray = jQuery.grep(currentDisallowsArray, function (i) {
                return (i !== sourceName);
            });
            currentDisallows = currentDisallowsArray.join(",");
            if (currentDisallows == "") {
                target.removeAttr("data-disallow-from");
            } else {
                target.attr("data-disallow-from", currentDisallows);
            }
        }
    }

    function _getSourceName(source) {
        var sourceName = source.attr("name");

        if (typeof sourceName == typeof undefined || sourceName == false) {
            sourceName = source.parent().attr("name") + "-" + source.attr("value");
        }
        return sourceName;
    }

    function _hasDisallows(element) {
        var currentDisallows = element.attr("data-disallow-from");
        if (typeof currentDisallows !== typeof undefined && currentDisallows !== false && currentDisallows != "") {
            return true;
        }
        return false;
    }
    //-- START -- reusable functions

    //-- START -- Functions to determine the source of our variables. First as passed in variables, second data attributes on the HTML 
    function _getCondition(variables) {
        if (typeof variables !== "undefined" && variables !== null && typeof variables.condition !== "undefined" && variables.condition !== null) {
            condition = variables.condition;
        } else if ($(this).attr("data-disallow-condition") !== "undefined") {
            condition = $(this).attr("data-disallow-condition");
        }
        return condition;
    }

    function _getTarget(variables) {
        if (typeof variables !== "undefined" && variables !== null && typeof variables.target !== "undefined" && variables.target !== null) {
            target = $(variables.target);
        } else if ($(this).attr("data-disallow-target") !== "undefined") {
            target = $($(this).attr("data-disallow-target"));
        }
        return target;
    }

    function _getHide(variables) {
        if ((typeof variables !== "undefined" && variables !== null && variables.hide == true) ||
                (typeof $(this).attr("data-disallow-hide") !== "undefined" && $(this).attr("data-disallow-hide") !== null && $(this).attr("data-disallow-hide") == "true") ||
                ((typeof variables.hide == "undefined" || variables.hide == null) && (typeof $(this).attr("data-disallow-hide") == "undefined" || $(this).attr("data-disallow-hide") == null))) {
            hide = true;
        } else {
            hide = false;
        }
        return hide;
    }

    function _getDisallowedValue(variables) {
        if (typeof variables !== "undefined" && variables !== null && typeof variables.disallowedValue !== "undefined" && variables.disallowedValue !== null) {
            disallowedValue = variables.disallowedValue;
        } else if ($(this).attr("data-disallow-disallowedValue") !== "undefined") {
            disallowedValue = $(this).attr("data-disallow-disallowedValue");
        }
        return disallowedValue;
    }
    //-- END -- Functions to determine the source of our variables. First as passed in variables, second data attributes on the HTML

}(jQuery));