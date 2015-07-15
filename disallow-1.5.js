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
//Last updated: 07-15-2015
//Version: 1.4
//Documentation: https://github.com/abnoba12/JQuery-Disallow/blob/master/README.md


//TODO: Add a hover over to all the disallowed targets telling the user why the target is disabled. 
//To get nice English wording you can find the target's label element and pull the text. If the form field has a label.
//
(function ($) {    
    $.fn.disallow = function (variables) {
        this.each(function (index) {
            //determine if we are using passed in variables or data attributes
            var condition = getCondition(variables);
            var target = getTarget(variables);
            var hide = getHide(variables);
            var disallowedValue = getDisallowedValue(variables);
            var source = $(this);

            //Determine the html element type or our source element
            switch (source.prop('tagName')) {
                case "OPTION":
                    source.parent().on("change", function () {
                        //Condition is met so disallow our target
                        if (source.is(condition)) {
                            disallowTargets(source, target, hide, disallowedValue);
                        } else {
                            allowTargets(source, target);
                        }
                    }).trigger("change");
                    break;
                case "INPUT":
                    //Determine the type of input
                    switch (source.attr("type").toLowerCase()) {
                        case "checkbox":
                            source.on("change", function () {
                                //Condition is met so disallow our target
                                if (source.is(condition)) {
                                    disallowTargets(source, target, hide, disallowedValue);
                                } else {
                                    allowTargets(source, target);
                                }
                            }).trigger("change");
                            break;
                        case "text":
                            source.on("input", function () {
                                //Condition is met so disallow our target
                                if (source.is(condition)) {
                                    disallowTargets(source, target, hide, disallowedValue);
                                } else {
                                    allowTargets(source, target);
                                }
                            }).trigger("change");
                            break;
                        default:
                            console.error(target.prop('tagName') + " is unknown target input type for the disallow library");
                    }
                    break;
                default:
                    console.error(source.prop('tagName') + " is unknown source type for the disallow library");
            }
        });
        return this;

    };

    //-- START -- Static methods
    $.disallow = {};

    //Call this to disallow a field
    $.disallow.manualDisallow = function (variables){
        var source = $("<input type=\"text\" name=\"" + variables.disallowName + "\"></input>");
        var hide = getHide(variables);
        var disallowedValue = getDisallowedValue(variables);
        disallowTargets(source, $(variables.target), hide, disallowedValue);
    }

    //Call this to allow a field
    $.disallow.manualAllow = function (variables) {
        var source = $("<input type=\"text\" name=\"" + variables.disallowName + "\"></input>");
        allowTargets(source, $(variables.target));
    }
    //-- END -- Static methods

    //-- START -- reusable functions
    //Enable targets
    function allowTargets(source, target) {
        var sourceName = getSourceName(source);
        target.each(function () {
            var singleTarget = $(this);
            var currentDisallows = singleTarget.attr("data-disallow-from");
            var currentDisallowsArray = Array();

            //Check to see if this source element disallowed this singleTarget element
            if (typeof currentDisallows !== typeof undefined && currentDisallows !== false) {
                currentDisallowsArray = currentDisallows.split(',');
                //The source did disallow this singleTarget
                if ($.inArray(sourceName, currentDisallowsArray) !== -1) {
                    removeDisallowLabel(source, singleTarget);
                    
					//All disallow rules are gone from this element so we can now enable it again.
                    if (!hasDisallows(singleTarget)) {
                        singleTarget.removeAttr('disabled');
                        singleTarget.removeAttr('readonly');
                        singleTarget.off('.disallow-readonly');
                        singleTarget.show();

                        //Special enable rules for types
                        if (typeof singleTarget !== "undefined" && typeof singleTarget.attr("type") !== "undefined")
                        {
                            switch (singleTarget.attr("type").toLowerCase()) {
                                case "checkbox":
                                    singleTarget.css("opacity", "1");
                                    break;
                            }
                        }
						
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
    function disallowTargets(source, target, hide, disallowedValue) {
        target.each(function () {
            var singleTarget = $(this);
            //Determine the html elment type or our singleTarget element
            switch (singleTarget.prop('tagName')) {
                case "SELECT":
                    disableSelect(singleTarget, disallowedValue);
                    break;
                case "OPTION":
                    disableSelectOption(singleTarget);
                    break;
                case "INPUT":
                    disableInput(singleTarget, disallowedValue);
                    break;
                default:
                    console.error(singleTarget.prop('tagName') + " is unknown singleTarget type for the disallow library");
            }
            if (hide) {
                singleTarget.hide();
            }
            addDisallowLabel(source, singleTarget);
            singleTarget.trigger("change");
        });
    }

    //Disable entire select list
    function disableSelect(element, disallowedValue) {
        //set the select list's value to the disallowed value if it is set, otherwise set it to empty
        if (typeof disallowedValue !== "undefined") {
            element.val(disallowedValue);
			element.attr('readonly', 'readonly');
			element.on("mousedown.disallow-readonly", function(event){event.preventDefault();});
        } else {            
			element.attr('disabled', 'disabled');
        }
    }
    
    //Disable a select list option
    function disableSelectOption(selectOption) {
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
    function disableInput(inputElement, disallowedValue) {
        //Determine the input type or our inputElement element
        //then remove any user entered data
        switch (inputElement.attr("type").toLowerCase()) {
            case "checkbox":
                if (typeof disallowedValue !== "undefined") {
                    inputElement.prop('checked', disallowedValue);
					inputElement.attr('readonly', 'readonly');
					inputElement.on("click.disallow-readonly", function(event){event.preventDefault();}).css("opacity", "0.5");
                } else {
                    inputElement.prop('checked', false);
					inputElement.attr("disabled", true);
                }                
                break;
            case "text":
                if (typeof disallowedValue !== "undefined") {
                    inputElement.val(disallowedValue);
					inputElement.attr('readonly', 'readonly');
                } else {
                    inputElement.val("");
					inputElement.attr("disabled", true);
                }
                break;
        }
    }

    //Add a data attribute to list What elements are causing this element to me disallowed
    function addDisallowLabel(source, target) {
        var currentDisallows = target.attr("data-disallow-from");
        var currentDisallowsArray = Array();
        var sourceName = getSourceName(source);

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
    function removeDisallowLabel(source, target) {
        var currentDisallows = target.attr("data-disallow-from");
        var currentDisallowsArray = Array();
        var sourceName = getSourceName(source);
        
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

    function getSourceName(source) {
        var sourceName = source.attr("name");

        if (typeof sourceName == typeof undefined || sourceName == false) {
            sourceName = source.parent().attr("name") + "-" + source.attr("value");
        }
        return sourceName;
    }

    function hasDisallows(element) {
        var currentDisallows = element.attr("data-disallow-from");
        if (typeof currentDisallows !== typeof undefined && currentDisallows !== false && currentDisallows != "") {
            return true;
        }
        return false;
    }
    //-- START -- reusable functions

    //-- START -- Functions to determine the source of our variables. First as passed in variables, second data attributes on the HTML 
    function getCondition(variables) {
        if (typeof variables !== "undefined" && variables !== null && typeof variables.condition !== "undefined" && variables.condition !== null) {
            condition = variables.condition;
        } else if ($(this).attr("data-disallow-condition") !== "undefined") {
            condition = $(this).attr("data-disallow-condition");
        }
        return condition;
    }

    function getTarget(variables) {
        if (typeof variables !== "undefined" && variables !== null && typeof variables.target !== "undefined" && variables.target !== null) {
            target = $(variables.target);
        } else if ($(this).attr("data-disallow-target") !== "undefined") {
            target = $($(this).attr("data-disallow-target"));
        }
        return target;
    }

    function getHide(variables) {
        if ((typeof variables !== "undefined" && variables !== null && variables.hide == true) ||
                (typeof $(this).attr("data-disallow-hide") !== "undefined" && $(this).attr("data-disallow-hide") !== null && $(this).attr("data-disallow-hide") == "true") ||
                ((typeof variables.hide == "undefined" || variables.hide == null) && (typeof $(this).attr("data-disallow-hide") == "undefined" || $(this).attr("data-disallow-hide") == null))) {
            hide = true;
        } else {
            hide = false;
        }
        return hide;
    }

    function getDisallowedValue(variables) {
        if (typeof variables !== "undefined" && variables !== null && typeof variables.disallowedValue !== "undefined" && variables.disallowedValue !== null) {
            disallowedValue = variables.disallowedValue;
        } else if ($(this).attr("data-disallow-disallowedValue") !== "undefined") {
            disallowedValue = $(this).attr("data-disallow-disallowedValue");
        }
        return disallowedValue;
    }
    //-- END -- Functions to determine the source of our variables. First as passed in variables, second data attributes on the HTML

}(jQuery));