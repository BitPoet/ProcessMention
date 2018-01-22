CKEDITOR.plugins.add("pwmentions", {
    init: function(editor) {
        new CKEDITOR.plugins.pwmentions(editor);
    }
});

CKEDITOR.plugins.pwmentions = function(editor) {

	this.mention = editor.config.mention;
	
	this.cur = null;
	this.listenInside = null;
	this.listenEvent = null;
	this.lastResultLength = 0;
	this.notFoundCalls = 0;
	
    this.ajaxObj = null;
    this.results = null;
    
    // Initialize listeners
    this.listenForAtSymbol = function() {
    	
    	// Activate change event on ckeditor field
        this.listenEvent = editor.on("change", function(a) {
        	
            CKEDITOR.tools.setTimeout(function() {
            	
                var sel = editor.getSelection();
                
                if (sel.getType() == CKEDITOR.SELECTION_TEXT) {
                	
                    for (var a = sel.getRanges(true), b = 0; b < a.length; b++) {
                    	
                    	// Set start of selection correctly if collapsed to really determine
                    	// the first char later
	                    if(a[b].collapsed && a[b].startOffset) {
	                    	a[b].setStart(a[b].startContainer, 0);
	                    }
	                    
	                    // Start mention autocomplete if selection starts with @ sign
	                    if(a[b].cloneContents().$.textContent.substr(-1) == "@")
	                    {
	                    	this.startListening(a[b]);
	                    }
	                    
	                }
	            
                } 
            
            }, 0, this);
        
        }, this);
    
    };
    
    // autocomplete initialization
    this.startListening = function(rng) {
    	
        var c = rng.cloneContents().$.textContent;
        
        if (c.length <= 1 || c.substr(-2, 1).match(/\s/)) {
        	
            this.listenEvent.removeListener();
            this.cur = new CKEDITOR.dom.element("span");
            this.cur.setText("@");
            
            if (rng.endContainer instanceof CKEDITOR.dom.element) {
            	
                for (var b, f = rng.endContainer.getChildren(), c = f.count(); 0 <= c; c--) {
                    var e = f.getItem(c);
                    if (e instanceof CKEDITOR.dom.text &&
                        "@" == e.getText()) {
                        b = e;
                        break
                    }
                }
                
                if (!b) return;
                
            } else {
            	
            	b = rng.endContainer.split(rng.endOffset - 1);
            	
            }
            
            b.split(1);
            this.cur.replace(b);
            b = editor.createRange();
            b.moveToPosition(this.cur, CKEDITOR.POSITION_BEFORE_END);
            editor.getSelection().selectRanges([b]);
            
            this.lastResultLength = 0;
            this.notFoundCalls = 0;
            
            // Setup results list
            this.results = $('<ul class="pwmentions"></ul>')/*.hide()*/;
            this.results.append('<li uk-spinner class="uk-text-primary uk-text-large">&nbsp;</li>');
            
            $("body").append(this.results);
            
            this.showResults(rng);
            this.listenInside = editor.on("key", this.listenInsideEvent, this);
        }
    };
    
    // show results list
    // ToDo: Positioning is still off!!!
    this.showResults = function(rng) {
    	
    	if(rng && rng.getNextEditableNode() && rng.getNextEditableNode().getSize("height")) {
    		
    		var pos = this.getAbsolutePosition(this.cur.$);
    		
    		$(this.results).css({
    			left:			'' + (pos.left - 10) + 'px',
    			top:			'' + (pos.top + rng.getNextEditableNode().getSize("height") + 5) + 'px'
    		});
    		
    	}
    	
    	return;
    };
    
    // Since CKEditor uses an iframe, regular offset/position methods to
    // determine the position for the dropdown don't work. We need to
    // add the iframe's offset in that case.
	this.getAbsolutePosition = function(target) {

	    var target_body = $(target).parents('body');
	    if ($('body').get(0) === target_body.get(0)) {
	        return target.offset();
	    }
	    
	    // find the corresponding iframe container                                 
	    var iframe = $('iframe').filter(function() {
	        var iframe_body = $(this).contents().find('body');
	        return target_body.get(0) === iframe_body.get(0);
	    });
	    
	    var left = $(iframe).offset().left + $(target).offset().left;
	    var top = $(iframe).offset().top + $(target).offset().top;

		return {left: left, top: top};
	}
	
    // Keyboard control for selection list
    this.listenInsideEvent = function(a) {
    	
        if(a.data.keyCode == 27) {
        	
        	this.cancelMention();
        	this.closeResults();
        	
        } else if (a.data.keyCode == 40 || a.data.keyCode == 38) {
        	
            var c = this.results.children("[data-selected]");
            
            if(c.length) {
            	
            	c.removeAttr("data-selected");
            	
            	if(a.data.keyCode == 40) {
            		c.next().attr("data-selected", true);
            	} else {
            		c.prev().attr("data-selected", true);
            	}
            	
            } else {
            	
            	if(a.data.keyCode == 40) {
            		this.results.children(":first-child").attr("data-selected", true);
            	} else {
            		this.results.children(":last-child").attr("data-selected", true);
            	}
            	
            }
            a.cancel();
            
        } else {
        	
        	if(a.data.keyCode == 13 || a.data.keyCode == 9) {
        		
        		c = this.results.children("[data-selected]");
        		
        		if(c.length) {
        			
        			c.click();
        			a.cancel();
        			
        		} else {
        			
        			if(a.data.keyCode == 13) {
        				
        				this.cancelMention();
        				this.closeResults();
        			
        			}
        		}
        		
        	} else {
        				
				if(a.data.keyCode == 8) {
					
					this.notFoundCalls = 0;
					
				}
					
				CKEDITOR.tools.setTimeout(function() {
	
		            if (this.cur.getText().length) {
		            	
		                for (var a = editor.getSelection().getRanges(), c = 0; c < a.length; c++) {
		                    if (!a[c].getCommonAncestor(true, true).equals(this.cur)) {
		                        this.cancelMention();
		                        this.closeResults();
		                        return
		                    }
						}
						
		                var e = this.cur.getText().substr(1).trim();
		                this.results.show();
		                this.showResults();

		                if (this.ajaxObj &&  this.ajaxObj.abort && typeof this.ajaxObj.abort === 'function') try {
		                    this.ajaxObj.abort()
		                } catch (g) {}

		                var thisObj = this;

		                this.ajaxObj = $.post(
	                		this.mention.url,
	                		{
	                			filter:			e,
	                			field:			this.mention.field
	                		},
							function(data) {
	                			if(data) {
	                				thisObj.lastResultLength = data.length;
	                				thisObj.results.removeClass('pwmentionsloading');
	                				thisObj.results.empty();
	                				
	                				for(var i = 0, l = data.length; i < l; i++) {
	                					var row = data[i];
	                					
	                					var resTpl = '' + thisObj.mention.tplResult;
	                					var cols = thisObj.mention.columns;
	                					
	                					for(var cl = cols.length, j = 0; j < cl; j++) {
	                						var re = new RegExp('\\{' + cols[j] + '\\}', 'g');
	                						resTpl = resTpl.replace(re, row[cols[j]]);
	                					}
	                					
	                					var $resRow = $(resTpl);
	                					
	                					for(var cl = cols.length, j = 0; j < cl; j++) {
											$resRow.attr('data-' + cols[j], row[cols[j]]);
										}
										
	                					thisObj.results.append($resRow);
	                				}
	                				
	               					thisObj.results.children().click($.proxy(thisObj.selectMentionResult, thisObj));
	               					
	                			} else {
	                				
	                				if(e.length > 0) {
	                					thisObj.notFoundCalls++;
	                					if(++this.notFoundCalls >= 3) {
	                						thisObj.cancelMention();
	                						thisObj.closeResults();
	                					} else if(this.lastResultLength + 5 <= e.length) {
	                						thisObj.results.hide();
	                					}
	                				}
	                				
	                			}
	                		},
	                		'json'
	                	);
	                	
		            } else {
		            	
		            	this.closeResults();
		            	
		            }
		            
		        }, 50, this);
		        
			}
			
		}
		
	};
    
    // Insert link from selection
    this.selectMentionResult = function(a) {
    	
        a = $(a.currentTarget);
        
        var newTpl = this.mention.tplLink;

        newTpl = newTpl.replace(/\{([^}]+)}/g, function(allmatch, capture) {
        	return a.attr('data-' + capture);
        });
        
        var newEl = new CKEDITOR.dom.element($(newTpl)[0]);
        newEl.replace(this.cur);
        this.cur = newEl;

        editor.focus();
        a = editor.createRange();
        a.moveToElementEditEnd(this.cur);
        editor.getSelection().selectRanges([a]);
        this.closeResults()
        
    };
    
    this.cancelMention = function() {
    	
        if(this.cur) this.cur.remove(true);
        
    };
    
    this.closeResults = function() {
    	
        this.cur = null;
        if(this.results) this.results.remove();
        if(this.listenInside) this.listenInside.removeListener();
        this.listenForAtSymbol();
        
    };
    
    // Start up the engine
    this.listenForAtSymbol();
    
};
