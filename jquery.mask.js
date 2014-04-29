 /**
 * jquery.mask.js
 * @version: v1.5.5
 * @author: Igor Escobar
 *
 * Created by Igor Escobar on 2012-03-10. Please report any bug at http://blog.igorescobar.com
 *
 * Copyright (c) 2012 Igor Escobar http://blog.igorescobar.com
 *
 * The MIT License (http://www.opensource.org/licenses/mit-license.php)
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */
// UMD (Universal Module Definition) patterns for JavaScript modules that work everywhere.
// https://github.com/umdjs/umd/blob/master/jqueryPlugin.js
(function (factory) {
    if (typeof define === "function" && define.amd) {
        // AMD. Register as an anonymous module.
        define(["jquery"], factory);
    } else {
        // Browser globals
        factory(window.jQuery || window.Zepto);
    }
}(function ($) {
    "use strict";
    var Mask = function (el, mask, options) {
        var jMask = this, old_value;
        el = $(el);

        mask = typeof mask === "function" ? mask(el.val(), undefined, el,  options) : mask;

        jMask.init = function() {
            options = options || {};

            jMask.byPassKeys = [9, 16, 17, 18, 36, 37, 38, 39, 40, 91];
            jMask.translation = {
                '0': {pattern: /\d/},
                '9': {pattern: /\d/, optional: true},
                '#': {pattern: /\d/, recursive: true},
                'A': {pattern: /[a-zA-Z0-9]/},
                'S': {pattern: /[a-zA-Z]/}
            };

            jMask.translation = $.extend({}, jMask.translation, options.translation);
            jMask = $.extend(true, {}, jMask, options);

            el.each(function() {
                if (options.maxlength !== false) {
                    el.attr('maxlength', mask.length);
                }

                el.attr('autocomplete', 'off');
                p.destroyEvents();
                p.events();
                var caret = p.getCaret();
                var maskedCharacterCountBefore = p.getMaskCharactersBeforeCount(caret + 1);
                p.val(p.getMasked());
                p.setCaret(caret + maskedCharacterCountBefore);
            });
        };

        var p = {
            getCaret: function () {
                var sel,
                    pos = 0,
                    ctrl = el.get(0),
                    dSel = document.selection,
                    cSelStart = ctrl.selectionStart;

                // IE Support
                if (dSel && !~navigator.appVersion.indexOf("MSIE 10")) {
                    ctrl.focus();
                    sel = dSel.createRange();
                    sel.moveStart('character', el.is("input") ? -el.val().length : -el.text().length);
                    pos = sel.text.length;
                }
                // Firefox support
                else if (cSelStart || cSelStart === '0') {
                    pos = cSelStart;
                }
                
                return pos;
            },
            setCaret: function(pos) {
                var range, ctrl = el.get(0);

                if (ctrl.setSelectionRange) {
                    ctrl.focus();
                    ctrl.setSelectionRange(pos,pos);
                } else if (ctrl.createTextRange) {
                    range = ctrl.createTextRange();
                    range.collapse(true);
                    range.moveEnd('character', pos);
                    range.moveStart('character', pos);
                    range.select();
                }
            },
            events: function() {
                el.on('keydown.mask', function() {
                    old_value = p.val();
                });
                el.on('keyup.mask', p.behaviour);
                el.on("paste.mask drop.mask", function() {
                    setTimeout(function() {
                        el.keydown().keyup();
                    }, 100);
                });
                el.on("change.mask", function() {
                    el.data("changeCalled", true);
                });
                el.on("blur.mask", function(e){
                    var el = $(e.target)
                    if (el.prop("defaultValue") != el.val()) {
                        el.prop("defaultValue", el.val())
                        if(!el.data("changeCalled"))
                            el.trigger("change");
                    }
                    el.data("changeCalled", false);
                });
            },
            destroyEvents: function() {
                el.off('keydown.mask keyup.mask paste.mask drop.mask change.mask blur.mask').removeData("changeCalled");
            },
            val: function(v) {
                var isInput = el.is('input');
                return arguments.length > 0 
                    ? (isInput ? el.val(v) : el.text(v)) 
                    : (isInput ? el.val() : el.text());
            },
            getMaskCharactersBeforeCount: function(index) {
                var count = 0;
                for (var i = 0; i <= index; i++) {
                    var translation = jMask.translation[mask.charAt(i)];
                    if (!translation) {
                        count++;
                    }
                }
                return count;
            },
            behaviour: function(e) {
                e = e || window.event;
                var keyCode = e.keyCode || e.which;

                var determineCaretPos = function (caretPos) {
                    var translation = jMask.translation[mask.charAt(caretPos - 1)];
                    if (!translation) {
                        caretPos = determineCaretPos(caretPos + 1);
                    } else {
                        caretPos = Math.min(caretPos + newValL - currValL - maskDif, newValL);
                    }
                    return caretPos;
                };

                if ($.inArray(keyCode, jMask.byPassKeys) === -1) {

                    var caretPos = p.getCaret(),
                        currVal = p.val(),
                        currValL = currVal.length,
                        changeCaret = caretPos < currValL;

                    var newVal = p.getMasked(),
                        newValL = newVal.length,
                        maskDif = p.getMaskCharactersBeforeCount(newValL) - p.getMaskCharactersBeforeCount(currValL);
                    if (newVal !== currVal) {
                        p.val(newVal);
                    }

                    // change caret but avoid CTRL+A
                    if (changeCaret && !(keyCode === 65 && e.ctrlKey)) {
                        // Avoid adjusting caret on backspace or delete
                        if (!(keyCode === 8 || keyCode === 46)) {
                            caretPos = determineCaretPos(caretPos);
                        }
                        p.setCaret(caretPos);
                    }

                    return p.callbacks(e);
                }
            },
            getMasked: function (skipMaskChars) {
                var buf = [],
                    value = p.val(),
                    m = 0, maskLen = mask.length,
                    v = 0, valLen = value.length,
                    offset = 1, addMethod = "push",
                    resetPos = -1,
                    lastMaskChar,
                    check;

                if (options.reverse) {
                    addMethod = "unshift";
                    offset = -1;
                    lastMaskChar = 0;
                    m = maskLen - 1;
                    v = valLen - 1;
                    check = function () {
                        return m > -1 && v > -1;
                    };
                } else {
                    lastMaskChar = maskLen - 1;
                    check = function () {
                        return m < maskLen && v < valLen;
                    };
                }

                while (check()) {
                    var maskDigit = mask.charAt(m),
                        valDigit = value.charAt(v),
                        translation = jMask.translation[maskDigit];

                    if (translation) {
                        if (valDigit.match(translation.pattern)) {
                            buf[addMethod](valDigit);
                             if (translation.recursive) {
                                if (resetPos === -1) {
                                    resetPos = m;
                                } else if (m === lastMaskChar) {
                                    m = resetPos - offset;
                                }

                                if (lastMaskChar === resetPos) {
                                    m -= offset;
                                }
                            }
                            m += offset;
                        } else if (translation.optional) {
                            m += offset;
                            v -= offset;
                        }
                        v += offset;
                    } else {
                        if (!skipMaskChars) {
                            buf[addMethod](maskDigit);
                        }
                        
                        if (valDigit === maskDigit) {
                            v += offset;
                        }

                        m += offset;
                    }
                }
                
                var lastMaskCharDigit = mask.charAt(lastMaskChar);
                if (maskLen === valLen + 1 && !jMask.translation[lastMaskCharDigit]) {
                    buf.push(lastMaskCharDigit);
                }
                
                return buf.join("");
            },
            callbacks: function (e) {
                var val = p.val(),
                    changed = p.val() !== old_value;
                if (changed === true) {
                    if (typeof options.onChange === "function") {
                        options.onChange(val, e, el, options);
                    }
                }

                if (changed === true && typeof options.onKeyPress === "function") {
                    options.onKeyPress(val, e, el, options);
                }

                if (typeof options.onComplete === "function" && val.length === mask.length) {
                    options.onComplete(val, e, el, options);
                }
            }
        };

        // public methods
        jMask.remove = function() {
            var caret = p.getCaret();
            var maskedCharacterCountBefore = p.getMaskCharactersBeforeCount(caret);
            p.destroyEvents();
            p.val(jMask.getCleanVal()).removeAttr('maxlength');
            p.setCaret(caret - maskedCharacterCountBefore);
        };

        // get value without mask
        jMask.getCleanVal = function() {
           return p.getMasked(true);
        };

        jMask.init();
    };

    $.fn.mask = function(mask, options) {
        this.unmask();
        return this.each(function() {
            $(this).data('mask', new Mask(this, mask, options));
        });
    };

    $.fn.unmask = function() {
        return this.each(function() {
            try {
                $(this).data('mask').remove();
            } catch (e) {}
        });
    };

    $.fn.cleanVal = function() {
        return $(this).data('mask').getCleanVal();
    };

    // looking for inputs with data-mask attribute
    $('*[data-mask]').each(function() {
        var input = $(this),
            options = {};

        if (input.attr('data-mask-reverse') === 'true') {
            options.reverse = true;
        }

        if (input.attr('data-mask-maxlength') === 'false') {
            options.maxlength = false;
        }

        input.mask(input.attr('data-mask'), options);
    });

}));
