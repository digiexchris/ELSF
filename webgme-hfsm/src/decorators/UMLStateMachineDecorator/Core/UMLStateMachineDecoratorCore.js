/*globals define, _, $*/
/*jshint browser: true, newcap: false*/
/**
 * @author rkereskenyi / https://github.com/rkereskenyi
 */


//TODO does it really work with the fixed paths????
define([
    'js/Constants',
    'js/RegistryKeys',
    'js/NodePropertyNames',
    'js/Widgets/DiagramDesigner/DiagramDesignerWidget.Constants',
    'text!./Diagram.html',
    'text!./InitialState.html',
    'text!./ChoicePseudostate.html',
    'text!./DeepHistoryPseudostate.html',
    'text!./ShallowHistoryPseudostate.html',
    'text!./EndState.html',
    'text!./State.html',
    'text!./Transition.html',
    'bower/highlightjs/highlight.pack.min',
    './Transition',
    './UMLStateMachine.META',
    'css!bower/highlightjs/styles/default.css'
], function (CONSTANTS,
             REGISTRY_KEYS,
             nodePropertyNames,
             DiagramDesignerWidgetConstants,
             DiagramTemplate,
             InitialStateTemplate,
             ChoicePseudostateTemplate,
             DeepHistoryPseudostateTemplate,
             ShallowHistoryPseudostateTemplate,
             EndStateTemplate,
             StateTemplate,
             TransitionTemplate,
	     hljs,
             Transition,
             UMLStateMachineMETA) {
    'use strict';

    var UMLStateMachineDecoratorCore,
        UMLStateMachineDecoratorClass = 'uml-state-machine',
        DEFAULT_CLASS = 'default',
        METATYPETEMPLATE_UMLSTATEDIAGRAM = $(DiagramTemplate),
        METATYPETEMPLATE_INTIAL = $(InitialStateTemplate),
        METATYPETEMPLATE_CHOICE = $(ChoicePseudostateTemplate),
        METATYPETEMPLATE_DEEPHISTORY = $(DeepHistoryPseudostateTemplate),
        METATYPETEMPLATE_SHALLOWHISTORY = $(ShallowHistoryPseudostateTemplate),
        METATYPETEMPLATE_END = $(EndStateTemplate),
        METATYPETEMPLATE_STATE = $(StateTemplate),
        METATYPETEMPLATE_TRANSITION = $(TransitionTemplate);

    UMLStateMachineDecoratorCore = function () {
    };

    UMLStateMachineDecoratorCore.prototype.$DOMBase = $('<div/>', {class: UMLStateMachineDecoratorClass});


    UMLStateMachineDecoratorCore.prototype._initializeDecorator = function (params) {
        this.$name = undefined;

	this.childrenIDs = {};

        this._displayConnectors = false;
        if (params && params.connectors) {
            this._displayConnectors = params.connectors;
        }
    };

    /**** Override from *.WidgetDecoratorBase ****/
    UMLStateMachineDecoratorCore.prototype.getTerritoryQuery = function () {
	var territoryRule = {},
	    gmeID = this._metaInfo[CONSTANTS.GME_ID];
	territoryRule[gmeID] = { children: 1 };
        return territoryRule;
    };


    /**** Override from *.WidgetDecoratorBase ****/
    UMLStateMachineDecoratorCore.prototype.destroy = function () {
    };


    /**** Override from *.WidgetDecoratorBase ****/
    UMLStateMachineDecoratorCore.prototype.doSearch = function (searchDesc) {
        var searchText = searchDesc.toString().toLowerCase(),
            name = this._getName();

        return (name && name.toLowerCase().indexOf(searchText) !== -1);
    };


    UMLStateMachineDecoratorCore.prototype.renderMetaType = function () {
        if (this._metaType && this._metaTypeTemplate) {
            this.$el.append(this._metaTypeTemplate);
        } else {
            this.$el.addClass(DEFAULT_CLASS);
            this.$el.append($('<div/>', {class: 'name'}));
        }

        this.$name = this.$el.find('.name');

        if (this._displayConnectors) {
            this.initializeConnectors();
        } else {
            this.$el.find('.' + DiagramDesignerWidgetConstants.CONNECTOR_CLASS).remove();
        }

        this._renderMetaTypeSpecificParts();
    };

    UMLStateMachineDecoratorCore.prototype.notifyCompoonentEvent = function (events) {
	console.error(events);
    };

    /* TO BE OVERRIDDEN IN META TYPE SPECIFIC CODE */
    UMLStateMachineDecoratorCore.prototype._renderMetaTypeSpecificParts = function () {
    };

    UMLStateMachineDecoratorCore.prototype._getName = function () {
        var client = this._control._client,
            nodeObj = client.getNode(this._gmeID),
            name = '(N/A)';

        if (nodeObj) {
            name = nodeObj.getAttribute(nodePropertyNames.Attributes.name) || name;
	    if (UMLStateMachineMETA.TYPE_INFO.isTransition(this._gmeID)) {
		// show event [ guard ]
		name = '';
		var event = nodeObj.getAttribute('Event'),
		    guard = nodeObj.getAttribute('Guard');
		if (event)
		    name += event;
		if (guard)
		    name += ' ['+guard+']';
	    }
        }
        return name;
    };


    UMLStateMachineDecoratorCore.prototype._renderContent = function () {
        //render GME-ID in the DOM, for debugging
        this._gmeID = this._metaInfo[CONSTANTS.GME_ID];
        this.$el.attr({'data-id': this._gmeID});

        this._instantiateMetaType();

        this.renderMetaType();

        //find placeholders

        this._update();
    };


    /**** Override from PartBrowserWidgetDecoratorBase ****/
    /**** Override from DiagramDesignerWidgetDecoratorBase ****/
    UMLStateMachineDecoratorCore.prototype.update = function () {
        this._update();

    };

    UMLStateMachineDecoratorCore.prototype._update = function () {
	// children related
	var self = this;
	if (this._gmeID) {
	    var nodeObj = this._control._client.getNode(this._gmeID);
	    var newChildren = {};
	    var self = this;
            nodeObj.getChildrenIds().forEach(function (childId) {
		newChildren[childId] = true;
		if (!self.childrenIDs[childId]) {
                    self.childrenIDs[childId] = true;
                    self._control.registerComponentIDForPartID(childId, self._gmeID);
		}
            });

            Object.keys(this.childrenIDs).forEach(function (oldId) {
		if (newChildren.hasOwnProperty(oldId) === false) {
                    self._control.unregisterComponentIDFromPartID(oldId, self._gmeID);
                    delete self.childrenIDs[oldId];
		}
            });
	}
        this._updateName();
        this._updateMetaTypeSpecificParts();
        this._updateColors();
	this._updateInternalTransitions();
    };

    /* TO BE OVERRIDDEN IN META TYPE SPECIFIC CODE */
    UMLStateMachineDecoratorCore.prototype._updateMetaTypeSpecificParts = function () {
	// TODO: do something based on state internal transitions here!
    };

    /***** UPDATE THE NAME OF THE NODE *****/
    UMLStateMachineDecoratorCore.prototype._updateName = function () {
        if (this.$name) {
            this.$name.text(this._getName());
        }
    };

    var entityMap = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;',
	'/': '&#x2F;',
	'`': '&#x60;',
	'=': '&#x3D;'
    };

    function escapeHtml (string) {
	return String(string).replace(/[&<>"'`=\/]/g, function (s) {
	    return entityMap[s];
	});
    }

    function htmlToElement(html) {
	var template = document.createElement('template');
	template.innerHTML = html;
	return template.content.firstChild;
    }

    function getCode(nodeObj, codeAttr, doHighlight, markIncomplete) {
	var originalCode = nodeObj.getAttribute( codeAttr ),
	    code = escapeHtml(originalCode);
	var el = '';
	if (doHighlight) {
	    code = '<code class="cpp">'+code+'</code>';
	    code = htmlToElement(code);
	    hljs.highlightBlock(code);
            /*
	    $(code).css('text-overflow', 'ellipsis');
	    $(code).css('white-space', 'nowrap');
	    $(code).css('overflow', 'hidden');
            */
	    $(code).css('white-space', 'pre');
	    $(code).css('overflow', 'auto');
	    if (originalCode) {
	    }
	    else if (markIncomplete) {
		$(code).css('background-color','rgba(255,0,0,0.5)');
	    }
	    el = code.outerHTML;
	}
	else {
	    el = code;
	}
	return el;
    }

    function addCodeToList(el, event, guard, action) {
	if (event) {
	    var txt = '<li class="internal-transition">'+event;
	    if (guard)
		txt += ' [<font color="gray">'+guard+'</font>]';
	    txt += ' / ';
	    if (action)
		txt += action;
	    txt += '</li>';
	    el.append(txt);
	}
    }

    UMLStateMachineDecoratorCore.prototype._updateInternalTransitions = function() {
        var META_TYPES = UMLStateMachineMETA.getMetaTypes();

	if (this._metaType != META_TYPES.State)
	    return;

	var client = this._control._client,
	    el = this.$el.find('.internal-transitions'),
	    self = this,
	    nodeObj = client.getNode(this._metaInfo[CONSTANTS.GME_ID]),
	    entry = getCode(nodeObj, 'Entry', true, !nodeObj.getAttribute('isComplete')),
	    exit = getCode(nodeObj, 'Exit', true, !nodeObj.getAttribute('isComplete')),
	    tick = getCode(nodeObj, 'Tick', true, !nodeObj.getAttribute('isComplete')),
	    childIDs = nodeObj.getChildrenIds();

	el.empty();
	addCodeToList(el, 'Entry', null, entry);
	addCodeToList(el, 'Exit', null, exit);
	addCodeToList(el, 'Tick', null, tick);
	childIDs.map(function(cid) {
	    if (UMLStateMachineMETA.TYPE_INFO.isInternalTransition(cid)) {
		self.childrenIDs[cid] = true;
		self._control.registerComponentIDForPartID(cid, self._Gmeid);

		var child = client.getNode(cid);
		self._control.registerComponentIDForPartID(cid, self._metaInfo[CONSTANTS.GME_ID]);
		var event = getCode(child, 'Event', false),
		    guard = getCode(child, 'Guard', false),
		    action = getCode(child, 'Action', true, !nodeObj.getAttribute('isComplete'));
		addCodeToList(el, event, guard, action);
	    }
	});
    };

    UMLStateMachineDecoratorCore.prototype._instantiateMetaType = function () {
        var META_TYPES = UMLStateMachineMETA.getMetaTypes();

        if (META_TYPES) {
	    if (UMLStateMachineMETA.TYPE_INFO.isChoice(this._gmeID)) {
                this._metaType = META_TYPES['Choice Pseudostate'];
                this._metaTypeTemplate = METATYPETEMPLATE_CHOICE.clone();
	    } else if (UMLStateMachineMETA.TYPE_INFO.isDeepHistory(this._gmeID)) {
                this._metaType = META_TYPES['Deep History Pseudostate'];
                this._metaTypeTemplate = METATYPETEMPLATE_DEEPHISTORY.clone();
	    } else if (UMLStateMachineMETA.TYPE_INFO.isShallowHistory(this._gmeID)) {
                this._metaType = META_TYPES['Shallow History Pseudostate'];
                this._metaTypeTemplate = METATYPETEMPLATE_SHALLOWHISTORY.clone();
	    } else if (UMLStateMachineMETA.TYPE_INFO.isInitial(this._gmeID)) {
                this._metaType = META_TYPES.Initial;
                this._metaTypeTemplate = METATYPETEMPLATE_INTIAL.clone();
            } else if (UMLStateMachineMETA.TYPE_INFO.isEnd(this._gmeID)) {
                this._metaType = META_TYPES['End State'];
                this._metaTypeTemplate = METATYPETEMPLATE_END.clone();
            } else if (UMLStateMachineMETA.TYPE_INFO.isState(this._gmeID)) {
                this._metaType = META_TYPES.State;
                this._metaTypeTemplate = METATYPETEMPLATE_STATE.clone();
            } else if (UMLStateMachineMETA.TYPE_INFO.isTransition(this._gmeID)) {
                this._metaType = META_TYPES['External Transition'];
                this._metaTypeTemplate = METATYPETEMPLATE_TRANSITION.clone();
                _.extend(this, new Transition());
            } else if (UMLStateMachineMETA.TYPE_INFO.isStateMachine(this._gmeID)) {
                this._metaType = META_TYPES.StateMachine;
                this._metaTypeTemplate = METATYPETEMPLATE_UMLSTATEDIAGRAM.clone();
            }
        }
    };


    UMLStateMachineDecoratorCore.prototype._updateColors = function () {
        var el;
        this._getNodeColorsFromRegistry();

        if (this.fillColor && this._metaTypeTemplate) {
            if (UMLStateMachineMETA.TYPE_INFO.isInitial(this._gmeID)) {
                el = this._metaTypeTemplate.find('.icon');
                if (el) {
                    el.css({
                        'background-color': this.fillColor,
                        'border-color': this.fillColor
                    });
                }
            } else if (UMLStateMachineMETA.TYPE_INFO.isEnd(this._gmeID)) {
                el = this._metaTypeTemplate.find('.icon');
                if (el) {
                    el.css({'border-color': this.fillColor});
                    el = el.find('.inner');
                    if (el) {
                        el.css({
                            'background-color': this.fillColor,
                            'border-color': this.fillColor
                        });
                    }
                }
            } else if (UMLStateMachineMETA.TYPE_INFO.isChoice(this._gmeID)) {
                this._metaTypeTemplate.css({'border-color': this.fillColor});
            } else if (UMLStateMachineMETA.TYPE_INFO.isDeepHistory(this._gmeID)) {
                this._metaTypeTemplate.css({'border-color': this.fillColor});
            } else if (UMLStateMachineMETA.TYPE_INFO.isShallowHistory(this._gmeID)) {
                this._metaTypeTemplate.css({'border-color': this.fillColor});
            } else if (UMLStateMachineMETA.TYPE_INFO.isState(this._gmeID)) {
                this._metaTypeTemplate.css({'background-color': this.fillColor});
            } else if (UMLStateMachineMETA.TYPE_INFO.isTransition(this._gmeID)) {
                // Do nothing
            } else if (UMLStateMachineMETA.TYPE_INFO.isStateMachine(this._gmeID)) {
                this._metaTypeTemplate.css({'background-color': this.fillColor});
            }
        }

        if (this.borderColor && this._metaTypeTemplate) {
            if (UMLStateMachineMETA.TYPE_INFO.isInitial(this._gmeID)) {
                // Do nothing
            } else if (UMLStateMachineMETA.TYPE_INFO.isEnd(this._gmeID)) {
                el = this._metaTypeTemplate.find('.icon');
                if (el) {
                    el.css({'background-color': this.borderColor});
                }
            } else {
                this._metaTypeTemplate.css({'border-color': this.borderColor});
            }
        }

        if (this.textColor) {
            this.$el.css({color: this.textColor});
        } else {
            this.$el.css({color: ''});
        }
    };

    UMLStateMachineDecoratorCore.prototype._getNodeColorsFromRegistry = function () {
        var objID = this._metaInfo[CONSTANTS.GME_ID];
        this.fillColor = this.preferencesHelper.getRegistry(objID, REGISTRY_KEYS.COLOR, true);
        this.borderColor = this.preferencesHelper.getRegistry(objID, REGISTRY_KEYS.BORDER_COLOR, true);
        this.textColor = this.preferencesHelper.getRegistry(objID, REGISTRY_KEYS.TEXT_COLOR, true);
    };


    return UMLStateMachineDecoratorCore;
});
